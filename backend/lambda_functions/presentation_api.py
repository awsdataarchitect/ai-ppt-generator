"""
Presentation API Lambda function
Handles CRUD operations for presentations with AWS services integration
"""
import json
import boto3
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import os
import uuid

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# AWS clients
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')
bedrock_client = boto3.client('bedrock-runtime')

# Environment variables
PRESENTATIONS_TABLE = os.environ.get('PRESENTATIONS_TABLE', 'ai-ppt-presentations')
ASSETS_BUCKET = os.environ.get('ASSETS_BUCKET', 'ai-ppt-assets-1753907139782')

# DynamoDB table
presentations_table = dynamodb.Table(PRESENTATIONS_TABLE)

def lambda_handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    """
    Main Lambda handler for presentation API operations
    """
    try:
        # Parse the event
        http_method = event.get('httpMethod', '')
        path = event.get('path', '')
        body = json.loads(event.get('body', '{}')) if event.get('body') else {}
        query_params = event.get('queryStringParameters') or {}
        path_params = event.get('pathParameters') or {}
        
        # Get user from Cognito
        user_id = get_user_id_from_event(event)
        if not user_id:
            return create_response(401, {'error': 'Unauthorized'})
        
        logger.info(f"Processing {http_method} {path} for user {user_id}")
        
        # Route to appropriate handler
        if http_method == 'GET' and path == '/presentations':
            return list_presentations(user_id, query_params)
        elif http_method == 'POST' and path == '/presentations':
            return create_presentation(user_id, body)
        elif http_method == 'GET' and path.startswith('/presentations/'):
            presentation_id = path_params.get('id')
            return get_presentation(user_id, presentation_id)
        elif http_method == 'PUT' and path.startswith('/presentations/'):
            presentation_id = path_params.get('id')
            return update_presentation(user_id, presentation_id, body)
        elif http_method == 'DELETE' and path.startswith('/presentations/'):
            presentation_id = path_params.get('id')
            return delete_presentation(user_id, presentation_id)
        elif http_method == 'POST' and path.endswith('/generate-ai'):
            presentation_id = path_params.get('id')
            return generate_ai_content(user_id, presentation_id, body)
        elif http_method == 'POST' and path.endswith('/export'):
            presentation_id = path_params.get('id')
            return export_presentation(user_id, presentation_id, body)
        else:
            return create_response(404, {'error': 'Not found'})
            
    except Exception as e:
        logger.error(f"Error in presentation API: {str(e)}")
        return create_response(500, {'error': 'Internal server error'})

def get_user_id_from_event(event: Dict[str, Any]) -> Optional[str]:
    """Extract user ID from Cognito JWT token"""
    try:
        # In API Gateway with Cognito authorizer, user info is in requestContext
        request_context = event.get('requestContext', {})
        authorizer = request_context.get('authorizer', {})
        claims = authorizer.get('claims', {})
        return claims.get('sub')
    except Exception as e:
        logger.error(f"Error extracting user ID: {str(e)}")
        return None

def list_presentations(user_id: str, query_params: Dict[str, Any]) -> Dict[str, Any]:
    """List user's presentations"""
    try:
        # Query presentations for user
        response = presentations_table.scan(
            FilterExpression='userId = :userId',
            ExpressionAttributeValues={':userId': user_id}
        )
        
        presentations = response.get('Items', [])
        
        # Sort by updatedAt descending
        presentations.sort(key=lambda x: x.get('updatedAt', ''), reverse=True)
        
        return create_response(200, {
            'presentations': presentations,
            'total': len(presentations)
        })
        
    except Exception as e:
        logger.error(f"Error listing presentations: {str(e)}")
        return create_response(500, {'error': 'Failed to list presentations'})

def create_presentation(user_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new presentation"""
    try:
        # Validate required fields
        title = body.get('title', '').strip()
        if not title:
            return create_response(400, {'error': 'Title is required'})
        
        # Generate presentation ID
        presentation_id = str(uuid.uuid4())
        current_time = datetime.now(timezone.utc).isoformat()
        
        # Create presentation data
        presentation = {
            'id': presentation_id,
            'userId': user_id,
            'title': title,
            'description': body.get('description', '').strip(),
            'template': body.get('template', 'custom'),
            'status': 'DRAFT',
            'createdAt': current_time,
            'updatedAt': current_time,
            'slideCount': 0,
            'slides': [],
            'theme': {
                'name': 'default',
                'primaryColor': '#2563eb',
                'backgroundColor': '#ffffff',
                'textColor': '#1f2937',
                'fontFamily': 'Inter'
            }
        }
        
        # Handle AI generation if requested
        ai_prompt = body.get('aiPrompt')
        if ai_prompt and ai_prompt.strip():
            try:
                ai_content = generate_ai_slides(ai_prompt.strip(), presentation['template'])
                presentation['slides'] = ai_content.get('slides', [])
                presentation['slideCount'] = len(presentation['slides'])
                presentation['aiGenerationMetadata'] = {
                    'model': 'amazon.nova-pro-v1:0',
                    'prompt': ai_prompt.strip(),
                    'generatedAt': current_time
                }
            except Exception as e:
                logger.error(f"AI generation failed: {str(e)}")
                # Continue without AI content
        
        # Save to DynamoDB
        presentations_table.put_item(Item=presentation)
        
        logger.info(f"Created presentation {presentation_id} for user {user_id}")
        return create_response(201, presentation)
        
    except Exception as e:
        logger.error(f"Error creating presentation: {str(e)}")
        return create_response(500, {'error': 'Failed to create presentation'})

def get_presentation(user_id: str, presentation_id: str) -> Dict[str, Any]:
    """Get a specific presentation"""
    try:
        if not presentation_id:
            return create_response(400, {'error': 'Presentation ID is required'})
        
        # Get presentation from DynamoDB
        response = presentations_table.get_item(Key={'id': presentation_id})
        presentation = response.get('Item')
        
        if not presentation:
            return create_response(404, {'error': 'Presentation not found'})
        
        # Check ownership
        if presentation.get('userId') != user_id:
            return create_response(403, {'error': 'Access denied'})
        
        return create_response(200, presentation)
        
    except Exception as e:
        logger.error(f"Error getting presentation: {str(e)}")
        return create_response(500, {'error': 'Failed to get presentation'})

def update_presentation(user_id: str, presentation_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
    """Update a presentation"""
    try:
        if not presentation_id:
            return create_response(400, {'error': 'Presentation ID is required'})
        
        # Get existing presentation
        response = presentations_table.get_item(Key={'id': presentation_id})
        presentation = response.get('Item')
        
        if not presentation:
            return create_response(404, {'error': 'Presentation not found'})
        
        # Check ownership
        if presentation.get('userId') != user_id:
            return create_response(403, {'error': 'Access denied'})
        
        # Update fields
        current_time = datetime.now(timezone.utc).isoformat()
        
        if 'title' in body:
            presentation['title'] = body['title'].strip()
        if 'description' in body:
            presentation['description'] = body['description'].strip()
        if 'slides' in body:
            presentation['slides'] = body['slides']
            presentation['slideCount'] = len(body['slides'])
        if 'status' in body:
            presentation['status'] = body['status']
        if 'theme' in body:
            presentation['theme'] = body['theme']
        
        presentation['updatedAt'] = current_time
        
        # Save to DynamoDB
        presentations_table.put_item(Item=presentation)
        
        logger.info(f"Updated presentation {presentation_id} for user {user_id}")
        return create_response(200, presentation)
        
    except Exception as e:
        logger.error(f"Error updating presentation: {str(e)}")
        return create_response(500, {'error': 'Failed to update presentation'})

def delete_presentation(user_id: str, presentation_id: str) -> Dict[str, Any]:
    """Delete a presentation"""
    try:
        if not presentation_id:
            return create_response(400, {'error': 'Presentation ID is required'})
        
        # Get existing presentation
        response = presentations_table.get_item(Key={'id': presentation_id})
        presentation = response.get('Item')
        
        if not presentation:
            return create_response(404, {'error': 'Presentation not found'})
        
        # Check ownership
        if presentation.get('userId') != user_id:
            return create_response(403, {'error': 'Access denied'})
        
        # Delete from DynamoDB
        presentations_table.delete_item(Key={'id': presentation_id})
        
        # TODO: Delete associated assets from S3
        
        logger.info(f"Deleted presentation {presentation_id} for user {user_id}")
        return create_response(200, {'message': 'Presentation deleted successfully'})
        
    except Exception as e:
        logger.error(f"Error deleting presentation: {str(e)}")
        return create_response(500, {'error': 'Failed to delete presentation'})

def generate_ai_content(user_id: str, presentation_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
    """Generate AI content for presentation using Bedrock Nova Pro"""
    try:
        prompt = body.get('prompt', '').strip()
        if not prompt:
            return create_response(400, {'error': 'Prompt is required'})
        
        # Get existing presentation
        response = presentations_table.get_item(Key={'id': presentation_id})
        presentation = response.get('Item')
        
        if not presentation or presentation.get('userId') != user_id:
            return create_response(404, {'error': 'Presentation not found'})
        
        # Generate AI content
        ai_content = generate_ai_slides(prompt, presentation.get('template', 'custom'))
        
        # Update presentation with AI content
        current_time = datetime.now(timezone.utc).isoformat()
        presentation['slides'] = ai_content.get('slides', [])
        presentation['slideCount'] = len(presentation['slides'])
        presentation['updatedAt'] = current_time
        presentation['aiGenerationMetadata'] = {
            'model': 'amazon.nova-pro-v1:0',
            'prompt': prompt,
            'generatedAt': current_time
        }
        
        # Save to DynamoDB
        presentations_table.put_item(Item=presentation)
        
        return create_response(200, {
            'slides': presentation['slides'],
            'slideCount': presentation['slideCount'],
            'aiGenerationMetadata': presentation['aiGenerationMetadata']
        })
        
    except Exception as e:
        logger.error(f"Error generating AI content: {str(e)}")
        return create_response(500, {'error': 'Failed to generate AI content'})

def generate_ai_slides(prompt: str, template: str) -> Dict[str, Any]:
    """Generate slides using Bedrock Nova Pro"""
    try:
        # Prepare the request for Nova Pro
        system_prompt = f"""You are an expert presentation creator. Create a professional presentation based on the user's prompt.

Template: {template}
User Prompt: {prompt}

Generate a JSON response with the following structure:
{{
    "slides": [
        {{
            "id": "slide-1",
            "type": "TITLE",
            "title": "Presentation Title",
            "content": "Subtitle or brief description",
            "layout": "TITLE_SLIDE",
            "order": 1
        }},
        {{
            "id": "slide-2",
            "type": "CONTENT",
            "title": "Slide Title",
            "content": "Slide content with bullet points or paragraphs",
            "layout": "TITLE_AND_CONTENT",
            "order": 2
        }}
    ]
}}

Create 5-10 slides that are professional, engaging, and relevant to the prompt. Include a title slide and conclusion slide."""

        request_body = {
            "messages": [
                {
                    "role": "user",
                    "content": system_prompt
                }
            ],
            "max_tokens": 4000,
            "temperature": 0.7,
            "top_p": 0.9
        }

        # Call Bedrock Nova Pro
        response = bedrock_client.invoke_model(
            modelId="amazon.nova-pro-v1:0",
            body=json.dumps(request_body)
        )

        # Parse response
        response_body = json.loads(response['body'].read())
        content = response_body.get('content', [{}])[0].get('text', '')
        
        # Extract JSON from response
        try:
            # Find JSON in the response
            start_idx = content.find('{')
            end_idx = content.rfind('}') + 1
            if start_idx != -1 and end_idx != -1:
                json_content = content[start_idx:end_idx]
                ai_result = json.loads(json_content)
                return ai_result
        except:
            pass
        
        # Fallback: create basic slides
        return {
            "slides": [
                {
                    "id": "slide-1",
                    "type": "TITLE",
                    "title": "AI Generated Presentation",
                    "content": "Created with Amazon Bedrock Nova Pro",
                    "layout": "TITLE_SLIDE",
                    "order": 1
                },
                {
                    "id": "slide-2",
                    "type": "CONTENT",
                    "title": "Content Overview",
                    "content": f"Based on your prompt: {prompt[:100]}...",
                    "layout": "TITLE_AND_CONTENT",
                    "order": 2
                }
            ]
        }
        
    except Exception as e:
        logger.error(f"Error calling Bedrock Nova Pro: {str(e)}")
        raise e

def export_presentation(user_id: str, presentation_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
    """Export presentation in various formats"""
    try:
        export_format = body.get('format', 'html').lower()
        if export_format not in ['html', 'revealjs', 'marp']:
            return create_response(400, {'error': 'Invalid export format'})
        
        # Get presentation
        response = presentations_table.get_item(Key={'id': presentation_id})
        presentation = response.get('Item')
        
        if not presentation or presentation.get('userId') != user_id:
            return create_response(404, {'error': 'Presentation not found'})
        
        # Generate export content based on format
        if export_format == 'html':
            export_content = generate_html_export(presentation)
        elif export_format == 'revealjs':
            export_content = generate_revealjs_export(presentation)
        elif export_format == 'marp':
            export_content = generate_marp_export(presentation)
        
        # Upload to S3
        export_key = f"exports/{user_id}/{presentation_id}/{export_format}.{get_file_extension(export_format)}"
        s3_client.put_object(
            Bucket=ASSETS_BUCKET,
            Key=export_key,
            Body=export_content,
            ContentType=get_content_type(export_format),
            Metadata={
                'presentation-id': presentation_id,
                'user-id': user_id,
                'export-format': export_format,
                'generated-at': datetime.now(timezone.utc).isoformat()
            }
        )
        
        # Generate presigned URL
        download_url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': ASSETS_BUCKET, 'Key': export_key},
            ExpiresIn=3600  # 1 hour
        )
        
        return create_response(200, {
            'downloadUrl': download_url,
            'format': export_format.upper(),
            'expiresAt': (datetime.now(timezone.utc).timestamp() + 3600) * 1000
        })
        
    except Exception as e:
        logger.error(f"Error exporting presentation: {str(e)}")
        return create_response(500, {'error': 'Failed to export presentation'})

def generate_html_export(presentation: Dict[str, Any]) -> str:
    """Generate standalone HTML export"""
    slides = presentation.get('slides', [])
    title = presentation.get('title', 'Presentation')
    theme = presentation.get('theme', {})
    
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>
        body {{
            font-family: {theme.get('fontFamily', 'Arial, sans-serif')};
            margin: 0;
            padding: 0;
            background: {theme.get('backgroundColor', '#ffffff')};
            color: {theme.get('textColor', '#333333')};
        }}
        .presentation {{
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }}
        .slide {{
            min-height: 600px;
            padding: 40px;
            margin-bottom: 40px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            background: white;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }}
        .slide h1 {{
            color: {theme.get('primaryColor', '#2563eb')};
            font-size: 2.5rem;
            margin-bottom: 1rem;
        }}
        .slide h2 {{
            color: {theme.get('primaryColor', '#2563eb')};
            font-size: 2rem;
            margin-bottom: 1rem;
        }}
        .slide-content {{
            font-size: 1.1rem;
            line-height: 1.6;
        }}
        .navigation {{
            position: fixed;
            bottom: 20px;
            right: 20px;
            display: flex;
            gap: 10px;
        }}
        .nav-btn {{
            padding: 10px 15px;
            background: {theme.get('primaryColor', '#2563eb')};
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }}
    </style>
</head>
<body>
    <div class="presentation">
"""
    
    for i, slide in enumerate(slides):
        slide_title = slide.get('title', '')
        slide_content = slide.get('content', '')
        
        html_content += f"""
        <div class="slide" id="slide-{i+1}">
            {"<h1>" + slide_title + "</h1>" if slide.get('type') == 'TITLE' else "<h2>" + slide_title + "</h2>" if slide_title else ""}
            <div class="slide-content">
                {slide_content.replace('\n', '<br>')}
            </div>
        </div>
        """
    
    html_content += """
    </div>
    <div class="navigation">
        <button class="nav-btn" onclick="window.print()">Print</button>
    </div>
</body>
</html>"""
    
    return html_content

def generate_revealjs_export(presentation: Dict[str, Any]) -> str:
    """Generate Reveal.js export"""
    # Implementation similar to existing reveal.js generator
    return generate_html_export(presentation)  # Simplified for now

def generate_marp_export(presentation: Dict[str, Any]) -> str:
    """Generate Marp markdown export"""
    slides = presentation.get('slides', [])
    title = presentation.get('title', 'Presentation')
    
    marp_content = f"""---
marp: true
theme: default
class: lead
paginate: true
backgroundColor: #fff
---

# {title}

Generated with AI PPT Generator

---

"""
    
    for slide in slides[1:]:  # Skip title slide
        slide_title = slide.get('title', '')
        slide_content = slide.get('content', '')
        
        marp_content += f"""
## {slide_title}

{slide_content}

---

"""
    
    return marp_content.strip()

def get_file_extension(format_type: str) -> str:
    """Get file extension for export format"""
    extensions = {
        'html': 'html',
        'revealjs': 'html',
        'marp': 'md'
    }
    return extensions.get(format_type, 'html')

def get_content_type(format_type: str) -> str:
    """Get content type for export format"""
    content_types = {
        'html': 'text/html',
        'revealjs': 'text/html',
        'marp': 'text/markdown'
    }
    return content_types.get(format_type, 'text/html')

def create_response(status_code: int, body: Dict[str, Any]) -> Dict[str, Any]:
    """Create HTTP response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        'body': json.dumps(body)
    }

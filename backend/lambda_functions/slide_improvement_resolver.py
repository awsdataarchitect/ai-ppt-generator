"""
AI Slide Improvement Resolver
Enhances individual slides using Amazon Bedrock Nova Pro with context awareness
"""

import json
import boto3
import os
import logging
from typing import Dict, Any, List
from datetime import datetime

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
from botocore.config import Config
bedrock_config = Config(
    read_timeout=300,
    retries={'max_attempts': 3}
)
bedrock_runtime = boto3.client('bedrock-runtime', config=bedrock_config)
dynamodb = boto3.resource('dynamodb')

# Environment variables
PRESENTATIONS_TABLE_NAME = os.environ.get('PRESENTATIONS_TABLE_NAME', '')
presentations_table = dynamodb.Table(PRESENTATIONS_TABLE_NAME) if PRESENTATIONS_TABLE_NAME else None

def lambda_handler(event, context):
    """
    Lambda handler for AI slide improvement
    """
    try:
        # Extract user ID from event context
        user_id = event.get('identity', {}).get('sub')
        if not user_id:
            return {
                "success": False,
                "message": "User authentication required",
                "improvedContent": "",
                "originalContent": "",
                "improvementSuggestions": []
            }
        
        # Get arguments
        arguments = event.get('arguments', {})
        presentation_id = arguments.get('presentationId')
        slide_index = arguments.get('slideIndex')
        current_content = arguments.get('currentContent')
        context = arguments.get('context')  # New context parameter
        
        if not all([presentation_id, slide_index is not None, current_content]):
            return {
                "success": False,
                "message": "Missing required parameters",
                "improvedContent": "",
                "originalContent": current_content or "",
                "improvementSuggestions": []
            }
        
        # Improve slide with AI using context
        return improve_slide_with_ai(presentation_id, slide_index, current_content, user_id, context)
        
    except Exception as e:
        logger.error(f"Slide improvement resolver error: {e}")
        return {
            "success": False,
            "message": f"Error improving slide: {str(e)}",
            "improvedContent": "",
            "originalContent": arguments.get('currentContent', ''),
            "improvementSuggestions": []
        }

def improve_slide_with_ai(presentation_id: str, slide_index: int, current_content: str, user_id: str, context: str = None) -> Dict[str, Any]:
    """
    Improve slide content using AI with context awareness
    """
    try:
        # Get presentation context for better improvement
        presentation_context = get_presentation_context(presentation_id, user_id)
        
        # Generate improvement suggestions with context
        improvement_result = generate_slide_improvements(
            current_content, 
            slide_index, 
            presentation_context,
            context  # Pass the extracted context
        )
        
        if improvement_result['success']:
            # Update the presentation in DynamoDB if requested
            # For now, we just return the improved content without saving
            return {
                "success": True,
                "improvedContent": improvement_result['improved_content'],
                "originalContent": current_content,
                "improvementSuggestions": improvement_result['suggestions'],
                "message": "Slide improved successfully with AI"
            }
        else:
            return {
                "success": False,
                "message": improvement_result.get('message', 'Failed to improve slide'),
                "improvedContent": "",
                "originalContent": current_content,
                "improvementSuggestions": []
            }
            
    except Exception as e:
        logger.error(f"Error improving slide: {e}")
        return {
            "success": False,
            "message": f"Failed to improve slide: {str(e)}",
            "improvedContent": "",
            "originalContent": current_content,
            "improvementSuggestions": []
        }

def get_presentation_context(presentation_id: str, user_id: str) -> Dict[str, Any]:
    """
    Get presentation context for better slide improvement
    """
    try:
        if not presentations_table:
            return {}
        
        # Get presentation from DynamoDB
        response = presentations_table.get_item(
            Key={'id': presentation_id}
        )
        
        if 'Item' in response:
            presentation = response['Item']
            # Verify user owns this presentation
            if presentation.get('userId') == user_id:
                return {
                    'title': presentation.get('title', ''),
                    'total_slides': presentation.get('slideCount', 0),
                    'sources': presentation.get('sources', []),
                    'context_used': presentation.get('contextChunksUsed', 0) > 0
                }
        
        return {}
        
    except Exception as e:
        logger.warning(f"Failed to get presentation context: {e}")
        return {}

def generate_slide_improvements(content: str, slide_index: int, context: Dict[str, Any], extracted_context: str = None) -> Dict[str, Any]:
    """
    Generate AI-powered slide improvements using Bedrock Nova Pro with context
    """
    try:
        # Build improvement prompt with context
        prompt = build_improvement_prompt(content, slide_index, context, extracted_context)
        
        # Call Bedrock Nova Pro
        response = bedrock_runtime.invoke_model(
            modelId='amazon.nova-pro-v1:0',
            body=json.dumps({
                "messages": [
                    {
                        "role": "user",
                        "content": [{"text": prompt}]
                    }
                ],
                "inferenceConfig": {
                    "maxTokens": 2000,
                    "temperature": 0.7,
                    "topP": 0.9
                }
            })
        )
        
        # Parse response
        response_body = json.loads(response['body'].read())
        content_blocks = response_body.get('output', {}).get('message', {}).get('content', [])
        
        if content_blocks and len(content_blocks) > 0:
            ai_response = content_blocks[0].get('text', '')
            
            # Parse the AI response to extract improved content and suggestions
            parsed_result = parse_improvement_response(ai_response, content)
            
            return {
                "success": True,
                "improved_content": parsed_result['improved_content'],
                "suggestions": parsed_result['suggestions']
            }
        else:
            return {
                "success": False,
                "message": "No improvement generated by AI"
            }
            
    except Exception as e:
        logger.error(f"AI improvement generation error: {e}")
        return {
            "success": False,
            "message": f"AI improvement failed: {str(e)}"
        }

def build_improvement_prompt(content: str, slide_index: int, context: Dict[str, Any], extracted_context: str = None) -> str:
    """
    Build a comprehensive prompt for slide improvement with extracted context
    """
    context_info = ""
    if context:
        context_info = f"""
Presentation Context:
- Title: {context.get('title', 'Unknown')}
- This is slide {slide_index + 1} of {context.get('total_slides', 'unknown')} slides
- RAG Enhanced: {'Yes' if context.get('context_used') else 'No'}
- Sources: {len(context.get('sources', []))} documents used
"""
    
    extracted_context_info = ""
    if extracted_context:
        extracted_context_info = f"""
Specific Context from Slide:
"{extracted_context}"

Please use this specific context to guide your improvements and make the content more relevant and targeted.
"""
    
    prompt = f"""You are an expert presentation designer and content strategist. Please improve the following slide content to make it more engaging, clear, and professional.

{context_info}

{extracted_context_info}

Current Slide Content:
{content}

Please provide your response in the following JSON format:
{{
    "improved_content": "The improved slide content here",
    "suggestions": [
        "Specific improvement made 1",
        "Specific improvement made 2",
        "Specific improvement made 3"
    ]
}}

Improvement Guidelines:
1. Make the content more engaging and visually structured
2. Use bullet points, headers, and formatting for better readability
3. Ensure the content is concise but informative
4. Add relevant emojis or visual indicators where appropriate
5. Maintain the core message while enhancing clarity
6. Consider the slide's position in the overall presentation flow
7. Use professional language and tone
8. Structure content for visual presentation (not just text)
{f"9. Incorporate the specific context: '{extracted_context}' to make the content more targeted and relevant" if extracted_context else ""}

Focus on:
- Clear hierarchy with headers and subheaders
- Bullet points for key information
- Professional formatting
- Engaging language
- Visual structure that works well in presentations
{f"- Relevance to the specified context: '{extracted_context}'" if extracted_context else ""}

Provide only the JSON response, no additional text."""

    return prompt

def parse_improvement_response(ai_response: str, original_content: str) -> Dict[str, Any]:
    """
    Parse AI response to extract improved content and suggestions
    """
    try:
        # Try to parse as JSON first
        if ai_response.strip().startswith('{'):
            parsed = json.loads(ai_response)
            return {
                "improved_content": parsed.get('improved_content', original_content),
                "suggestions": parsed.get('suggestions', ['AI improvement applied'])
            }
        else:
            # If not JSON, treat the entire response as improved content
            return {
                "improved_content": ai_response.strip(),
                "suggestions": [
                    "Content structure improved",
                    "Language enhanced for clarity",
                    "Professional formatting applied"
                ]
            }
            
    except json.JSONDecodeError:
        # Fallback: use the response as improved content
        return {
            "improved_content": ai_response.strip() if ai_response.strip() else original_content,
            "suggestions": [
                "AI enhancement applied",
                "Content clarity improved",
                "Professional tone enhanced"
            ]
        }
    except Exception as e:
        logger.warning(f"Failed to parse improvement response: {e}")
        return {
            "improved_content": original_content,
            "suggestions": ["AI improvement processing failed"]
        }

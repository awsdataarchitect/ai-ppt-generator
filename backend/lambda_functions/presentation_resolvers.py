import json
import boto3
import uuid
from datetime import datetime
import logging
from boto3.dynamodb.conditions import Key

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients with proper configuration
dynamodb = boto3.resource('dynamodb')

# Configure Bedrock client with 60-minute timeout as per AWS documentation
from botocore.config import Config

bedrock_config = Config(
    read_timeout=3600,  # 60 minutes as recommended by AWS
    retries={'max_attempts': 3}
)

def format_datetime_for_graphql(dt):
    """
    Format datetime for GraphQL AWSDateTime scalar type
    Ensures consistent ISO format with Z suffix
    """
    if dt is None:
        return None
    
    # If it's already a string, ensure it has proper format
    if isinstance(dt, str):
        # If it already has Z or timezone info, return as-is
        if dt.endswith('Z') or '+' in dt or dt.endswith('UTC'):
            return dt
        # If it's missing timezone, add Z
        if 'T' in dt:
            return dt + 'Z'
        return dt
    
    # If it's a datetime object, convert to ISO format with Z
    if isinstance(dt, datetime):
        return dt.isoformat() + 'Z'
    
    # If it's a timestamp, convert to ISO format with Z
    try:
        if isinstance(dt, (int, float)):
            return datetime.fromtimestamp(dt).isoformat() + 'Z'
    except (ValueError, OSError):
        pass
    
    # Fallback: return current time with Z
    return datetime.utcnow().isoformat() + 'Z'

bedrock_runtime = boto3.client(
    'bedrock-runtime',
    config=bedrock_config
)
s3 = boto3.client('s3')

# DynamoDB table
presentations_table = dynamodb.Table('ai-ppt-presentations')

def lambda_handler(event, context):
    """
    Main Lambda handler for presentation operations
    """
    try:
        # Parse the GraphQL operation
        operation = event.get('info', {}).get('fieldName')
        arguments = event.get('arguments', {})
        
        logger.info(f"Operation: {operation}, Arguments: {arguments}")
        
        if operation == 'listPresentations':
            return list_presentations(event, context)
        elif operation == 'createPresentation':
            return create_presentation(event, context)
        elif operation == 'updatePresentation':
            return update_presentation(event, context)
        elif operation == 'deletePresentation':
            return delete_presentation(event, context)
        elif operation == 'generatePresentationWithAI':
            return generate_presentation_with_ai(event, context)
        else:
            raise ValueError(f"Unknown operation: {operation}")
            
    except Exception as e:
        logger.error(f"Error in lambda_handler: {str(e)}")
        raise e

def list_presentations(event, context):
    """
    List all presentations for a user
    """
    try:
        # Get user ID from Cognito context
        user_id = event.get('identity', {}).get('sub', 'anonymous')
        
        # Query using GSI for better performance
        response = presentations_table.query(
            IndexName='UserIndex',
            KeyConditionExpression=Key('userId').eq(user_id),
            ScanIndexForward=False  # Sort by createdAt descending (newest first)
        )
        
        presentations = response.get('Items', [])
        
        # Convert DynamoDB format to GraphQL format
        formatted_presentations = []
        for item in presentations:
            # Use only 'content' field - clean and consistent
            content_data = item.get('content', [])
            
            # Ensure content is always a list for GraphQL array type
            if isinstance(content_data, list):
                content_array = content_data
            elif isinstance(content_data, str):
                # Try to parse JSON string back to array
                try:
                    content_array = json.loads(content_data)
                    if not isinstance(content_array, list):
                        content_array = [str(content_data)]
                except json.JSONDecodeError:
                    # Split string by common separators
                    content_array = content_data.split('---') if content_data else []
            else:
                content_array = []
            
            formatted_presentations.append({
                'id': item['id'],
                'userId': item['userId'],
                'title': item['title'],
                'description': item.get('description', ''),
                'content': content_array,  # Single clean field
                'theme': item.get('theme', 'default'),
                'contextUsed': item.get('contextUsed', False),
                'sources': json.dumps(item.get('sources', [])) if isinstance(item.get('sources'), list) else str(item.get('sources', '[]')),
                'relevantChunksCount': item.get('contextChunksUsed', item.get('relevantChunksCount', 0)),
                'createdAt': format_datetime_for_graphql(item.get('createdAt')),
                'updatedAt': format_datetime_for_graphql(item.get('updatedAt')),
                'status': item.get('status', 'DRAFT')
            })
        
        return formatted_presentations
        
    except Exception as e:
        logger.error(f"Error in list_presentations: {str(e)}")
        raise e

def create_presentation(event, context):
    """
    Create a new presentation
    """
    try:
        # Get user ID from Cognito context
        user_id = event.get('identity', {}).get('sub', 'anonymous')
        
        # Get input data
        input_data = event.get('arguments', {}).get('input', {})
        
        # Generate unique ID
        presentation_id = str(uuid.uuid4())
        current_time = datetime.utcnow().isoformat() + 'Z'  # Consistent format with Z
        
        # Create presentation item
        presentation = {
            'id': presentation_id,
            'userId': user_id,
            'title': input_data.get('title', 'Untitled Presentation'),
            'description': input_data.get('description', ''),
            'content': input_data.get('content', []),  # Single clean field
            'createdAt': current_time,
            'updatedAt': current_time,
            'status': 'DRAFT'
        }
        
        # Save to DynamoDB
        presentations_table.put_item(Item=presentation)
        
        return presentation
        
    except Exception as e:
        logger.error(f"Error in create_presentation: {str(e)}")
        raise e

def update_presentation(event, context):
    """
    Update an existing presentation
    """
    try:
        # Get user ID from Cognito context
        user_id = event.get('identity', {}).get('sub', 'anonymous')
        
        # Get input data
        presentation_id = event.get('arguments', {}).get('id')
        input_data = event.get('arguments', {}).get('input', {})
        
        # Update timestamp
        current_time = datetime.utcnow().isoformat() + 'Z'  # Consistent format with Z
        
        # Build update expression
        update_expression = "SET updatedAt = :updatedAt"
        expression_values = {':updatedAt': current_time, ':userId': user_id}
        
        if 'title' in input_data:
            update_expression += ", title = :title"
            expression_values[':title'] = input_data['title']
            
        if 'description' in input_data:
            update_expression += ", description = :description"
            expression_values[':description'] = input_data['description']
            
        if 'content' in input_data:
            update_expression += ", content = :content"
            content_data = input_data['content']
            
            # Log content data structure for debugging
            logger.info(f"BACKEND: Processing content data - Type: {type(content_data)}, Length: {len(content_data) if isinstance(content_data, (list, str)) else 'N/A'}")
            if isinstance(content_data, list):
                logger.info(f"BACKEND: Content array has {len(content_data)} elements")
                for i, slide in enumerate(content_data[:3]):  # Log first 3 slides
                    logger.info(f"BACKEND: Slide {i+1} preview: {str(slide)[:100]}...")
            elif isinstance(content_data, str):
                logger.info(f"BACKEND: Content is string with length {len(content_data)}, preview: {content_data[:100]}...")
            
            expression_values[':content'] = content_data
            
        if 'status' in input_data:
            update_expression += ", #status = :status"
            expression_values[':status'] = input_data['status']
        
        # Build update parameters
        update_params = {
            'Key': {'id': presentation_id},
            'UpdateExpression': update_expression,
            'ConditionExpression': 'userId = :userId',
            'ExpressionAttributeValues': expression_values,
            'ReturnValues': 'ALL_NEW'
        }
        
        # Only add ExpressionAttributeNames when actually needed
        if 'status' in input_data:
            update_params['ExpressionAttributeNames'] = {'#status': 'status'}
        
        # PRECISE LOGGING: Log exactly what we're about to send to DynamoDB
        logger.info(f"BACKEND: About to call update_item with params: {update_params}")
        logger.info(f"BACKEND: presentation_id = {presentation_id}")
        logger.info(f"BACKEND: user_id = {user_id}")
        logger.info(f"BACKEND: input_data keys = {list(input_data.keys())}")
        
        # Update item in DynamoDB
        logger.info("BACKEND: Calling presentations_table.update_item...")
        response = presentations_table.update_item(**update_params)
        logger.info(f"BACKEND: update_item SUCCESS - response: {response}")
        
        # Format datetime fields for GraphQL
        updated_item = response['Attributes']
        logger.info(f"BACKEND: Returning updated_item with {len(updated_item)} attributes")
        updated_item['createdAt'] = format_datetime_for_graphql(updated_item.get('createdAt'))
        updated_item['updatedAt'] = format_datetime_for_graphql(updated_item.get('updatedAt'))
        
        return updated_item
        
    except Exception as e:
        logger.error(f"Error in update_presentation: {str(e)}")
        raise e

def delete_presentation(event, context):
    """
    Delete a presentation
    """
    try:
        # Get user ID from Cognito context
        user_id = event.get('identity', {}).get('sub', 'anonymous')
        
        # Get presentation ID
        presentation_id = event.get('arguments', {}).get('id')
        
        # Delete from DynamoDB
        presentations_table.delete_item(
            Key={'id': presentation_id},
            ConditionExpression='userId = :userId',
            ExpressionAttributeValues={':userId': user_id}
        )
        
        return True
        
    except Exception as e:
        logger.error(f"Error in delete_presentation: {str(e)}")
        raise e

def generate_presentation_with_ai(event, context):
    """
    Generate presentation content using Amazon Bedrock Nova Pro
    """
    try:
        # Get input data
        arguments = event.get('arguments', {})
        prompt = arguments.get('prompt', '')
        title = arguments.get('title', 'AI Generated Presentation')
        
        logger.info(f"Generating presentation with prompt: {prompt}")
        
        # Prepare the system prompt for presentation generation
        system_prompt = """You are an expert presentation creator. Generate professional presentation content based on the user's prompt. 

Your response should be a JSON object with the following structure:
{
    "title": "Presentation Title",
    "slides": [
        "# Slide 1 Title\n\nSlide 1 content with bullet points",
        "# Slide 2 Title\n\nSlide 2 content with bullet points",
        ...
    ]
}

Guidelines:
- Create 4-8 slides maximum
- Use markdown format for each slide
- Start each slide with a # title
- Include relevant bullet points and content
- Make it professional and engaging
- Focus on key points and clear structure"""

        # Prepare the request for Bedrock Nova Pro
        request_body = {
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "text": f"Create a professional presentation about: {prompt}\n\nTitle suggestion: {title}"
                        }
                    ]
                }
            ],
            "system": [
                {
                    "text": system_prompt
                }
            ],
            "inferenceConfig": {
                "maxTokens": 2000,
                "temperature": 0.7,
                "topP": 0.9
            }
        }
        
        # Call Bedrock Nova Pro
        try:
            response = bedrock_runtime.converse(
                modelId='amazon.nova-pro-v1:0',
                messages=request_body['messages'],
                system=request_body['system'],
                inferenceConfig=request_body['inferenceConfig']
            )
            
            # Extract the generated content
            output_message = response['output']['message']
            generated_text = output_message['content'][0]['text']
            
            logger.info(f"Generated text: {generated_text}")
            
            # Try to parse as JSON
            try:
                ai_response = json.loads(generated_text)
                generated_title = ai_response.get('title', title)
                generated_slides = ai_response.get('slides', [])
            except json.JSONDecodeError:
                # Fallback: treat as plain text and create slides
                logger.warning("Could not parse AI response as JSON, using fallback")
                generated_title = title
                generated_slides = [
                    f"# Introduction\n\n{generated_text[:200]}...",
                    f"# Key Points\n\n{generated_text[200:400]}...",
                    f"# Conclusion\n\n{generated_text[400:600]}..."
                ]
            
            return {
                'title': generated_title,
                'slides': generated_slides,
                'success': True,
                'message': 'Presentation generated successfully with Amazon Bedrock Nova Pro'
            }
            
        except Exception as bedrock_error:
            logger.error(f"Bedrock error: {str(bedrock_error)}")
            
            # Return proper error response instead of mock data
            return {
                'title': title,
                'slides': [],
                'success': False,
                'message': f'Failed to generate presentation with Amazon Bedrock Nova Pro: {str(bedrock_error)}',
                'error': 'BEDROCK_ERROR'
            }
            
    except Exception as e:
        logger.error(f"Error in generate_presentation_with_ai: {str(e)}")
        
        # Return proper error response instead of mock data
        return {
            'title': event.get('arguments', {}).get('title', 'AI Generated Presentation'),
            'slides': [],
            'success': False,
            'message': f'Failed to generate presentation: {str(e)}',
            'error': 'GENERATION_ERROR'
        }

"""
Ingestion Status Resolver
Checks and updates document ingestion statuses
"""

import json
import boto3
import os
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
lambda_client = boto3.client('lambda')

def lambda_handler(event, context):
    """
    Lambda handler for checking ingestion status
    """
    try:
        # Extract user ID from event context
        user_id = event.get('identity', {}).get('sub')
        if not user_id:
            return {
                "success": False,
                "updatedDocuments": 0,
                "message": "User authentication required"
            }
        
        # Call the Knowledge Base Manager to check ingestion status
        kb_manager_function = os.environ.get('KNOWLEDGE_BASE_MANAGER_FUNCTION_NAME')
        if not kb_manager_function:
            return {
                "success": False,
                "updatedDocuments": 0,
                "message": "Knowledge Base Manager function not configured"
            }
        
        response = lambda_client.invoke(
            FunctionName=kb_manager_function,
            InvocationType='RequestResponse',
            Payload=json.dumps({
                'operation': 'check_ingestion_status',
                'user_id': user_id
            })
        )
        
        # Parse the response
        payload = json.loads(response['Payload'].read())
        
        if payload.get('statusCode') == 200:
            body = json.loads(payload.get('body', '{}'))
            return {
                "success": body.get('success', False),
                "updatedDocuments": body.get('updated_documents', 0),
                "message": body.get('message', 'Status check completed')
            }
        else:
            return {
                "success": False,
                "updatedDocuments": 0,
                "message": "Failed to check ingestion status"
            }
        
    except Exception as e:
        logger.error(f"Ingestion status resolver error: {e}")
        return {
            "success": False,
            "updatedDocuments": 0,
            "message": f"Error checking ingestion status: {str(e)}"
        }

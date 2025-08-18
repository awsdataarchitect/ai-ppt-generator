import json
import boto3
import os
from typing import Dict, Any, Optional

def lambda_handler(event: Dict[str, Any], context: Any) -> Optional[Dict[str, Any]]:
    """
    Get user's Knowledge Base information
    """
    try:
        # Get user ID from the event
        user_id = event.get('identity', {}).get('sub')
        if not user_id:
            # Return None for unauthenticated users (GraphQL will handle this)
            return None
        
        # Initialize AWS clients
        bedrock_agent = boto3.client('bedrock-agent', region_name='us-east-1')
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        
        # Get user's Knowledge Base info from DynamoDB
        user_kb_table = dynamodb.Table(os.environ.get('USER_KB_TABLE_NAME', 'ai-ppt-user-knowledge-bases'))
        
        try:
            response = user_kb_table.get_item(Key={'user_id': user_id})
            if 'Item' not in response:
                # User doesn't have a Knowledge Base yet
                return None
            
            user_kb_info = response['Item']
            knowledge_base_id = user_kb_info.get('knowledge_base_id', '')
            data_source_id = user_kb_info.get('data_source_id', '')
            vector_bucket_name = user_kb_info.get('vector_bucket_name', '')
            
            if not all([knowledge_base_id, data_source_id, vector_bucket_name]):
                # Incomplete KB info
                return None
            
            # Get Knowledge Base status from AWS
            try:
                kb_response = bedrock_agent.get_knowledge_base(
                    knowledgeBaseId=knowledge_base_id
                )
                kb_status = kb_response['knowledgeBase']['status']
            except Exception as e:
                print(f"Error getting KB status: {e}")
                kb_status = 'UNKNOWN'
            
            # Get document count from documents table
            try:
                documents_table = dynamodb.Table(os.environ.get('DOCUMENTS_TABLE_NAME', 'ai-ppt-documents'))
                documents_response = documents_table.scan(
                    FilterExpression='user_id = :user_id',
                    ExpressionAttributeValues={':user_id': user_id}
                )
                document_count = documents_response.get('Count', 0)
            except Exception as e:
                print(f"Error getting document count: {e}")
                document_count = 0
            
            return {
                "knowledgeBaseId": knowledge_base_id,
                "dataSourceId": data_source_id,
                "vectorBucketName": vector_bucket_name,
                "status": kb_status,
                "documentCount": int(document_count)
            }
            
        except Exception as e:
            print(f"Error getting user KB info: {e}")
            return None
        
    except Exception as e:
        print(f"Error in user Knowledge Base resolver: {e}")
        return None

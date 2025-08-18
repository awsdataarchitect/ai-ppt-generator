import json
import boto3
import os
from typing import Dict, Any

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Get S3 Vectors statistics for the user's Knowledge Base
    """
    try:
        # Get user ID from the event
        user_id = event.get('identity', {}).get('sub')
        if not user_id:
            # Return default values for unauthenticated users
            return {
                "totalVectors": 0,
                "totalDocuments": 0,
                "vectorBucketName": "",
                "indexName": "",
                "knowledgeBaseId": ""
            }
        
        # Initialize AWS clients
        bedrock_agent = boto3.client('bedrock-agent', region_name='us-east-1')
        s3vectors = boto3.client('s3vectors', region_name='us-east-1')
        dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
        
        # Get user's Knowledge Base info from DynamoDB
        user_kb_table = dynamodb.Table(os.environ.get('USER_KB_TABLE_NAME', 'ai-ppt-user-knowledge-bases'))
        
        try:
            response = user_kb_table.get_item(Key={'user_id': user_id})
            if 'Item' not in response:
                # User doesn't have a Knowledge Base yet - return zeros
                return {
                    "totalVectors": 0,
                    "totalDocuments": 0,
                    "vectorBucketName": "",
                    "indexName": "",
                    "knowledgeBaseId": ""
                }
            
            user_kb_info = response['Item']
            knowledge_base_id = user_kb_info.get('knowledge_base_id', '')
            vector_bucket_name = user_kb_info.get('vector_bucket_name', '')
            vector_index_name = user_kb_info.get('vector_index_name', '')
            
            if not all([knowledge_base_id, vector_bucket_name, vector_index_name]):
                # Incomplete KB info - return zeros
                return {
                    "totalVectors": 0,
                    "totalDocuments": 0,
                    "vectorBucketName": vector_bucket_name,
                    "indexName": vector_index_name,
                    "knowledgeBaseId": knowledge_base_id
                }
            
        except Exception as e:
            print(f"Error getting user KB info: {e}")
            return {
                "totalVectors": 0,
                "totalDocuments": 0,
                "vectorBucketName": "",
                "indexName": "",
                "knowledgeBaseId": ""
            }
        
        # Get S3 Vectors statistics
        try:
            # Get vector index statistics
            index_response = s3vectors.get_index(
                vectorBucketName=vector_bucket_name,
                indexName=vector_index_name
            )
            
            # Get vector count from index metadata
            total_vectors = index_response.get('vectorCount', 0)
            
            # Get Knowledge Base information
            kb_response = bedrock_agent.get_knowledge_base(
                knowledgeBaseId=knowledge_base_id
            )
            
            # Get document count from documents table
            documents_table = dynamodb.Table(os.environ.get('DOCUMENTS_TABLE_NAME', 'ai-ppt-documents'))
            documents_response = documents_table.scan(
                FilterExpression='user_id = :user_id',
                ExpressionAttributeValues={':user_id': user_id}
            )
            
            total_documents = documents_response.get('Count', 0)
            
            return {
                "totalVectors": int(total_vectors) if total_vectors else 0,
                "totalDocuments": int(total_documents) if total_documents else 0,
                "vectorBucketName": vector_bucket_name,
                "indexName": vector_index_name,
                "knowledgeBaseId": knowledge_base_id
            }
            
        except Exception as e:
            print(f"Error getting S3 Vectors stats: {e}")
            # Return basic info even if stats fail
            return {
                "totalVectors": 0,
                "totalDocuments": 0,
                "vectorBucketName": vector_bucket_name,
                "indexName": vector_index_name,
                "knowledgeBaseId": knowledge_base_id
            }
        
    except Exception as e:
        print(f"Error in S3 Vectors stats resolver: {e}")
        return {
            "totalVectors": 0,
            "totalDocuments": 0,
            "vectorBucketName": "",
            "indexName": "",
            "knowledgeBaseId": ""
        }

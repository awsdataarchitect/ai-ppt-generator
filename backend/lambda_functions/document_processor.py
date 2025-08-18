#!/usr/bin/env python3
"""
Document Processor V3 - Per-User Knowledge Base Architecture
Each user gets their own Knowledge Base for perfect isolation and no S3 Vectors metadata limits
"""

import boto3
import json
import base64
import uuid
import hashlib
import os
import logging
from datetime import datetime
from typing import Dict, Any, Optional, List
from boto3.dynamodb.conditions import Key

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
lambda_client = boto3.client('lambda')

# Environment variables
DOCUMENTS_BUCKET = os.environ['DOCUMENTS_BUCKET']
DOCUMENTS_TABLE_NAME = os.environ['DOCUMENTS_TABLE_NAME']
USER_KB_TABLE_NAME = os.environ['USER_KB_TABLE_NAME']
KB_MANAGER_FUNCTION_NAME = os.environ['KB_MANAGER_FUNCTION_NAME']

# DynamoDB tables
documents_table = dynamodb.Table(DOCUMENTS_TABLE_NAME)
user_kb_table = dynamodb.Table(USER_KB_TABLE_NAME)


class DocumentProcessor:
    """
    Document processor for per-user Knowledge Base architecture
    Each user gets their own Knowledge Base for perfect isolation
    """
    
    def __init__(self):
        self.bedrock_agent = boto3.client('bedrock-agent')
    
    def process_document(self, pdf_content: bytes, filename: str, user_id: str) -> Dict[str, Any]:
        """
        Process document upload for user-specific Knowledge Base
        
        Args:
            pdf_content: Document content as bytes
            filename: Original filename
            user_id: User ID from Cognito
            
        Returns:
            Processing result with document ID and status
        """
        try:
            logger.info(f"Processing document {filename} for user {user_id}")
            
            # Step 1: Generate document metadata immediately
            document_id = str(uuid.uuid4())
            
            # Step 2: Check if user already has a KB (fast check)
            existing_kb = self._get_existing_user_kb(user_id)
            
            if existing_kb:
                # User has existing KB - process normally (fast path)
                logger.info(f"Using existing KB for user {user_id}: {existing_kb['knowledge_base_id']}")
                return self._process_with_existing_kb(pdf_content, filename, user_id, document_id, existing_kb)
            else:
                # First-time user - start async KB creation (slow path)
                logger.info(f"First-time user {user_id} - starting async KB creation")
                return self._start_async_kb_creation(pdf_content, filename, user_id, document_id)
                
        except Exception as e:
            logger.error(f"Failed to process document {filename} for user {user_id}: {e}")
            return {
                "success": False,
                "message": f"Document processing failed: {str(e)}"
            }
    
    def _get_existing_user_kb(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Fast check for existing user KB from DynamoDB"""
        try:
            logger.info(f"🔍 Checking for existing KB for user {user_id}")
            logger.info(f"📊 Using table: {USER_KB_TABLE_NAME}")
            
            user_kb_table = dynamodb.Table(USER_KB_TABLE_NAME)
            response = user_kb_table.get_item(Key={'user_id': user_id})
            
            logger.info(f"📊 DynamoDB response: {response}")
            
            if 'Item' in response:
                kb_info = response['Item']
                kb_id = kb_info['knowledge_base_id']
                logger.info(f"✅ Found existing KB record: {kb_id}")
                
                # Verify KB still exists
                if self._verify_kb_exists(kb_id):
                    logger.info(f"✅ KB {kb_id} verified to exist - using existing KB")
                    return kb_info
                else:
                    logger.warning(f"❌ KB {kb_id} no longer exists - removing stale record")
                    # KB was deleted, remove stale record
                    user_kb_table.delete_item(Key={'user_id': user_id})
            else:
                logger.info(f"❌ No existing KB record found for user {user_id}")
            
            return None
        except Exception as e:
            logger.error(f"❌ Failed to check existing KB for user {user_id}: {e}")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return None
    
    def _verify_kb_exists(self, kb_id: str) -> bool:
        """Verify Knowledge Base still exists"""
        try:
            logger.info(f"🔍 Verifying KB exists: {kb_id}")
            self.bedrock_agent.get_knowledge_base(knowledgeBaseId=kb_id)
            logger.info(f"✅ KB {kb_id} verified to exist")
            return True
        except Exception as e:
            logger.warning(f"❌ KB {kb_id} verification failed: {e}")
            return False
    
    def _process_with_existing_kb(self, pdf_content: bytes, filename: str, user_id: str, document_id: str, kb_info: Dict[str, Any]) -> Dict[str, Any]:
        """Process document with existing Knowledge Base (fast path)"""
        try:
            user_hash = kb_info['user_hash']
            # Fix: Use consistent docs/ prefix like Knowledge Base Manager expects
            s3_key = f"docs/{user_hash}/{document_id}/{filename}"
            
            logger.info(f"Uploading document to S3: {s3_key}")
            
            # Upload document to S3
            s3.put_object(
                Bucket=DOCUMENTS_BUCKET,
                Key=s3_key,
                Body=pdf_content,
                ContentType=self._get_content_type(filename),
                Metadata={
                    'user_id': user_id,
                    'document_id': document_id,
                    'original_filename': filename,
                    'upload_timestamp': datetime.utcnow().isoformat()
                }
            )
            
            # Store document metadata in DynamoDB
            document_metadata = {
                'document_id': document_id,
                'user_id': user_id,
                's3_key': s3_key,
                'filename': filename,
                'file_size': len(pdf_content),
                'content_type': self._get_content_type(filename),
                'knowledge_base_id': kb_info['knowledge_base_id'],
                'data_source_id': kb_info['data_source_id'],
                'upload_date': datetime.utcnow().isoformat(),
                'sync_status': 'uploaded',
                'processing_attempts': 0,
                'last_modified': datetime.utcnow().isoformat()
            }
            
            documents_table.put_item(Item=document_metadata)
            
            # Trigger Knowledge Base ingestion
            self._trigger_kb_ingestion(kb_info, document_id)
            
            return {
                "success": True,
                "documentId": document_id,  # Changed from document_id to documentId
                "s3_key": s3_key,
                "knowledge_base_id": kb_info['knowledge_base_id'],
                "sync_status": "processing",
                "message": f"Document {filename} uploaded and processing started"
            }
            
        except Exception as e:
            logger.error(f"Failed to process document with existing KB: {e}")
            raise
    
    def _start_async_kb_creation(self, pdf_content: bytes, filename: str, user_id: str, document_id: str) -> Dict[str, Any]:
        """Start asynchronous Knowledge Base creation for first-time user"""
        try:
            # Store document temporarily in S3 with pending status
            temp_s3_key = f"pending/{user_id}/{document_id}/{filename}"
            
            logger.info(f"Storing document temporarily: {temp_s3_key}")
            s3.put_object(
                Bucket=DOCUMENTS_BUCKET,
                Key=temp_s3_key,
                Body=pdf_content,
                ContentType=self._get_content_type(filename),
                Metadata={
                    'user_id': user_id,
                    'document_id': document_id,
                    'original_filename': filename,
                    'upload_timestamp': datetime.utcnow().isoformat(),
                    'status': 'pending_kb_creation'
                }
            )
            
            # Store document metadata with pending status
            document_metadata = {
                'document_id': document_id,
                'user_id': user_id,
                's3_key': temp_s3_key,
                'filename': filename,
                'file_size': len(pdf_content),
                'content_type': self._get_content_type(filename),
                'upload_date': datetime.utcnow().isoformat(),
                'sync_status': 'creating_knowledge_base',
                'processing_attempts': 0,
                'last_modified': datetime.utcnow().isoformat(),
                'message': 'Creating your personal Knowledge Base (first upload takes 2-3 minutes)...'
            }
            
            documents_table.put_item(Item=document_metadata)
            
            # Invoke Knowledge Base Manager asynchronously
            lambda_client.invoke(
                FunctionName=KB_MANAGER_FUNCTION_NAME,
                InvocationType='Event',  # Asynchronous invocation
                Payload=json.dumps({
                    'operation': 'create_and_process',
                    'user_id': user_id,
                    'document_id': document_id,
                    'filename': filename,
                    'temp_s3_key': temp_s3_key
                })
            )
            
            logger.info(f"Started async KB creation for user {user_id}, document {document_id}")
            
            return {
                "success": True,
                "documentId": document_id,  # Changed from document_id to documentId
                "s3_key": temp_s3_key,
                "sync_status": "creating_knowledge_base",
                "message": f"Creating your personal Knowledge Base for {filename}. This will take 2-3 minutes for your first upload.",
                "isFirstUpload": True,
                "estimatedTime": "2-3 minutes"
            }
            
        except Exception as e:
            logger.error(f"Failed to start async KB creation: {e}")
            raise
    
    def _get_or_create_user_kb(self, user_id: str) -> Optional[Dict[str, str]]:
        """Get or create Knowledge Base for user"""
        try:
            # Invoke KB Manager to get/create user's KB
            response = lambda_client.invoke(
                FunctionName=KB_MANAGER_FUNCTION_NAME,
                InvocationType='RequestResponse',
                Payload=json.dumps({
                    'operation': 'get_or_create',
                    'user_id': user_id
                })
            )
            
            result = json.loads(response['Payload'].read())
            
            # Check the Lambda response status code (lowercase 's')
            if result.get('statusCode') == 200:
                # Parse the body which contains the actual KB info
                kb_info = json.loads(result['body'])
                return kb_info
            else:
                logger.error(f"KB Manager failed with status {result.get('statusCode')}: {result}")
                return None
                
        except Exception as e:
            logger.error(f"Failed to get/create user KB: {e}")
            return None
    
    def _trigger_kb_ingestion(self, user_kb_info: Dict[str, str], document_id: str):
        """Trigger Knowledge Base ingestion job"""
        try:
            kb_id = user_kb_info['knowledge_base_id']
            ds_id = user_kb_info['data_source_id']
            
            logger.info(f"Starting ingestion job for KB {kb_id}, DS {ds_id}")
            
            response = self.bedrock_agent.start_ingestion_job(
                knowledgeBaseId=kb_id,
                dataSourceId=ds_id,
                description=f"Ingestion for document {document_id}"
            )
            
            job_id = response['ingestionJob']['ingestionJobId']
            
            # Update document status
            documents_table.update_item(
                Key={'document_id': document_id},
                UpdateExpression='SET sync_status = :status, ingestion_job_id = :job_id, last_modified = :timestamp',
                ExpressionAttributeValues={
                    ':status': 'syncing',
                    ':job_id': job_id,
                    ':timestamp': datetime.utcnow().isoformat()
                }
            )
            
            logger.info(f"Started ingestion job {job_id} for document {document_id}")
            
        except Exception as e:
            logger.error(f"Failed to trigger KB ingestion: {e}")
            # Update document status to failed
            documents_table.update_item(
                Key={'document_id': document_id},
                UpdateExpression='SET sync_status = :status, error_message = :error, last_modified = :timestamp',
                ExpressionAttributeValues={
                    ':status': 'failed',
                    ':error': str(e),
                    ':timestamp': datetime.utcnow().isoformat()
                }
            )
    
    def _format_datetime(self, datetime_str: Optional[str]) -> Optional[str]:
        """
        Format datetime string for GraphQL AWSDateTime compatibility
        Converts microsecond precision to millisecond precision and ensures proper ISO format
        """
        if not datetime_str:
            return None
        
        try:
            # Parse the datetime string (handles microseconds)
            dt = datetime.fromisoformat(datetime_str.replace('Z', '+00:00'))
            
            # Format as ISO string with millisecond precision (GraphQL AWSDateTime format)
            return dt.strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'
            
        except Exception as e:
            logger.warning(f"Failed to format datetime {datetime_str}: {e}")
            return datetime_str  # Return original if formatting fails

    def get_user_documents(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Get all documents for a specific user
        
        Args:
            user_id: User ID from Cognito
            
        Returns:
            List of user's documents with metadata
        """
        try:
            logger.info(f"Getting documents for user {user_id}")
            
            # Query documents table for user's documents
            response = documents_table.query(
                IndexName='UserDocumentsIndex',  # Use the correct GSI name
                KeyConditionExpression=Key('user_id').eq(user_id),
                ScanIndexForward=False  # Sort by most recent first
            )
            
            documents = []
            for item in response.get('Items', []):
                # Convert DynamoDB item to GraphQL schema format
                doc = {
                    'id': item.get('document_id'),
                    'userId': item.get('user_id'),
                    'filename': item.get('filename'),
                    'uploadDate': self._format_datetime(item.get('upload_date')),
                    'chunkCount': item.get('chunk_count', 0),
                    'textLength': item.get('text_length', 0),
                    'status': item.get('sync_status', 'unknown'),
                    'syncStatus': item.get('sync_status', 'unknown'),
                    'fileSize': item.get('file_size', 0),
                    'contentType': item.get('content_type', ''),
                    'knowledgeBaseId': item.get('knowledge_base_id'),
                    'dataSourceId': item.get('data_source_id'),
                    'lastModified': self._format_datetime(item.get('last_modified')),
                    'errorMessage': item.get('error_message'),
                    'message': item.get('message', ''),
                    's3Key': item.get('s3_key')
                }
                documents.append(doc)
            
            logger.info(f"Found {len(documents)} documents for user {user_id}")
            return documents
            
        except Exception as e:
            logger.error(f"Failed to get documents for user {user_id}: {e}")
            return []
        """Get document sync status"""
        try:
            # Get document metadata
            response = documents_table.get_item(Key={'document_id': document_id})
            
            if 'Item' not in response:
                return {
                    "success": False,
                    "message": "Document not found"
                }
            
            document = response['Item']
            
            # Verify user ownership
            if document.get('user_id') != user_id:
                return {
                    "success": False,
                    "message": "Access denied"
                }
            
            # Check ingestion job status if syncing
            if document.get('sync_status') == 'syncing' and document.get('ingestion_job_id'):
                self._update_ingestion_status(document)
                # Re-fetch updated document
                response = documents_table.get_item(Key={'document_id': document_id})
                document = response['Item']
            
            return {
                "success": True,
                "documentId": document_id,  # Changed from document_id to documentId
                "filename": document.get('filename'),
                "sync_status": document.get('sync_status'),
                "upload_date": document.get('upload_date'),
                "last_modified": document.get('last_modified'),
                "error_message": document.get('error_message'),
                "knowledge_base_id": document.get('knowledge_base_id')
            }
            
        except Exception as e:
            logger.error(f"Failed to get sync status for document {document_id}: {e}")
            return {
                "success": False,
                "message": f"Failed to get sync status: {str(e)}"
            }
    
    def _update_ingestion_status(self, document: Dict[str, Any]):
        """Update ingestion job status"""
        try:
            job_id = document.get('ingestion_job_id')
            kb_id = document.get('knowledge_base_id')
            ds_id = document.get('data_source_id')
            document_id = document.get('document_id')
            
            if not all([job_id, kb_id, ds_id, document_id]):
                return
            
            # Get ingestion job status
            response = self.bedrock_agent.get_ingestion_job(
                knowledgeBaseId=kb_id,
                dataSourceId=ds_id,
                ingestionJobId=job_id
            )
            
            job = response['ingestionJob']
            status = job['status']
            
            if status == 'COMPLETE':
                documents_table.update_item(
                    Key={'document_id': document_id},
                    UpdateExpression='SET sync_status = :status, last_modified = :timestamp',
                    ExpressionAttributeValues={
                        ':status': 'completed',
                        ':timestamp': datetime.utcnow().isoformat()
                    }
                )
            elif status == 'FAILED':
                failure_reasons = job.get('failureReasons', ['Unknown error'])
                documents_table.update_item(
                    Key={'document_id': document_id},
                    UpdateExpression='SET sync_status = :status, error_message = :error, last_modified = :timestamp',
                    ExpressionAttributeValues={
                        ':status': 'failed',
                        ':error': '; '.join(failure_reasons),
                        ':timestamp': datetime.utcnow().isoformat()
                    }
                )
            
        except Exception as e:
            logger.error(f"Failed to update ingestion status: {e}")
    
    def _get_content_type(self, filename: str) -> str:
        """Get content type based on file extension"""
        extension = filename.lower().split('.')[-1] if '.' in filename else ''
        
        content_types = {
            'pdf': 'application/pdf',
            'txt': 'text/plain',
            'md': 'text/markdown',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }
        
        return content_types.get(extension, 'application/octet-stream')

    def delete_document(self, document_id: str, user_id: str) -> bool:
        """
        Delete a document from S3, DynamoDB, and Knowledge Base
        """
        try:
            logger.info(f"Starting delete operation for document {document_id} and user {user_id}")
            
            # Get document info from DynamoDB
            documents_table = dynamodb.Table(DOCUMENTS_TABLE_NAME)
            
            try:
                # Use the correct primary key 'document_id' based on table schema
                response = documents_table.get_item(Key={'document_id': document_id})
                    
                if 'Item' not in response:
                    logger.error(f"Document {document_id} not found in DynamoDB")
                    return False
                
                document = response['Item']
                logger.info(f"Found document: {document.get('filename', 'unknown')}")
                
                # Check user ownership using 'user_id' field based on table schema
                doc_user_id = document.get('user_id')
                if doc_user_id != user_id:
                    logger.error(f"Document {document_id} does not belong to user {user_id}, belongs to {doc_user_id}")
                    return False
                
            except Exception as e:
                logger.error(f"Error getting document from DynamoDB: {e}")
                return False
            
            # Delete from S3
            try:
                s3_key = document.get('s3_key') or document.get('s3Key')
                if s3_key:
                    logger.info(f"Deleting S3 object: {s3_key}")
                    s3.delete_object(Bucket=DOCUMENTS_BUCKET, Key=s3_key)
                    logger.info(f"Successfully deleted S3 object: {s3_key}")
                else:
                    logger.warning(f"No S3 key found for document {document_id}")
            except Exception as e:
                logger.error(f"Error deleting from S3: {e}")
                # Continue with other deletions even if S3 fails
            
            # Delete from DynamoDB using correct primary key
            try:
                logger.info(f"Deleting document from DynamoDB: {document_id}")
                documents_table.delete_item(Key={'document_id': document_id})
                logger.info(f"Successfully deleted document from DynamoDB: {document_id}")
                    
            except Exception as e:
                logger.error(f"Error deleting from DynamoDB: {e}")
                return False
            
            # CRITICAL: Trigger Knowledge Base sync to remove vectors from S3 Vectors index
            try:
                logger.info(f"Triggering Knowledge Base sync to remove vectors for document {document_id}")
                
                # Get user's Knowledge Base info
                user_kb_table = dynamodb.Table(os.environ.get('USER_KB_TABLE_NAME', 'ai-ppt-user-knowledge-bases'))
                kb_response = user_kb_table.get_item(Key={'user_id': user_id})
                
                if 'Item' in kb_response:
                    kb_info = kb_response['Item']
                    knowledge_base_id = kb_info.get('knowledge_base_id')
                    data_source_id = kb_info.get('data_source_id')
                    
                    if knowledge_base_id and data_source_id:
                        # Trigger ingestion job to sync Knowledge Base with current S3 state
                        # This will remove vectors for deleted documents
                        bedrock_agent = boto3.client('bedrock-agent')
                        sync_response = bedrock_agent.start_ingestion_job(
                            knowledgeBaseId=knowledge_base_id,
                            dataSourceId=data_source_id,
                            description=f'Sync after deleting document {document_id}'
                        )
                        
                        sync_job_id = sync_response['ingestionJob']['ingestionJobId']
                        logger.info(f"Started Knowledge Base sync job {sync_job_id} to remove vectors")
                    else:
                        logger.warning(f"Missing KB info for user {user_id}, cannot sync vectors")
                else:
                    logger.warning(f"No Knowledge Base found for user {user_id}, cannot sync vectors")
                    
            except Exception as e:
                logger.error(f"Error triggering Knowledge Base sync: {e}")
                # Don't fail the deletion if sync fails, but log the issue
                logger.warning("Document deleted from S3 and DynamoDB, but vectors may remain in Knowledge Base until next sync")
            
            logger.info(f"Successfully completed delete operation for document {document_id}")
            return True
            
        except Exception as e:
            logger.error(f"Unexpected error deleting document {document_id}: {e}")
            return False

    def get_sync_status(self, document_id: str, user_id: str) -> Dict[str, Any]:
        """
        Get sync status for a specific document and check ingestion status
        """
        try:
            documents_table = dynamodb.Table(DOCUMENTS_TABLE_NAME)
            
            # Fix: Use correct key format
            response = documents_table.get_item(Key={'document_id': document_id})
            if 'Item' not in response:
                return {
                    "success": False,
                    "message": "Document not found"
                }
            
            document = response['Item']
            
            # Verify the document belongs to the user
            if document.get('user_id') != user_id:
                return {
                    "success": False,
                    "message": "Document not found"
                }
            
            current_status = document.get('sync_status', 'unknown')
            
            # If document is still processing, check ingestion status
            if current_status == 'processing':
                try:
                    # Invoke Knowledge Base Manager to check ingestion status
                    lambda_client = boto3.client('lambda')
                    response = lambda_client.invoke(
                        FunctionName=KB_MANAGER_FUNCTION_NAME,
                        InvocationType='RequestResponse',
                        Payload=json.dumps({
                            'operation': 'check_ingestion_status',
                            'user_id': user_id
                        })
                    )
                    
                    result = json.loads(response['Payload'].read())
                    print(f"Ingestion status check result: {result}")
                    
                    # Re-fetch document to get updated status
                    response = documents_table.get_item(Key={'document_id': document_id})
                    if 'Item' in response:
                        document = response['Item']
                        current_status = document.get('sync_status', 'unknown')
                
                except Exception as e:
                    print(f"Failed to check ingestion status: {e}")
            
            return {
                "success": True,
                "status": current_status,
                "message": document.get('message', ''),
                "lastUpdated": document.get('last_modified', '')
            }
            
        except Exception as e:
            logger.error(f"Error getting sync status: {e}")
            return {
                "success": False,
                "message": f"Error getting sync status: {str(e)}"
            }



def lambda_handler(event, context):
    """
    Lambda handler for document processing operations with enhanced logging
    """
    try:
        # Enhanced logging for debugging AppSync calls using print
        print(f"=== DOCUMENT PROCESSOR INVOKED ===")
        print(f"Event received: {json.dumps(event, default=str)}")
        print(f"Context request ID: {context.aws_request_id}")
        
        operation = event.get('operation')
        arguments = event.get('arguments', {})
        identity = event.get('identity', {})
        
        print(f"Operation: {operation}")
        print(f"Arguments keys: {list(arguments.keys()) if arguments else 'None'}")
        print(f"Identity keys: {list(identity.keys()) if identity else 'None'}")
        
        # Extract user ID from identity context (AppSync authentication)
        user_id = identity.get('sub') or arguments.get('userId')
        
        if not user_id:
            print("No user ID found - authentication required")
            return {
                "success": False,
                "message": "User authentication required"
            }
        
        print(f"Processing operation '{operation}' for user: {user_id}")
        
        processor = DocumentProcessor()
        
        if operation == 'uploadDocument':
            print("Executing uploadDocument operation")
            return processor.process_document(
                pdf_content=base64.b64decode(arguments['fileContent']),
                filename=arguments['filename'],
                user_id=user_id
            )
        
        elif operation == 'getUserDocuments':
            return processor.get_user_documents(user_id)
        
        elif operation == 'getSyncStatus':
            return processor.get_sync_status(
                document_id=arguments['documentId'],
                user_id=user_id
            )
        
        elif operation == 'deleteDocument':
            return processor.delete_document(
                document_id=arguments['documentId'],
                user_id=user_id
            )
        
        else:
            return {
                "success": False,
                "message": f"Unknown operation: {operation}"
            }
    
    except Exception as e:
        logger.error(f"Lambda handler error: {e}")
        return {
            "success": False,
            "message": f"Processing failed: {str(e)}"
        }

#!/usr/bin/env python3
"""
Knowledge Base Manager Service
Manages separate Knowledge Bases per user to avoid S3 Vectors metadata limits
"""

import boto3
import json
import hashlib
import time
import os
import logging
from typing import Dict, Optional, List, Any
from datetime import datetime

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

class KnowledgeBaseManager:
    """
    Manages separate Knowledge Bases per user for perfect isolation
    and to avoid S3 Vectors 2048-byte metadata limits
    """
    
    def __init__(self):
        self.bedrock_agent = boto3.client('bedrock-agent')
        self.s3vectors = boto3.client('s3vectors')  # Available through Lambda layer
        self.dynamodb = boto3.resource('dynamodb')
        self.user_kb_table = self.dynamodb.Table(os.environ.get('USER_KB_TABLE_NAME', 'ai-ppt-user-knowledge-bases'))
        
        # Configuration from environment
        self.region = os.environ.get('AWS_REGION', 'us-east-1')
        self.account_id = os.environ.get('AWS_ACCOUNT_ID')
        self.kb_role_arn = os.environ.get('KNOWLEDGE_BASE_ROLE_ARN')
        self.documents_bucket = os.environ.get('DOCUMENTS_BUCKET')
        
    def get_or_create_user_kb(self, user_id: str) -> Dict[str, str]:
        """
        Get existing Knowledge Base for user or create new one
        
        Args:
            user_id: User ID from Cognito
            
        Returns:
            Dict with knowledge_base_id, data_source_id, vector_bucket_name
        """
        try:
            # Check if user already has a KB
            existing_kb = self._get_user_kb_from_db(user_id)
            if existing_kb:
                # Verify KB still exists in AWS
                if self._verify_kb_exists(existing_kb['knowledge_base_id']):
                    logger.info(f"Using existing KB for user {user_id}: {existing_kb['knowledge_base_id']}")
                    return existing_kb
                else:
                    # KB was deleted, remove from DB and create new one
                    logger.warning(f"KB {existing_kb['knowledge_base_id']} no longer exists, creating new one")
                    self._remove_user_kb_from_db(user_id)
            
            # Create new KB for user
            logger.info(f"Creating new Knowledge Base for user: {user_id}")
            return self._create_user_kb(user_id)
            
        except Exception as e:
            logger.error(f"Failed to get/create KB for user {user_id}: {e}")
            raise
    
    def _get_user_kb_from_db(self, user_id: str) -> Optional[Dict[str, str]]:
        """Get user's KB info from DynamoDB"""
        try:
            response = self.user_kb_table.get_item(Key={'user_id': user_id})
            return response.get('Item')
        except Exception as e:
            logger.error(f"Failed to get user KB from DB: {e}")
            return None
    
    def _verify_kb_exists(self, kb_id: str) -> bool:
        """Verify Knowledge Base still exists in AWS"""
        try:
            self.bedrock_agent.get_knowledge_base(knowledgeBaseId=kb_id)
            return True
        except Exception:
            return False
    
    def _create_user_kb(self, user_id: str) -> Dict[str, str]:
        """Create new Knowledge Base for user using S3 Vectors (same approach as custom resource)"""
        try:
            # Generate unique names
            user_hash = hashlib.md5(user_id.encode()).hexdigest()[:8]
            timestamp = int(time.time())
            
            kb_name = f"ai-ppt-kb-{user_hash}-{timestamp}"
            vector_bucket_name = f"ai-ppt-vectors-{user_hash}-{timestamp}"
            vector_index_name = f"ai-ppt-index-{user_hash}"
            
            logger.info(f"Creating S3 Vectors Knowledge Base: {kb_name}")
            
            # Step 1: Create S3 vectors bucket
            try:
                logger.info(f"Creating S3 vectors bucket: {vector_bucket_name}")
                self.s3vectors.create_vector_bucket(vectorBucketName=vector_bucket_name)
                logger.info(f"Successfully created S3 vectors bucket: {vector_bucket_name}")
            except Exception as e:
                if 'ConflictException' in str(type(e)) or 'BucketAlreadyExists' in str(e):
                    logger.info(f"S3 vectors bucket {vector_bucket_name} already exists: {e}")
                else:
                    logger.error(f"Error creating S3 vectors bucket: {e}")
                    raise
            
            # Step 2: Create vector index with correct configuration for Titan Text v2
            try:
                logger.info(f"Creating vector index: {vector_index_name}")
                
                # Use correct dimensions for Titan Text v2 (1024, not 1536)
                # Add proper metadata configuration for Bedrock Knowledge Base integration
                index_config = {
                    "vectorBucketName": vector_bucket_name,
                    "indexName": vector_index_name,
                    "dataType": "float32",
                    "dimension": 1024,  # Titan Embed Text v2 uses 1024 dimensions
                    "distanceMetric": "cosine",
                    "metadataConfiguration": {
                        "nonFilterableMetadataKeys": ["AMAZON_BEDROCK_TEXT"]  # Critical for Bedrock KB integration
                    }
                }
                
                logger.info(f"Index config: {json.dumps(index_config, indent=2)}")
                self.s3vectors.create_index(**index_config)
                logger.info(f"Successfully created vector index: {vector_index_name}")
                
            except Exception as e:
                if 'ConflictException' in str(type(e)) or 'IndexAlreadyExists' in str(e):
                    logger.info(f"Vector index {vector_index_name} already exists: {e}")
                else:
                    logger.error(f"Error creating vector index: {e}")
                    raise
            
            # Step 3: Wait for resources to be ready
            logger.info("Waiting for S3 vectors resources to be ready...")
            time.sleep(30)  # Give time for resources to be fully available
            
            # Step 4: Create Knowledge Base with S3 Vectors storage
            logger.info("Creating Knowledge Base with S3 Vectors")
            vector_bucket_arn = f"arn:aws:s3vectors:{self.region}:{self.account_id}:bucket/{vector_bucket_name}"
            vector_index_arn = f"arn:aws:s3vectors:{self.region}:{self.account_id}:bucket/{vector_bucket_name}/index/{vector_index_name}"
            
            kb_config = {
                'name': kb_name,
                'description': f"Personal Knowledge Base for user {user_hash}",
                'roleArn': self.kb_role_arn,
                'knowledgeBaseConfiguration': {
                    'type': 'VECTOR',
                    'vectorKnowledgeBaseConfiguration': {
                        'embeddingModelArn': 'arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v2:0',
                    },
                },
                'storageConfiguration': {
                    'type': 'S3_VECTORS',
                    's3VectorsConfiguration': {
                        'vectorBucketArn': vector_bucket_arn,
                        'indexArn': vector_index_arn  # Use indexArn, not indexName
                    }
                }
            }
            
            logger.info(f"Knowledge Base config: {json.dumps(kb_config, indent=2)}")
            kb_response = self.bedrock_agent.create_knowledge_base(**kb_config)
            
            kb_id = kb_response['knowledgeBase']['knowledgeBaseId']
            logger.info(f"Created Knowledge Base: {kb_id}")
            
            # Step 5: Create Data Source
            logger.info(f"Creating data source for KB: {kb_id}")
            ds_response = self.bedrock_agent.create_data_source(
                knowledgeBaseId=kb_id,
                name=f"ai-ppt-docs-{user_hash}",
                description=f"Document source for user {user_hash}",
                dataSourceConfiguration={
                    'type': 'S3',
                    's3Configuration': {
                        'bucketArn': f'arn:aws:s3:::{self.documents_bucket}',
                        'inclusionPrefixes': [f'docs/{user_hash}/']  # Required because users share same S3 documents bucket
                    }
                },
                vectorIngestionConfiguration={
                    'chunkingConfiguration': {
                        'chunkingStrategy': 'FIXED_SIZE',
                        'fixedSizeChunkingConfiguration': {
                            'maxTokens': 500,  # Optimal for S3 Vectors with proper metadata config
                            'overlapPercentage': 10  # Better context preservation
                        }
                    },
                    'parsingConfiguration': {
                        'parsingStrategy': 'BEDROCK_FOUNDATION_MODEL',
                        'bedrockFoundationModelConfiguration': {
                            'modelArn': 'arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-pro-v1:0',
                            'parsingPrompt': {
                                'parsingPromptText': 'Extract and preserve the complete text content from this document, maintaining structure, headings, and formatting.'  # More detailed parsing now that metadata is handled
                            }
                        }
                    }
                }
            )
            
            ds_id = ds_response['dataSource']['dataSourceId']
            
            # Step 6: Store in DynamoDB
            user_kb_info = {
                'user_id': user_id,
                'knowledge_base_id': kb_id,
                'data_source_id': ds_id,
                'vector_bucket_name': vector_bucket_name,
                'vector_index_name': vector_index_name,
                'kb_name': kb_name,
                'user_hash': user_hash,
                'created_at': datetime.utcnow().isoformat(),
                'status': 'active',
                'document_count': 0,
                'storage_type': 's3_vectors'
            }
            
            self.user_kb_table.put_item(Item=user_kb_info)
            
            logger.info(f"Successfully created S3 Vectors KB for user {user_id}: {kb_id}")
            
            # Process any pending documents for this user
            self._process_pending_documents(user_id, user_kb_info)
            
            return {
                'knowledge_base_id': kb_id,
                'data_source_id': ds_id,
                'vector_bucket_name': vector_bucket_name,
                'user_hash': user_hash
            }
            
        except Exception as e:
            logger.error(f"Failed to create KB for user {user_id}: {e}")
            # Cleanup on failure
            try:
                if 'vector_bucket_name' in locals():
                    logger.info(f"Cleaning up S3 vectors bucket: {vector_bucket_name}")
                    self.s3vectors.delete_vector_bucket(vectorBucketName=vector_bucket_name)
            except Exception as cleanup_error:
                logger.warning(f"Failed to cleanup S3 vectors bucket: {cleanup_error}")
            raise
    
    def _process_pending_documents(self, user_id: str, user_kb_info: Dict[str, str]):
        """
        Process documents that were uploaded while KB was being created
        These documents are stored in pending/ prefix and need to be moved and ingested
        """
        try:
            import boto3
            s3_client = boto3.client('s3')
            
            user_hash = user_kb_info['user_hash']
            kb_id = user_kb_info['knowledge_base_id']
            ds_id = user_kb_info['data_source_id']
            
            # List all objects in the pending folder for this user
            pending_prefix = f"pending/{user_id}/"
            logger.info(f"Looking for pending documents with prefix: {pending_prefix}")
            
            response = s3_client.list_objects_v2(
                Bucket=self.documents_bucket,
                Prefix=pending_prefix
            )
            
            pending_objects = response.get('Contents', [])
            logger.info(f"Found {len(pending_objects)} pending objects for user {user_id}")
            
            if not pending_objects:
                logger.info(f"No pending documents found for user {user_id}")
                return
            
            # Process each pending document
            for obj in pending_objects:
                try:
                    old_key = obj['Key']
                    logger.info(f"Processing pending document: {old_key}")
                    
                    # Extract document info from the key
                    # Format: pending/{user_id}/{document_id}/{filename}
                    path_parts = old_key.split('/')
                    if len(path_parts) < 4:
                        logger.warning(f"Invalid pending document key format: {old_key}")
                        continue
                    
                    document_id = path_parts[2]
                    filename = path_parts[3]
                    
                    # Create new key in the user's final location
                    new_key = f"docs/{user_hash}/{document_id}/{filename}"
                    
                    logger.info(f"Moving document from {old_key} to {new_key}")
                    
                    # Copy to new location
                    s3_client.copy_object(
                        Bucket=self.documents_bucket,
                        CopySource={'Bucket': self.documents_bucket, 'Key': old_key},
                        Key=new_key
                    )
                    
                    # Delete from pending location
                    s3_client.delete_object(
                        Bucket=self.documents_bucket,
                        Key=old_key
                    )
                    
                    # Update document metadata in DynamoDB
                    documents_table = self.dynamodb.Table('ai-ppt-documents')
                    documents_table.update_item(
                        Key={'document_id': document_id},
                        UpdateExpression='SET s3_key = :new_key, sync_status = :status',
                        ExpressionAttributeValues={
                            ':new_key': new_key,
                            ':status': 'ready_for_ingestion'
                        }
                    )
                    
                    logger.info(f"Successfully moved document {document_id} to final location")
                    
                except Exception as e:
                    logger.error(f"Failed to process pending document {old_key}: {e}")
                    continue
            
            # Trigger ingestion job for all moved documents
            logger.info(f"Triggering ingestion job for KB {kb_id}, DS {ds_id}")
            self._trigger_ingestion_job(kb_id, ds_id, f"pending_documents_batch_{int(time.time())}")
            
            # Update document count in user KB record
            processed_count = len(pending_objects)
            if processed_count > 0:
                self.user_kb_table.update_item(
                    Key={'user_id': user_id},
                    UpdateExpression='ADD document_count :count',
                    ExpressionAttributeValues={':count': processed_count}
                )
                logger.info(f"Updated document count for user {user_id}: +{processed_count}")
            
            logger.info(f"Successfully processed {len(pending_objects)} pending documents for user {user_id}")
            
        except Exception as e:
            logger.error(f"Failed to process pending documents for user {user_id}: {e}")
            # Don't raise - KB creation was successful, this is just cleanup
    
    def delete_user_kb(self, user_id: str) -> bool:
        """
        Delete user's Knowledge Base and associated S3 Vectors resources
        
        Args:
            user_id: User ID from Cognito
            
        Returns:
            True if successful, False otherwise
        """
        try:
            user_kb = self._get_user_kb_from_db(user_id)
            if not user_kb:
                logger.warning(f"No KB found for user {user_id}")
                return True
            
            kb_id = user_kb['knowledge_base_id']
            vector_bucket_name = user_kb.get('vector_bucket_name')
            
            # Delete Knowledge Base (this also deletes data sources)
            logger.info(f"Deleting Knowledge Base: {kb_id}")
            self.bedrock_agent.delete_knowledge_base(knowledgeBaseId=kb_id)
            
            # Delete S3 Vector bucket if it exists
            if vector_bucket_name:
                try:
                    logger.info(f"Deleting S3 Vector bucket: {vector_bucket_name}")
                    self.s3vectors.delete_vector_bucket(vectorBucketName=vector_bucket_name)
                except Exception as e:
                    logger.warning(f"Failed to delete S3 Vector bucket {vector_bucket_name}: {e}")
            
            # Remove from DynamoDB
            self._remove_user_kb_from_db(user_id)
            
            logger.info(f"Successfully deleted KB for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete KB for user {user_id}: {e}")
            return False
    
    def _remove_user_kb_from_db(self, user_id: str):
        """Remove user KB info from DynamoDB"""
        try:
            self.user_kb_table.delete_item(Key={'user_id': user_id})
        except Exception as e:
            logger.error(f"Failed to remove user KB from DB: {e}")
    
    def list_user_kbs(self) -> List[Dict]:
        """List all user Knowledge Bases for admin purposes"""
        try:
            response = self.user_kb_table.scan()
            return response.get('Items', [])
        except Exception as e:
            logger.error(f"Failed to list user KBs: {e}")
            return []
    
    def get_kb_stats(self, user_id: str) -> Dict:
        """Get statistics for user's Knowledge Base"""
        try:
            user_kb = self._get_user_kb_from_db(user_id)
            if not user_kb:
                return {'error': 'No Knowledge Base found for user'}
            
            kb_id = user_kb['knowledge_base_id']
            
            # Get KB details
            kb_response = self.bedrock_agent.get_knowledge_base(knowledgeBaseId=kb_id)
            
            # Get data source details
            ds_response = self.bedrock_agent.get_data_source(
                knowledgeBaseId=kb_id,
                dataSourceId=user_kb['data_source_id']
            )
            
            return {
                'knowledge_base_id': kb_id,
                'status': kb_response['knowledgeBase']['status'],
                'data_source_status': ds_response['dataSource']['status'],
                'created_at': user_kb['created_at'],
                'document_count': user_kb.get('document_count', 0),
                'vector_bucket': user_kb['vector_bucket_name']
            }
            
        except Exception as e:
            logger.error(f"Failed to get KB stats for user {user_id}: {e}")
            return {'error': str(e)}


    def create_and_process_document(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create Knowledge Base and process document asynchronously
        This is called for first-time users to avoid timeout issues
        """
        try:
            user_id = event['user_id']
            document_id = event['document_id']
            filename = event['filename']
            temp_s3_key = event['temp_s3_key']
            
            logger.info(f"Creating KB and processing document for user {user_id}")
            
            # Step 1: Create user's Knowledge Base
            user_kb_info = self._create_user_kb(user_id)
            
            # Step 2: Handle document location - check if file is in pending or already in final location
            user_hash = user_kb_info['user_hash']
            final_s3_key = f"docs/{user_hash}/{document_id}/{filename}"  # Fix: Use docs/ prefix
            
            import boto3
            s3 = boto3.client('s3')
            documents_bucket = os.environ.get('DOCUMENTS_BUCKET')
            
            # Check if file exists in temp location (pending scenario)
            try:
                s3.head_object(Bucket=documents_bucket, Key=temp_s3_key)
                logger.info(f"File found in temp location: {temp_s3_key}")
                
                # Copy document from temp to final location
                s3.copy_object(
                    Bucket=documents_bucket,
                    CopySource={'Bucket': documents_bucket, 'Key': temp_s3_key},
                    Key=final_s3_key
                )
                
                # Delete temp file
                s3.delete_object(Bucket=documents_bucket, Key=temp_s3_key)
                logger.info(f"Moved document from {temp_s3_key} to {final_s3_key}")
                
            except s3.exceptions.NoSuchKey:
                # File not in temp location, check if it's already in final location
                try:
                    s3.head_object(Bucket=documents_bucket, Key=final_s3_key)
                    logger.info(f"File already exists in final location: {final_s3_key}")
                except s3.exceptions.NoSuchKey:
                    # File doesn't exist anywhere - this is an error
                    raise Exception(f"Document not found in temp location ({temp_s3_key}) or final location ({final_s3_key})")
            
            # Step 3: Update document metadata in DynamoDB
            documents_table = boto3.resource('dynamodb').Table(os.environ.get('DOCUMENTS_TABLE_NAME', 'ai-ppt-documents'))
            
            documents_table.update_item(
                Key={'document_id': document_id},
                UpdateExpression='SET s3_key = :s3_key, knowledge_base_id = :kb_id, data_source_id = :ds_id, sync_status = :status, message = :message, last_modified = :timestamp',
                ExpressionAttributeValues={
                    ':s3_key': final_s3_key,
                    ':kb_id': user_kb_info['knowledge_base_id'],
                    ':ds_id': user_kb_info['data_source_id'],
                    ':status': 'processing',
                    ':message': 'Knowledge Base created successfully. Starting document ingestion...',
                    ':timestamp': datetime.utcnow().isoformat()
                }
            )
            
            # Step 4: Trigger Knowledge Base ingestion
            self._trigger_ingestion_job(user_kb_info['knowledge_base_id'], user_kb_info['data_source_id'], document_id)
            
            # Step 5: Update document count in user KB record
            self.user_kb_table.update_item(
                Key={'user_id': user_id},
                UpdateExpression='ADD document_count :count',
                ExpressionAttributeValues={':count': 1}
            )
            logger.info(f"Updated document count for user {user_id}: +1")
            
            logger.info(f"Successfully created KB and started processing for user {user_id}, document {document_id}")
            
            return {
                'success': True,
                'knowledge_base_id': user_kb_info['knowledge_base_id'],
                'data_source_id': user_kb_info['data_source_id'],
                'document_id': document_id,
                'message': 'Knowledge Base created and document processing started'
            }
            
        except Exception as e:
            logger.error(f"Failed to create KB and process document: {e}")
            
            # Update document status to failed
            try:
                documents_table = boto3.resource('dynamodb').Table(os.environ.get('DOCUMENTS_TABLE_NAME', 'ai-ppt-documents'))
                documents_table.update_item(
                    Key={'document_id': event['document_id']},
                    UpdateExpression='SET sync_status = :status, message = :message, last_modified = :timestamp',
                    ExpressionAttributeValues={
                        ':status': 'failed',
                        ':message': f'Failed to create Knowledge Base: {str(e)}',
                        ':timestamp': datetime.utcnow().isoformat()
                    }
                )
            except Exception as update_error:
                logger.error(f"Failed to update document status: {update_error}")
            
            return {
                'success': False,
                'error': str(e),
                'document_id': event.get('document_id'),
                'message': f'Failed to create Knowledge Base: {str(e)}'
            }
    
    def _trigger_ingestion_job(self, knowledge_base_id: str, data_source_id: str, document_id: str):
        """Trigger Knowledge Base ingestion job"""
        try:
            response = self.bedrock_agent.start_ingestion_job(
                knowledgeBaseId=knowledge_base_id,
                dataSourceId=data_source_id,
                description=f"Ingestion job for document {document_id}"
            )
            
            job_id = response['ingestionJob']['ingestionJobId']
            logger.info(f"Started ingestion job {job_id} for document {document_id}")
            
            # Update document with ingestion job ID
            documents_table = boto3.resource('dynamodb').Table(os.environ.get('DOCUMENTS_TABLE_NAME', 'ai-ppt-documents'))
            documents_table.update_item(
                Key={'document_id': document_id},
                UpdateExpression='SET ingestion_job_id = :job_id, last_modified = :timestamp',
                ExpressionAttributeValues={
                    ':job_id': job_id,
                    ':timestamp': datetime.utcnow().isoformat()
                }
            )
            
        except Exception as e:
            logger.error(f"Failed to trigger ingestion job: {e}")
            raise
    
    def check_ingestion_status(self, user_id: str) -> Dict[str, Any]:
        """
        Check ingestion job status and update document statuses accordingly
        """
        try:
            # Get user's KB info
            user_kb = self._get_user_kb_from_db(user_id)
            if not user_kb:
                return {'error': 'No Knowledge Base found for user'}
            
            kb_id = user_kb['knowledge_base_id']
            ds_id = user_kb['data_source_id']
            
            # Get recent ingestion jobs
            response = self.bedrock_agent.list_ingestion_jobs(
                knowledgeBaseId=kb_id,
                dataSourceId=ds_id,
                maxResults=10
            )
            
            documents_table = boto3.resource('dynamodb').Table(os.environ.get('DOCUMENTS_TABLE_NAME', 'ai-ppt-documents'))
            updated_count = 0
            
            for job in response.get('ingestionJobSummaries', []):
                job_id = job['ingestionJobId']
                status = job['status']
                
                if status == 'COMPLETE':
                    # Find documents with this ingestion job ID and update their status
                    try:
                        # Query documents by ingestion_job_id (would need GSI, so scan for now)
                        scan_response = documents_table.scan(
                            FilterExpression='ingestion_job_id = :job_id AND sync_status IN (:processing_status, :syncing_status)',
                            ExpressionAttributeValues={
                                ':job_id': job_id,
                                ':processing_status': 'processing',
                                ':syncing_status': 'syncing'  # Handle both status values
                            }
                        )
                        
                        for item in scan_response.get('Items', []):
                            documents_table.update_item(
                                Key={'document_id': item['document_id']},
                                UpdateExpression='SET sync_status = :status, message = :message, last_modified = :timestamp',
                                ExpressionAttributeValues={
                                    ':status': 'completed',
                                    ':message': 'Document successfully indexed in Knowledge Base',
                                    ':timestamp': datetime.utcnow().isoformat()
                                }
                            )
                            updated_count += 1
                            logger.info(f"Updated document {item['document_id']} status to completed")
                    
                    except Exception as e:
                        logger.error(f"Failed to update documents for job {job_id}: {e}")
                
                elif status == 'FAILED':
                    # Update failed documents
                    try:
                        scan_response = documents_table.scan(
                            FilterExpression='ingestion_job_id = :job_id AND sync_status = :processing_status',
                            ExpressionAttributeValues={
                                ':job_id': job_id,
                                ':processing_status': 'processing'
                            }
                        )
                        
                        for item in scan_response.get('Items', []):
                            documents_table.update_item(
                                Key={'document_id': item['document_id']},
                                UpdateExpression='SET sync_status = :status, message = :message, last_modified = :timestamp',
                                ExpressionAttributeValues={
                                    ':status': 'failed',
                                    ':message': 'Knowledge Base ingestion failed',
                                    ':timestamp': datetime.utcnow().isoformat()
                                }
                            )
                            logger.info(f"Updated document {item['document_id']} status to failed")
                    
                    except Exception as e:
                        logger.error(f"Failed to update failed documents for job {job_id}: {e}")
            
            return {
                'success': True,
                'updated_documents': updated_count,
                'message': f'Updated {updated_count} document statuses'
            }
            
        except Exception as e:
            logger.error(f"Failed to check ingestion status for user {user_id}: {e}")
            return {'error': str(e)}

def lambda_handler(event, context):
    """
    Lambda handler for Knowledge Base management operations
    """
    try:
        operation = event.get('operation')
        user_id = event.get('user_id')
        
        if not user_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'user_id is required'})
            }
        
        kb_manager = KnowledgeBaseManager()
        
        if operation == 'get_or_create':
            result = kb_manager.get_or_create_user_kb(user_id)
            return {
                'statusCode': 200,
                'body': json.dumps(result)
            }
        
        elif operation == 'delete':
            success = kb_manager.delete_user_kb(user_id)
            return {
                'statusCode': 200,
                'body': json.dumps({'success': success})
            }
        
        elif operation == 'stats':
            stats = kb_manager.get_kb_stats(user_id)
            return {
                'statusCode': 200,
                'body': json.dumps(stats)
            }
        
        elif operation == 'create_and_process':
            # New async operation for first-time users
            result = kb_manager.create_and_process_document(event)
            return {
                'statusCode': 200,
                'body': json.dumps(result)
            }
        
        elif operation == 'process_pending':
            # Process pending documents for existing user
            user_kb_info = kb_manager._get_user_kb_from_db(user_id)
            if not user_kb_info:
                return {
                    'statusCode': 404,
                    'body': json.dumps({'error': 'No Knowledge Base found for user'})
                }
            
            kb_manager._process_pending_documents(user_id, user_kb_info)
            return {
                'statusCode': 200,
                'body': json.dumps({'success': True, 'message': 'Pending documents processed'})
            }
        
        elif operation == 'check_ingestion_status':
            # Check and update ingestion job statuses
            result = kb_manager.check_ingestion_status(user_id)
            return {
                'statusCode': 200,
                'body': json.dumps(result)
            }
        
        elif operation == 'list_all':
            # Admin operation
            kbs = kb_manager.list_user_kbs()
            return {
                'statusCode': 200,
                'body': json.dumps({'knowledge_bases': kbs})
            }
        
        else:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': f'Unknown operation: {operation}'})
            }
    
    except Exception as e:
        logger.error(f"Lambda handler error: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

#!/usr/bin/env python3
"""
Bedrock RAG Service V3 - Per-User Knowledge Base Architecture
Each user has their own Knowledge Base for perfect isolation
"""

import boto3
import json
import os
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)


class BedrockRAGService:
    """
    RAG service using per-user Knowledge Bases for perfect isolation
    No metadata filtering needed - each user has their own KB
    """
    
    def __init__(self):
        self.bedrock_agent_runtime = boto3.client('bedrock-agent-runtime')
        self.lambda_client = boto3.client('lambda')
        self.dynamodb = boto3.resource('dynamodb')
        
        # Environment variables
        self.kb_manager_function = os.environ.get('KB_MANAGER_FUNCTION_NAME')
        self.user_kb_table_name = os.environ.get('USER_KB_TABLE_NAME')
        
        # DynamoDB table
        if self.user_kb_table_name:
            self.user_kb_table = self.dynamodb.Table(self.user_kb_table_name)
    
    def search_similar_content(self, query: str, user_id: str, top_k: int = 5, score_threshold: float = 0.3) -> List[Dict[str, Any]]:
        """
        Search for similar content in user's personal Knowledge Base
        
        Args:
            query: Search query text
            user_id: User ID from Cognito
            top_k: Number of top results to return
            score_threshold: Minimum similarity score threshold
            
        Returns:
            List of search results with content and metadata
        """
        try:
            logger.info(f"🔍 Starting search for user {user_id} with query: '{query[:100]}...'")
            
            # Get user's Knowledge Base ID
            user_kb_info = self._get_user_kb_info(user_id)
            if not user_kb_info:
                logger.warning(f"❌ No Knowledge Base found for user {user_id}")
                return []
            
            kb_id = user_kb_info['knowledge_base_id']
            logger.info(f"✅ Found user KB: {kb_id}")
            
            logger.info(f"🔍 Searching in user KB {kb_id} for query: {query[:50]}...")
            
            # Search in user's personal Knowledge Base (no filtering needed)
            response = self.bedrock_agent_runtime.retrieve(
                knowledgeBaseId=kb_id,
                retrievalQuery={'text': query},
                retrievalConfiguration={
                    'vectorSearchConfiguration': {
                        'numberOfResults': top_k
                        # No user filtering needed - each user has their own KB
                    }
                }
            )
            
            logger.info(f"📊 Bedrock retrieve response: {len(response.get('retrievalResults', []))} raw results")
            
            # Process and filter results by score
            results = []
            for i, item in enumerate(response.get('retrievalResults', [])):
                score = item.get('score', 0.0)
                content_preview = item['content']['text'][:100] + "..." if len(item['content']['text']) > 100 else item['content']['text']
                
                logger.info(f"  Result {i+1}: Score={score:.3f}, Content='{content_preview}'")
                
                if score >= score_threshold:
                    result = {
                        'content': item['content']['text'],
                        'score': score,
                        'source': item.get('location', {}).get('s3Location', {}).get('uri', ''),
                        'metadata': item.get('metadata', {}),
                        'knowledge_base_id': kb_id
                    }
                    results.append(result)
                    logger.info(f"    ✅ Added result {i+1} (score {score:.3f} >= threshold {score_threshold})")
                else:
                    logger.info(f"    ❌ Filtered out result {i+1} (score {score:.3f} < threshold {score_threshold})")
            
            logger.info(f"🎯 Final results: {len(results)} relevant results for user {user_id}")
            
            if len(results) == 0:
                logger.warning(f"⚠️  No results met the score threshold of {score_threshold}. Consider lowering the threshold.")
            
            return results
            
        except Exception as e:
            logger.error(f"❌ Failed to search content for user {user_id}: {e}")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return []
    
    def generate_with_context(self, query: str, user_id: str, max_tokens: int = 2000) -> str:
        """
        Generate response using user's personal Knowledge Base for context
        
        Args:
            query: User query
            user_id: User ID from Cognito
            max_tokens: Maximum tokens in response
            
        Returns:
            Generated response text with context from user's documents
        """
        try:
            # Get user's Knowledge Base ID
            user_kb_info = self._get_user_kb_info(user_id)
            if not user_kb_info:
                return "I don't have access to your documents yet. Please upload some documents first."
            
            kb_id = user_kb_info['knowledge_base_id']
            
            logger.info(f"Generating response for user {user_id} using KB {kb_id}")
            
            # Use RetrieveAndGenerate for context-aware response
            response = self.bedrock_agent_runtime.retrieve_and_generate(
                input={'text': query},
                retrieveAndGenerateConfiguration={
                    'type': 'KNOWLEDGE_BASE',
                    'knowledgeBaseConfiguration': {
                        'knowledgeBaseId': kb_id,
                        'modelArn': os.environ.get('BEDROCK_MODEL_ARN', 'arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-pro-v1:0'),
                        'retrievalConfiguration': {
                            'vectorSearchConfiguration': {
                                # No user filtering needed - each user has their own KB
                            }
                        },
                        'generationConfiguration': {
                            'inferenceConfig': {
                                'textInferenceConfig': {
                                    'maxTokens': max_tokens,
                                    'temperature': 0.7,
                                    'topP': 0.9
                                }
                            }
                        }
                    }
                }
            )
            
            generated_text = response['output']['text']
            
            # Log successful generation
            logger.info(f"Generated {len(generated_text)} characters for user {user_id}")
            
            return generated_text
            
        except Exception as e:
            logger.error(f"Failed to generate response for user {user_id}: {e}")
            return f"I encountered an error while processing your request: {str(e)}"
    
    def _get_user_kb_info(self, user_id: str) -> Optional[Dict[str, str]]:
        """Get user's Knowledge Base information"""
        try:
            logger.info(f"🔍 Getting KB info for user: {user_id}")
            
            # First try to get from DynamoDB cache
            if hasattr(self, 'user_kb_table'):
                logger.info(f"📊 Checking DynamoDB table: {self.user_kb_table_name}")
                response = self.user_kb_table.get_item(Key={'user_id': user_id})
                if 'Item' in response:
                    kb_info = response['Item']
                    logger.info(f"✅ Found KB info in DynamoDB: KB ID = {kb_info.get('knowledge_base_id')}")
                    return kb_info
                else:
                    logger.info(f"❌ No KB info found in DynamoDB for user {user_id}")
            else:
                logger.warning(f"⚠️  No user_kb_table available (table name: {self.user_kb_table_name})")
            
            # If not found, try to get/create via KB Manager
            if self.kb_manager_function:
                logger.info(f"🔧 Calling KB Manager function: {self.kb_manager_function}")
                response = self.lambda_client.invoke(
                    FunctionName=self.kb_manager_function,
                    InvocationType='RequestResponse',
                    Payload=json.dumps({
                        'operation': 'get_or_create',
                        'user_id': user_id
                    })
                )
                
                result = json.loads(response['Payload'].read())
                logger.info(f"📊 KB Manager response status: {response['StatusCode']}")
                
                if response['StatusCode'] == 200:
                    kb_info = json.loads(result['body'])
                    logger.info(f"✅ KB Manager returned KB info: {kb_info}")
                    return {
                        'knowledge_base_id': kb_info['knowledge_base_id'],
                        'data_source_id': kb_info['data_source_id'],
                        'user_hash': kb_info['user_hash']
                    }
                else:
                    logger.error(f"❌ KB Manager returned error status: {response['StatusCode']}, result: {result}")
            else:
                logger.warning(f"⚠️  No KB Manager function available (function name: {self.kb_manager_function})")
            
            logger.warning(f"❌ Could not get KB info for user {user_id}")
            return None
            
        except Exception as e:
            logger.error(f"❌ Failed to get user KB info for {user_id}: {e}")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return None
    
    def get_user_kb_stats(self, user_id: str) -> Dict[str, Any]:
        """Get statistics for user's Knowledge Base"""
        try:
            if not self.kb_manager_function:
                return {'error': 'KB Manager not available'}
            
            response = self.lambda_client.invoke(
                FunctionName=self.kb_manager_function,
                InvocationType='RequestResponse',
                Payload=json.dumps({
                    'operation': 'stats',
                    'user_id': user_id
                })
            )
            
            result = json.loads(response['Payload'].read())
            
            if response['StatusCode'] == 200:
                return json.loads(result['body'])
            else:
                return {'error': 'Failed to get KB stats'}
                
        except Exception as e:
            logger.error(f"Failed to get KB stats for user {user_id}: {e}")
            return {'error': str(e)}
    
    def query_documents(self, query: str, user_id: str, max_results: int = 5) -> Dict[str, Any]:
        """
        Query user's documents and return structured results
        
        Args:
            query: Search query
            user_id: User ID from Cognito
            max_results: Maximum number of results
            
        Returns:
            Structured query results with sources and generated response
        """
        try:
            # Search for relevant content
            search_results = self.search_similar_content(query, user_id, max_results)
            
            if not search_results:
                return {
                    "success": True,
                    "query": query,
                    "results": [],
                    "generated_response": "I couldn't find any relevant information in your documents for this query. Please make sure you have uploaded documents and they have been processed.",
                    "sources": []
                }
            
            # Generate context-aware response
            generated_response = self.generate_with_context(query, user_id)
            
            # Extract sources
            sources = []
            for result in search_results:
                if result.get('source'):
                    sources.append({
                        'uri': result['source'],
                        'score': result['score']
                    })
            
            return {
                "success": True,
                "query": query,
                "results": search_results,
                "generated_response": generated_response,
                "sources": sources,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to query documents for user {user_id}: {e}")
            return {
                "success": False,
                "error": str(e),
                "query": query,
                "results": [],
                "generated_response": f"An error occurred while processing your query: {str(e)}",
                "sources": []
            }

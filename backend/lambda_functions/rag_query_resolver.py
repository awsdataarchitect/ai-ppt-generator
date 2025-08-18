"""
RAG Query Resolver V3 - Per-User Knowledge Base Architecture
Handles queries against uploaded documents using per-user Bedrock Knowledge Bases
"""

import json
import os
import logging
from typing import Dict, Any

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Environment variables
USER_KB_TABLE_NAME = os.environ.get('USER_KB_TABLE_NAME', '')
KB_MANAGER_FUNCTION_NAME = os.environ.get('KB_MANAGER_FUNCTION_NAME', '')

# Import RAG service
from bedrock_rag_service import BedrockRAGService

def create_rag_service():
    """Create RAG service instance for per-user Knowledge Bases"""
    return BedrockRAGService()

def lambda_handler(event, context):
    """
    Lambda handler for RAG queries using per-user Knowledge Bases
    """
    try:
        # Extract user ID from event context
        user_id = event.get('identity', {}).get('sub')
        if not user_id:
            return {
                "success": False,
                "message": "User authentication required"
            }
        
        # Create RAG service instance
        if USER_KB_TABLE_NAME and KB_MANAGER_FUNCTION_NAME:
            rag_service = create_rag_service()
        else:
            return {
                "success": False,
                "message": "RAG service not properly configured"
            }
        
        # Extract query parameters
        arguments = event.get('arguments', {})
        query = arguments.get('query', '')
        max_results = int(arguments.get('maxResults', 5))
        
        if not query:
            return {
                "success": False,
                "message": "Query is required"
            }
        
        logger.info(f"Processing RAG query for user {user_id}: {query[:50]}...")
        
        # Query user's personal Knowledge Base
        result = rag_service.query_documents(query, user_id, max_results)
        
        logger.info(f"RAG query completed for user {user_id}")
        return result
        
    except Exception as e:
        logger.error(f"RAG query resolver error: {e}")
        return {
            "success": False,
            "message": f"Query processing failed: {str(e)}"
        }


def search_documents(event, context):
    """
    Alternative entry point for document search
    """
    try:
        # Extract user ID from event context
        user_id = event.get('identity', {}).get('sub')
        if not user_id:
            return {
                "success": False,
                "message": "User authentication required"
            }
        
        # Create RAG service instance
        rag_service = create_rag_service()
        
        # Extract search parameters
        arguments = event.get('arguments', {})
        query = arguments.get('query', '')
        top_k = int(arguments.get('topK', 5))
        score_threshold = float(arguments.get('scoreThreshold', 0.7))
        
        if not query:
            return {
                "success": False,
                "message": "Query is required"
            }
        
        logger.info(f"Searching documents for user {user_id}: {query[:50]}...")
        
        # Search user's documents
        search_results = rag_service.search_similar_content(
            query=query,
            user_id=user_id,
            top_k=top_k,
            score_threshold=score_threshold
        )
        
        return {
            "success": True,
            "query": query,
            "results": search_results,
            "total_results": len(search_results)
        }
        
    except Exception as e:
        logger.error(f"Document search error: {e}")
        return {
            "success": False,
            "message": f"Search failed: {str(e)}"
        }

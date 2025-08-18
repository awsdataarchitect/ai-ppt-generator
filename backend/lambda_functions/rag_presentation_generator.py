"""
Production RAG Presentation Generator
Real Redis Vector Search + Amazon Bedrock Nova Pro Integration
"""

import json
import boto3
import os
import uuid
import numpy as np
from datetime import datetime
from typing import List, Dict, Any, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# AWS Configuration
AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')

# Bedrock client for embeddings and generation
from botocore.config import Config
bedrock_config = Config(
    read_timeout=3600,
    retries={'max_attempts': 3}
)
bedrock_runtime = boto3.client('bedrock-runtime', region_name=AWS_REGION, config=bedrock_config)

# Redis configuration - CONNECTION
REDIS_URL = 'redis://:UT76zVOuW8pTw5scXwnjUnzO1NeG74lD@redis-17836.c62.us-east-1-4.ec2.redns.redis-cloud.com:17836'

try:
    import redis
    from redis.commands.search.query import Query
    
    # Initialize Redis client - CONNECTION
    redis_client = redis.from_url(REDIS_URL, decode_responses=False)
    redis_client.ping()
    logger.info("✅ Redis connection established successfully")
    
except Exception as e:
    logger.error(f"❌ Redis connection failed: {e}")
    redis_client = None

# Configuration
BEDROCK_MODEL_ID = 'amazon.nova-pro-v1:0'
EMBEDDING_MODEL_ID = 'amazon.titan-embed-text-v1'
VECTOR_DIMENSION = 1536
INDEX_NAME = 'document_embeddings'

def generate_embedding(text: str) -> List[float]:
    """Generate embedding using Amazon Titan - BEDROCK CALL"""
    try:
        body = json.dumps({
            "inputText": text
        })
        
        response = bedrock_runtime.invoke_model(
            modelId=EMBEDDING_MODEL_ID,
            body=body,
            contentType='application/json',
            accept='application/json'
        )
        
        response_body = json.loads(response['body'].read())
        embedding = response_body['embedding']
        
        logger.info(f"✅ Generated query embedding with dimension: {len(embedding)}")
        return embedding
        
    except Exception as e:
        logger.error(f"❌ Embedding generation failed: {e}")
        raise

def search_similar_chunks(query_embedding: List[float], max_results: int = 5, threshold: float = 0.7) -> List[Dict]:
    """Search for similar chunks using Redis vector similarity - VECTOR SEARCH"""
    if not redis_client:
        raise Exception("Redis client not available")
    
    try:
        # Convert query embedding to bytes
        query_bytes = np.array(query_embedding, dtype=np.float32).tobytes()
        
        # Create vector search query
        query = Query(f"*=>[KNN {max_results} @embedding $query_vec AS score]").return_fields(
            "document_id", "document_name", "text", "start_pos", "end_pos", "created_at", "score"
        ).sort_by("score").dialect(2)
        
        # Execute search - REDIS VECTOR SEARCH
        results = redis_client.ft(INDEX_NAME).search(
            query, 
            query_params={"query_vec": query_bytes}
        )
        
        # Process results
        similar_chunks = []
        for doc in results.docs:
            score = float(doc.score)
            
            # Apply similarity threshold
            if score >= threshold:
                similar_chunks.append({
                    "chunk_id": doc.id.replace("doc:", ""),
                    "document_id": doc.document_id,
                    "document_name": doc.document_name,
                    "text": doc.text,
                    "similarity_score": score,
                    "start_pos": int(doc.start_pos),
                    "end_pos": int(doc.end_pos),
                    "created_at": doc.created_at
                })
        
        logger.info(f"✅ Found {len(similar_chunks)} similar chunks above threshold {threshold}")
        return similar_chunks
        
    except Exception as e:
        logger.error(f"❌ Vector search failed: {e}")
        raise

def generate_rag_presentation(prompt: str, context_chunks: List[Dict]) -> Dict:
    """Generate presentation using Bedrock Nova Pro with RAG context - BEDROCK CALL"""
    try:
        # Prepare context from chunks
        context_text = "\n\n".join([
            f"Source: {chunk['document_name']}\nContent: {chunk['text']}"
            for chunk in context_chunks
        ])
        
        # Create enhanced prompt with context
        enhanced_prompt = f"""
You are an expert presentation creator. Using the provided context from uploaded documents, create a comprehensive presentation on the topic: "{prompt}"

CONTEXT FROM UPLOADED DOCUMENTS:
{context_text}

INSTRUCTIONS:
1. Create a presentation with 5-8 slides
2. Use information from the provided context to ensure accuracy
3. Include a title slide and conclusion slide
4. Each slide should have a clear title and 3-5 bullet points
5. Generate speaker notes for each slide
6. Ensure the content is engaging and professional

Please format your response as a JSON object with the following structure:
{{
    "title": "Presentation Title",
    "slides": [
        {{
            "title": "Slide Title",
            "content": ["Bullet point 1", "Bullet point 2", "Bullet point 3"],
            "speakerNotes": "Detailed speaker notes for this slide"
        }}
    ],
    "contextSources": {len(context_chunks)},
    "generatedAt": "{datetime.utcnow().isoformat()}"
}}
"""
        
        # Call Bedrock Nova Pro - BEDROCK CALL
        body = json.dumps({
            "messages": [
                {
                    "role": "user",
                    "content": enhanced_prompt
                }
            ],
            "max_tokens": 4000,
            "temperature": 0.7,
            "top_p": 0.9
        })
        
        response = bedrock_runtime.invoke_model(
            modelId=BEDROCK_MODEL_ID,
            body=body,
            contentType='application/json',
            accept='application/json'
        )
        
        response_body = json.loads(response['body'].read())
        
        # Extract the generated content
        if 'content' in response_body and len(response_body['content']) > 0:
            generated_text = response_body['content'][0]['text']
            
            # Parse JSON response
            try:
                presentation_data = json.loads(generated_text)
                
                # Add metadata
                presentation_data['id'] = str(uuid.uuid4())
                presentation_data['prompt'] = prompt
                presentation_data['contextSources'] = len(context_chunks)
                presentation_data['generatedAt'] = datetime.utcnow().isoformat()
                
                logger.info(f"✅ Generated presentation with {len(presentation_data.get('slides', []))} slides")
                return presentation_data
                
            except json.JSONDecodeError:
                # Fallback: create structured response from text
                return create_fallback_presentation(prompt, generated_text, context_chunks)
        
        else:
            raise Exception("No content generated by Bedrock")
            
    except Exception as e:
        logger.error(f"❌ Presentation generation failed: {e}")
        raise

def create_fallback_presentation(prompt: str, generated_text: str, context_chunks: List[Dict]) -> Dict:
    """Create a structured presentation from unstructured text"""
    return {
        "id": str(uuid.uuid4()),
        "title": f"Presentation: {prompt}",
        "slides": [
            {
                "title": "Generated Content",
                "content": [generated_text[:500] + "..." if len(generated_text) > 500 else generated_text],
                "speakerNotes": "This content was generated using RAG-enhanced AI based on your uploaded documents."
            }
        ],
        "prompt": prompt,
        "contextSources": len(context_chunks),
        "generatedAt": datetime.utcnow().isoformat()
    }

def lambda_handler(event, context):
    """Main Lambda handler for RAG presentation generation"""
    
    try:
        # Handle CORS preflight
        if event.get('httpMethod') == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS'
                },
                'body': ''
            }
        
        # Parse the request
        if event.get('httpMethod') != 'POST':
            raise ValueError("Only POST method supported")
        
        body = event.get('body', '{}')
        if body:
            try:
                body_data = json.loads(body)
            except json.JSONDecodeError:
                raise ValueError("Invalid JSON in request body")
        else:
            raise ValueError("Request body is required")
        
        # Extract parameters
        prompt = body_data.get('prompt', '').strip()
        max_results = body_data.get('maxResults', 5)
        threshold = body_data.get('threshold', 0.7)
        
        if not prompt:
            raise ValueError("Prompt is required")
        
        # Step 1: Generate query embedding - BEDROCK CALL
        logger.info(f"Generating embedding for prompt: {prompt}")
        query_embedding = generate_embedding(prompt)
        
        # Step 2: Search for relevant context in Redis - VECTOR SEARCH
        logger.info(f"Searching for similar chunks with threshold {threshold}")
        context_chunks = search_similar_chunks(query_embedding, max_results, threshold)
        
        if not context_chunks:
            logger.warning("No relevant context found, generating presentation without context")
            context_chunks = []
        
        # Step 3: Generate presentation with Bedrock Nova Pro - BEDROCK CALL
        logger.info(f"Generating presentation with {len(context_chunks)} context chunks")
        presentation = generate_rag_presentation(prompt, context_chunks)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            'body': json.dumps({
                'success': True,
                'presentation': presentation,
                'contextChunksFound': len(context_chunks),
                'message': 'RAG-enhanced presentation generated successfully'
            })
        }
        
    except Exception as e:
        logger.error(f"❌ RAG presentation generation failed: {e}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            'body': json.dumps({
                'error': str(e),
                'message': 'RAG presentation generation failed'
            })
        }

if __name__ == "__main__":
    # Test the function locally
    test_event = {
        'httpMethod': 'POST',
        'body': json.dumps({
            'prompt': 'Create a presentation about artificial intelligence and machine learning',
            'maxResults': 5,
            'threshold': 0.7
        })
    }
    
    result = lambda_handler(test_event, {})
    print(json.dumps(result, indent=2))

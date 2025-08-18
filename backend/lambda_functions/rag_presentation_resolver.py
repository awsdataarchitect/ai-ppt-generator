"""
RAG-Enhanced Presentation Resolver V3 - Per-User Knowledge Base Architecture
Integrates document context with Amazon Bedrock Nova Pro for accurate presentation generation
Uses per-user Bedrock Knowledge Bases for perfect isolation
"""

import json
import boto3
import uuid
import os
from datetime import datetime
import logging
from typing import List, Dict, Any, Optional

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')

# Configure Bedrock client
from botocore.config import Config
bedrock_config = Config(
    read_timeout=3600,
    retries={'max_attempts': 3}
)
bedrock_runtime = boto3.client('bedrock-runtime', config=bedrock_config)

# Environment variables
PRESENTATIONS_TABLE_NAME = os.environ.get('PRESENTATIONS_TABLE_NAME', '')
USER_KB_TABLE_NAME = os.environ.get('USER_KB_TABLE_NAME', '')
KB_MANAGER_FUNCTION_NAME = os.environ.get('KB_MANAGER_FUNCTION_NAME', '')

# DynamoDB tables
presentations_table = dynamodb.Table(PRESENTATIONS_TABLE_NAME) if PRESENTATIONS_TABLE_NAME else None

# Import RAG service
from bedrock_rag_service import BedrockRAGService

def create_rag_service():
    """Create RAG service instance for per-user Knowledge Bases"""
    return BedrockRAGService()

class RAGPresentationGenerator:
    """Enhanced presentation generator with per-user Bedrock Knowledge Base RAG capabilities"""
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.rag_service = create_rag_service()
        self.max_context_chunks = int(os.environ.get('MAX_CONTEXT_CHUNKS', '5'))
        self.similarity_threshold = float(os.environ.get('SIMILARITY_THRESHOLD', '0.3'))  # Lowered from 0.7 to 0.3
    
    def search_relevant_context(self, query_text: str, document_ids: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """Search for relevant document chunks using user's personal Knowledge Base"""
        try:
            logger.info(f"🔍 Searching relevant context for user {self.user_id}")
            logger.info(f"📝 Query: '{query_text[:100]}...'")
            logger.info(f"📄 Document IDs provided: {document_ids}")
            logger.info(f"⚙️  Max chunks: {self.max_context_chunks}, Threshold: {self.similarity_threshold}")
            
            # Use Bedrock RAG service to search for relevant context in user's KB
            search_results = self.rag_service.search_similar_content(
                query=query_text,
                user_id=self.user_id,
                top_k=self.max_context_chunks,
                score_threshold=self.similarity_threshold
            )
            
            logger.info(f"🎯 RAG service returned {len(search_results)} relevant chunks for user {self.user_id}")
            
            # Log details of each result
            for i, result in enumerate(search_results):
                content_preview = result.get('content', '')[:100] + "..." if len(result.get('content', '')) > 100 else result.get('content', '')
                logger.info(f"  Result {i+1}: Score={result.get('score', 0):.3f}, Source='{result.get('source', 'Unknown')}', Content='{content_preview}'")
            
            return search_results
            
        except Exception as e:
            logger.error(f"❌ Failed to search relevant context for user {self.user_id}: {e}")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return []
    
    def _update_document_statuses(self):
        """Update document statuses by checking ingestion job completion"""
        try:
            logger.info(f"🔄 Checking and updating document statuses for user {self.user_id}")
            
            # Call Knowledge Base Manager to check ingestion status
            lambda_client = boto3.client('lambda')
            response = lambda_client.invoke(
                FunctionName=KB_MANAGER_FUNCTION_NAME,
                InvocationType='RequestResponse',
                Payload=json.dumps({
                    'operation': 'check_ingestion_status',
                    'user_id': self.user_id
                })
            )
            
            result = json.loads(response['Payload'].read())
            if response['StatusCode'] == 200:
                body = json.loads(result['body'])
                if body.get('success'):
                    updated_count = body.get('updated_documents', 0)
                    logger.info(f"✅ Updated {updated_count} document statuses for user {self.user_id}")
                else:
                    logger.warning(f"⚠️ Document status check returned error: {body.get('error', 'Unknown error')}")
            else:
                logger.error(f"❌ Document status check failed with status {response['StatusCode']}")
                
        except Exception as e:
            logger.warning(f"⚠️ Failed to update document statuses (non-critical): {e}")
            # Don't fail the presentation generation if status update fails
    
    def generate_presentation_with_context(self, prompt: str, document_ids: List[str] = None) -> Dict[str, Any]:
        """Generate presentation using context from user's documents"""
        try:
            # CRITICAL FIX: Update document statuses before querying
            self._update_document_statuses()
            
            # Search for relevant context
            relevant_chunks = self.search_relevant_context(prompt)
            
            # Store context chunks for title generation
            self._last_context_chunks = [chunk.get('content', '') for chunk in relevant_chunks]
            
            # Build context string
            context_text = ""
            sources = []
            
            if relevant_chunks:
                context_parts = []
                for chunk in relevant_chunks:
                    context_parts.append(f"Source: {chunk.get('source', 'Unknown')}\nContent: {chunk['content']}")
                    if chunk.get('source'):
                        sources.append(chunk['source'])
                
                context_text = "\n\n".join(context_parts)
                logger.info(f"Using {len(relevant_chunks)} context chunks for presentation generation")
            else:
                logger.warning(f"No relevant context found for prompt: {prompt}")
            
            # Generate presentation using Bedrock with context
            presentation_slides = self._generate_slides_with_bedrock(prompt, context_text)
            
            return {
                "success": True,
                "slides": presentation_slides,
                "sources": sources,
                "context_chunks_used": len(relevant_chunks),
                "context_used": len(relevant_chunks) > 0,
                "message": f"Generated presentation using context from {len(set(sources))} documents" if sources else "Generated presentation without context"
            }
            
        except Exception as e:
            logger.error(f"Failed to generate presentation for user {self.user_id}: {e}")
            return {
                "success": False,
                "message": str(e),
                "slides": [],
                "sources": [],
                "context_chunks_used": 0,
                "context_used": False
            }
    
    def _generate_intelligent_title(self, prompt: str, context_chunks: List[str]) -> str:
        """Generate an intelligent title based on prompt and context"""
        try:
            # Build a focused prompt for title generation
            if context_chunks:
                context_sample = context_chunks[0][:500] + "..." if len(context_chunks[0]) > 500 else context_chunks[0]
                title_prompt = f"""Based on this context and user request, generate a professional presentation title (maximum 8 words):

Context: {context_sample}

User Request: {prompt}

Generate only the title, nothing else. Make it professional and specific."""
            else:
                title_prompt = f"""Generate a professional presentation title (maximum 8 words) for this request:

{prompt}

Generate only the title, nothing else. Make it professional and specific."""
            
            # Call Bedrock Nova Pro for title generation
            response = bedrock_runtime.invoke_model(
                modelId='amazon.nova-pro-v1:0',
                body=json.dumps({
                    "messages": [
                        {
                            "role": "user",
                            "content": [{"text": title_prompt}]
                        }
                    ],
                    "inferenceConfig": {
                        "maxTokens": 50,
                        "temperature": 0.3,
                        "topP": 0.8
                    }
                })
            )
            
            # Parse response
            response_body = json.loads(response['body'].read())
            content = response_body.get('output', {}).get('message', {}).get('content', [])
            
            if content and len(content) > 0:
                generated_title = content[0].get('text', '').strip()
                # Clean up the title (remove quotes, extra punctuation)
                generated_title = generated_title.replace('"', '').replace("'", '').strip()
                if generated_title and len(generated_title) <= 100:  # Reasonable length check
                    return generated_title
            
            # Fallback to a cleaned version of the prompt
            return self._clean_prompt_as_title(prompt)
            
        except Exception as e:
            logger.warning(f"Failed to generate intelligent title: {e}")
            return self._clean_prompt_as_title(prompt)
    
    def _clean_prompt_as_title(self, prompt: str) -> str:
        """Clean up prompt to use as title fallback"""
        # Remove common prompt prefixes
        cleaned = prompt.lower()
        prefixes_to_remove = [
            'generate presentation on ',
            'create presentation about ',
            'make presentation for ',
            'presentation on ',
            'presentation about '
        ]
        
        for prefix in prefixes_to_remove:
            if cleaned.startswith(prefix):
                cleaned = cleaned[len(prefix):]
                break
        
        # Capitalize properly
        return cleaned.title()

    def _generate_slides_with_bedrock(self, prompt: str, context: str) -> List[str]:
        """Generate presentation slides using Bedrock Nova Pro with context"""
        
        # Build prompt with context
        if context:
            bedrock_prompt = f"""Based on the following context from uploaded documents, create a comprehensive presentation about "{prompt}".

Context from documents:
{context}

Create a presentation with 5-7 slides. Each slide should be a separate, complete slide with a title and content.
Format each slide as follows:
- Start with "Slide X: [Title]"
- Follow with bullet points or paragraphs for the slide content
- Keep each slide focused and informative
- Use the context information to make the presentation accurate and detailed

Generate the presentation now:"""
        else:
            bedrock_prompt = f"""Create a comprehensive presentation about "{prompt}".

Create a presentation with 5-7 slides. Each slide should be a separate, complete slide with a title and content.
Format each slide as follows:
- Start with "Slide X: [Title]"
- Follow with bullet points or paragraphs for the slide content
- Keep each slide focused and informative

Generate the presentation now:"""
        
        try:
            # Call Bedrock Nova Pro
            response = bedrock_runtime.invoke_model(
                modelId='amazon.nova-pro-v1:0',
                body=json.dumps({
                    "messages": [
                        {
                            "role": "user",
                            "content": [{"text": bedrock_prompt}]
                        }
                    ],
                    "inferenceConfig": {
                        "maxTokens": 4000,
                        "temperature": 0.7,
                        "topP": 0.9
                    }
                })
            )
            
            # Parse response
            response_body = json.loads(response['body'].read())
            content = response_body.get('output', {}).get('message', {}).get('content', [])
            
            if content and len(content) > 0:
                presentation_text = content[0].get('text', '')
                
                # Split into slides
                slides = []
                slide_parts = presentation_text.split('Slide ')
                
                for i, part in enumerate(slide_parts):
                    if i == 0:  # Skip the first empty part
                        continue
                    
                    slide_content = f"Slide {part}".strip()
                    if slide_content:
                        slides.append(slide_content)
                
                logger.info(f"Generated {len(slides)} slides using Bedrock Nova Pro")
                return slides if slides else [presentation_text]
            else:
                logger.error("No content returned from Bedrock")
                return ["Error: No content generated"]
                
        except Exception as e:
            logger.error(f"Bedrock generation error: {e}")
            return [f"Error generating presentation: {str(e)}"]

    def _generate_with_bedrock(self, topic: str, requirements: str, slide_count: int, context: str) -> str:
        """Generate presentation content using Bedrock Nova Pro with context"""
        
        # Build prompt with context
        if context:
            prompt = f"""Based on the following context from uploaded documents, create a comprehensive presentation about "{topic}".

CONTEXT FROM DOCUMENTS:
{context}

REQUIREMENTS:
- Topic: {topic}
- Additional requirements: {requirements}
- Number of slides: {slide_count}
- Use information from the provided context where relevant
- If context doesn't cover certain aspects, use general knowledge
- Make the presentation engaging and well-structured

Please create a presentation with the following structure:
1. Title slide
2. {slide_count - 2} content slides covering key aspects
3. Conclusion slide

Format each slide as:
## Slide [number]: [Title]
- [Bullet point 1]
- [Bullet point 2]
- [Bullet point 3]

Generate the presentation now:"""
        else:
            prompt = f"""Create a comprehensive presentation about "{topic}".

REQUIREMENTS:
- Topic: {topic}
- Additional requirements: {requirements}
- Number of slides: {slide_count}
- Make the presentation engaging and well-structured

Please create a presentation with the following structure:
1. Title slide
2. {slide_count - 2} content slides covering key aspects
3. Conclusion slide

Format each slide as:
## Slide [number]: [Title]
- [Bullet point 1]
- [Bullet point 2]
- [Bullet point 3]

Generate the presentation now:"""
        
        try:
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
                        "maxTokens": 4000,
                        "temperature": 0.7,
                        "topP": 0.9
                    }
                })
            )
            
            response_body = json.loads(response['body'].read())
            generated_content = response_body['output']['message']['content'][0]['text']
            
            logger.info(f"Generated presentation content ({len(generated_content)} characters)")
            return generated_content
            
        except Exception as e:
            logger.error(f"Bedrock generation failed: {e}")
            raise


def generate_presentation_with_rag(event, rag_service, user_id):
    """Generate presentation using RAG with user's personal Knowledge Base"""
    try:
        arguments = event.get('arguments', {})
        prompt = arguments.get('prompt', '')
        title = arguments.get('title', '')
        document_ids = arguments.get('documentIds', [])
        
        if not prompt:
            return {
                "title": title or "Untitled Presentation",
                "slides": [],
                "success": False,
                "message": "Prompt is required",
                "contextUsed": False,
                "sources": [],
                "relevantChunksCount": 0,
                "presentationId": None
            }
        
        # Check if documents are still being processed
        if document_ids:
            documents_table = dynamodb.Table(os.environ.get('DOCUMENTS_TABLE_NAME', 'ai-ppt-documents'))
            processing_docs = []
            
            # CRITICAL: Always trigger status update check first
            try:
                import boto3
                lambda_client = boto3.client('lambda')
                lambda_client.invoke(
                    FunctionName=os.environ.get('KB_MANAGER_FUNCTION_NAME', 'KnowledgeBaseManagerFunction'),
                    InvocationType='Event',  # Async call
                    Payload=json.dumps({
                        'operation': 'check_ingestion_status',
                        'user_id': user_id
                    })
                )
                logger.info("Triggered automatic status update check")
                
                # Wait a moment for the status update to complete
                import time
                time.sleep(2)  # Give the async call time to complete
                
            except Exception as e:
                logger.warning(f"Could not trigger status update: {e}")
            
            # Now check document statuses (they might have been updated)
            for doc_id in document_ids:
                try:
                    response = documents_table.get_item(Key={'document_id': doc_id})
                    if 'Item' in response:
                        doc = response['Item']
                        if doc.get('sync_status') in ['pending', 'syncing', 'processing']:
                            processing_docs.append(doc.get('filename', doc_id))
                except Exception as e:
                    logger.warning(f"Could not check status for document {doc_id}: {e}")
            
            if processing_docs:
                return {
                    "title": title or "Untitled Presentation",
                    "slides": [],
                    "success": False,
                    "message": f"⏳ Please wait - {len(processing_docs)} document(s) are still being processed and indexed in your Knowledge Base. This usually takes 1-2 minutes. Documents: {', '.join(processing_docs[:3])}{'...' if len(processing_docs) > 3 else ''}",
                    "contextUsed": False,
                    "sources": [],
                    "relevantChunksCount": 0,
                    "presentationId": None,
                    "waitingForDocuments": True,
                    "processingDocuments": processing_docs
                }
        
        # Create presentation generator for user
        generator = RAGPresentationGenerator(user_id)
        
        # Generate presentation with context using the prompt and document IDs
        result = generator.generate_presentation_with_context(prompt, document_ids)
        
        if result.get('success'):
            # Generate intelligent title if not provided
            if not title:
                context_chunks = []
                if result.get('context_used') and hasattr(generator, '_last_context_chunks'):
                    context_chunks = generator._last_context_chunks
                title = generator._generate_intelligent_title(prompt, context_chunks)
            
            # Store presentation in DynamoDB
            presentation_id = str(uuid.uuid4())
            
            if presentations_table:
                presentations_table.put_item(
                    Item={
                        'id': presentation_id,
                        'userId': user_id,
                        'title': title,
                        'content': result.get('slides', []),
                        'sources': result.get('sources', []),
                        'contextChunksUsed': result.get('context_chunks_used', 0),
                        'slideCount': len(result.get('slides', [])),
                        'createdAt': datetime.utcnow().isoformat() + 'Z',  # Consistent format with Z
                        'updatedAt': datetime.utcnow().isoformat() + 'Z'   # Consistent format with Z
                    }
                )
            
            # Return GraphQL schema-compliant structure
            return {
                "title": title,
                "slides": result.get('slides', []),
                "success": True,
                "message": result.get('message', 'Presentation generated successfully'),
                "contextUsed": result.get('context_used', True),
                "sources": result.get('sources', []),
                "relevantChunksCount": result.get('context_chunks_used', 0),
                "presentationId": presentation_id
            }
        else:
            return {
                "title": title or generator._clean_prompt_as_title(prompt),
                "slides": [],
                "success": False,
                "message": result.get('message', 'Failed to generate presentation'),
                "contextUsed": False,
                "sources": [],
                "relevantChunksCount": 0,
                "presentationId": None
            }
            
    except Exception as e:
        logger.error(f"Failed to generate presentation with RAG: {e}")
        return {
            "title": arguments.get('title') or RAGPresentationGenerator(user_id)._clean_prompt_as_title(arguments.get('prompt', 'Error')),
            "slides": [],
            "success": False,
            "message": f"Error generating presentation: {str(e)}",
            "contextUsed": False,
            "sources": [],
            "relevantChunksCount": 0,
            "presentationId": None
        }
        return {
            "success": False,
            "message": f"Presentation generation failed: {str(e)}"
        }


def query_user_documents(event, rag_service, user_id):
    """Query user's documents using their personal Knowledge Base"""
    try:
        arguments = event.get('arguments', {})
        query = arguments.get('query', '')
        max_results = int(arguments.get('maxResults', 5))
        
        if not query:
            return {
                "success": False,
                "message": "Query is required"
            }
        
        # Query user's documents
        result = rag_service.query_documents(query, user_id, max_results)
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to query documents for user {user_id}: {e}")
        return {
            "success": False,
            "message": f"Document query failed: {str(e)}"
        }


def lambda_handler(event, context):
    """
    Lambda handler for RAG presentation generation with per-user Knowledge Bases
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
        
        # Handle different operations
        operation = event.get('operation', 'generatePresentation')
        
        if operation == 'generatePresentation':
            return generate_presentation_with_rag(event, rag_service, user_id)
        elif operation == 'queryDocuments':
            return query_user_documents(event, rag_service, user_id)
        else:
            return {
                "success": False,
                "message": f"Unknown operation: {operation}"
            }
    
    except Exception as e:
        logger.error(f"RAG presentation resolver error: {e}")
        return {
            "success": False,
            "message": f"Processing failed: {str(e)}"
        }

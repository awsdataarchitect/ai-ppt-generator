# AI PPT Generator - AWS-Native RAG System

**Status**: ✅ **PRODUCTION DEPLOYED**  
**Live URL**: https://main.d2ashs0ytllqag.amplifyapp.com  
**Architecture**: AWS-Native Bedrock Knowledge Base with S3 Vectors  
**AI Engine**: Amazon Bedrock Nova Pro + Titan Embeddings  

## Overview

Enterprise AI-powered presentation generator with complete serverless AWS architecture. The system combines document upload, RAG (Retrieval-Augmented Generation) processing, and AI-powered presentation creation into a unified SaaS platform using AWS-native services.

## Key Features

✅ **Perfect User Isolation**: Each user has their own Knowledge Base  
✅ **Smart AI Context**: Multi-pattern context extraction with 4 detection methods  
✅ **Revolutionary Templates**: Nova Canvas AI-powered intelligent merging  
✅ **Configurable Slides**: Professional dropdown (3-15 slides, default 7)  
✅ **Document Upload**: Drag & drop with progress tracking  
✅ **RAG Processing**: User-specific Amazon Bedrock Knowledge Base with semantic search  
✅ **AI Generation**: Context-aware presentations using user's uploaded documents  
✅ **Export Formats**: HTML, Reveal.js, Marp presentations  
✅ **Timeout Handling**: Robust processing with graceful failures  
✅ **Cost Optimized**: S3 Vectors reduces vector storage costs by up to 90%  

## Architecture

### Core Components
- **Frontend**: Next.js/React with Amplify v6 authentication
- **Backend**: AWS Lambda functions with separate Knowledge Bases per user
- **Database**: DynamoDB + Individual Amazon Bedrock Knowledge Bases per user
- **Vector Storage**: Individual Amazon S3 Vectors per user (cost-optimized)
- **AI Engine**: Amazon Bedrock Nova Pro + Titan embeddings
- **Storage**: S3 for documents and presentations
- **Hosting**: AWS Amplify with CI/CD
- **S3 Vectors Support**: Lambda layer `bedrock-layer:1` with boto3 1.40.11+

### Per-User Knowledge Base Architecture

Each user gets completely isolated resources:

```
User A → Knowledge Base A → S3 Vectors A (only User A's docs)
User B → Knowledge Base B → S3 Vectors B (only User B's docs)
User C → Knowledge Base C → S3 Vectors C (only User C's docs)
```

**Benefits:**
- 🚀 **Faster Deployments**: No waiting for shared KB creation during CDK deploy
- 💰 **Cost Efficient**: Only create resources when users actually use the system
- 🔒 **Perfect Isolation**: Each user has completely separate resources
- 🧹 **Clean Architecture**: No unused shared resources
- 📈 **Scalable**: Supports 100 users per AWS account (can request increase)

### S3 Vectors Implementation

This was my **first implementation** of Amazon S3 Vectors (just after it released in preview) with Bedrock Knowledge Base, providing:

- **90% Cost Reduction**: Significantly cheaper than OpenSearch Serverless
- **Serverless**: No infrastructure management required
- **Integrated**: Native integration with Bedrock Knowledge Base
- **Scalable**: Built on S3's durability and scalability

| Component | OpenSearch Serverless | S3 Vectors |
|-----------|----------------------|------------|
| **Cost** | Higher (compute + storage) | 90% lower (storage only) |
| **Latency** | Sub-millisecond | Sub-second |
| **Use Case** | Real-time applications | Cost-sensitive RAG |

## Quick Start

### Prerequisites
- AWS CLI configured with appropriate permissions
- Node.js 18+ and npm
- AWS CDK v2 installed globally
- Python 3.11+ for Lambda functions

### 1. Clone and Setup
```bash
git clone https://github.com/awsdataarchitect/ai-ppt-generator.git
cd ai-ppt-generator
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your AWS account details
```

### 3. Build Bedrock Layer (One-Time Setup)
```bash
cd infrastructure
mkdir -p bedrock-layer/python

# Create requirements for S3 Vectors support
cat > bedrock-layer/requirements.txt << 'EOF'
boto3>=1.40.0
botocore>=1.40.0
s3transfer>=0.13.0
urllib3>=2.0.0
jmespath>=1.0.0
python-dateutil>=2.9.0
six>=1.17.0
EOF

# Install dependencies
pip install -r bedrock-layer/requirements.txt -t bedrock-layer/python/

# Publish Lambda layer
aws lambda publish-layer-version \
    --layer-name bedrock-layer \
    --description "Bedrock layer with boto3>=1.40.0 for S3 Vectors support" \
    --zip-file fileb://<(cd bedrock-layer && zip -r - .) \
    --compatible-runtimes python3.11 python3.12 \
    --compatible-architectures x86_64
```

### 4. Deploy Infrastructure
```bash
cd infrastructure
npm install
cdk bootstrap  # First time only
cdk deploy --all
```

### 5. Deploy Frontend
```bash
cd frontend
npm install
npm run build
# Deploy via Amplify console or CLI
```

### 6. Test System
1. Visit the live URL
2. Sign up/sign in with email
3. Upload a PDF document
4. Generate RAG-enhanced presentation
5. Export in multiple formats

## Installation & Configuration

### Bedrock Layer Requirements

**CRITICAL**: The bedrock-layer must be built and published **before** deploying the CDK stack.

#### Layer Contents
```
bedrock-layer/python/
├── boto3/                 # AWS SDK for Python (1.40.11+)
├── botocore/             # Core AWS library with S3 Vectors support
├── s3transfer/           # S3 transfer utilities
├── urllib3/              # HTTP library
├── jmespath/             # JSON query language
├── dateutil/             # Date utilities
└── six.py                # Python 2/3 compatibility
```

#### Version Management
- **Current Version**: `bedrock-layer:1`
- **CDK Reference**: Hardcoded in `ai-ppt-complete-stack.ts`
- **Update Process**: Increment version number in both layer creation and CDK stack
- **Persistence**: Layer persists across CDK deployments once created

### S3 Vectors Critical Configuration

#### 1. Metadata Configuration for Bedrock Integration
```python
# ✅ CORRECT - Required for Bedrock KB integration
s3vectors.create_index(
    vectorBucketName=bucket_name,
    indexName=index_name,
    dimension=1024,
    distanceMetric="cosine",
    dataType="float32",
    metadataConfiguration={"nonFilterableMetadataKeys": ["AMAZON_BEDROCK_TEXT"]}
)
```

#### 2. Vector Index Dimensions
```python
# ✅ CORRECT - For Titan Text v2
"dimension": 1024  # Titan Embed Text v2 uses 1024 dimensions
```

#### 3. Knowledge Base Configuration
```python
# ✅ CORRECT - Must use full ARN
's3VectorsConfiguration': {
    'vectorBucketArn': vector_bucket_arn,
    'indexArn': vector_index_arn  # Full ARN required, not indexName
}
```

#### 4. Data Source Configuration
```python
# ✅ CORRECT - Must include 'type'
'dataSourceConfiguration': {
    'type': 'S3',  # CRITICAL: This parameter is required
    's3Configuration': {
        'bucketArn': bucket_arn
    }
}
```

### Per-User Knowledge Base Implementation

#### User KB Tracking Table (DynamoDB)
```python
{
    'user_id': 'cognito-user-uuid',           # Primary Key
    'knowledge_base_id': 'ABCD1234EFGH',      # AWS KB ID
    'data_source_id': 'WXYZ5678IJKL',         # AWS Data Source ID
    'vector_bucket_name': 'ai-ppt-vectors-user123-timestamp',
    'vector_index_name': 'ai-ppt-index-user123',
    'kb_name': 'ai-ppt-kb-user123-timestamp',
    'user_hash': 'user123',                   # 8-char hash for S3 prefixes
    'created_at': '2025-08-17T14:00:00Z',
    'status': 'active',
    'document_count': 5
}
```

#### Knowledge Base Manager Service
```python
class KnowledgeBaseManager:
    def get_or_create_user_kb(self, user_id: str) -> Dict[str, str]:
        # Check if user already has KB
        existing_kb = self._get_user_kb_from_db(user_id)
        if existing_kb and self._verify_kb_exists(existing_kb['knowledge_base_id']):
            return existing_kb
        
        # Create new KB with S3 Vectors
        return self._create_user_kb(user_id)
```

## Usage

### Document Processing Pipeline
1. **Upload**: Files uploaded to S3 with user-specific prefixes
2. **Auto-Process**: Knowledge Base automatically detects format and extracts text
3. **Chunk**: Knowledge Base splits content optimally with metadata
4. **Embed**: Knowledge Base generates embeddings using Titan
5. **Store**: Vectors stored in S3 Vectors (cost-optimized)
6. **Index**: Content indexed for semantic search
7. **Query**: RetrieveAndGenerate API provides context-aware responses

### RAG Service Implementation
```python
class BedrockRAGService:
    def search_similar_content(self, query: str, user_id: str):
        # Get user's KB ID
        user_kb_info = self._get_user_kb_info(user_id)
        kb_id = user_kb_info['knowledge_base_id']
        
        # Direct search in user's KB (no filtering needed)
        return self.bedrock_agent_runtime.retrieve(
            knowledgeBaseId=kb_id,
            retrievalQuery={'text': query}
        )
```

### Frontend Authentication (Amplify v6)
```javascript
import { signIn, signUp, signOut, getCurrentUser } from 'aws-amplify/auth';

export class AuthService {
    async signIn(email, password) {
        try {
            const result = await signIn({ username: email, password });
            return { success: true, result };
        } catch (error) {
            if (error.name === 'UserAlreadyAuthenticatedException') {
                return { success: true, alreadyAuthenticated: true };
            }
            return { success: false, error: error.message };
        }
    }
}
```

## Deployment

### Deployment Flow
1. **CDK Deploy**: Creates infrastructure (tables, Lambda functions, IAM roles) - **NO Knowledge Base created**
2. **User Signs Up**: User account created in Cognito
3. **First Document Upload**: 
   - Knowledge Base Manager creates user's personal KB with S3 Vectors (~2 minutes)
   - Creates user's personal S3 Vector bucket and index
   - Creates user's personal data source with Nova Pro parsing
   - Processes document into user's KB
4. **Subsequent Uploads**: Use existing user KB (much faster)


### Deployment Verification
✅ **Infrastructure**: All CDK stacks deployed successfully  
✅ **Knowledge Base**: Status is ACTIVE  
✅ **Data Source**: Status is AVAILABLE  
✅ **Lambda Functions**: All functions deployed and configured  
✅ **Frontend**: Amplify app deployed and accessible  
✅ **Authentication**: Sign up/sign in working  
✅ **Document Upload**: Files processing successfully  
✅ **RAG Queries**: Context-aware responses generated  

## Development

### Backend Lambda Functions

#### Document Processor
```python
def lambda_handler(event, context):
    operation = event.get('operation')
    
    if operation == 'uploadDocument':
        return handle_upload_document(event.get('arguments', {}))
    elif operation == 'getSyncStatus':
        return handle_get_sync_status(event.get('arguments', {}))
    
    return {"success": False, "message": f"Unknown operation: {operation}"}
```

#### RAG Query Resolver
```python
def lambda_handler(event, context):
    query = event['arguments']['query']
    user_id = event['identity']['sub']
    
    rag_service = BedrockRAGService(
        knowledge_base_id=os.environ['KNOWLEDGE_BASE_ID']
    )
    
    result = rag_service.query_documents(query, user_id)
    return result
```

### Frontend Components

#### File Upload Manager
```javascript
class FileUploadManager {
    async uploadDocument(file, userId) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId);
        
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        return response.json();
    }
}
```

### Scaling Considerations

#### AWS Account Limits
- **Knowledge Bases per account**: 100 (hard limit)
- **Solution for >100 users**: Multi-account architecture
- **Cross-account setup**: Use AWS Organizations for user distribution

#### Multi-Account Strategy
```
Main Account (Account A): Users 1-100, 100 Knowledge Bases
Secondary Account (Account B): Users 101-200, 100 Knowledge Bases
Tertiary Account (Account C): Users 201-300, 100 Knowledge Bases
```

## Troubleshooting

### Critical S3 Vectors Issues

#### Document Deletion
```python
# ✅ CORRECT - Complete deletion including S3 Vector cleanup
def delete_document(document_id, user_id):
    # Delete S3 file
    s3.delete_object(Bucket=bucket, Key=s3_key)
    # Delete DynamoDB record
    table.delete_item(Key={'document_id': document_id})
    
    # CRITICAL: Trigger Knowledge Base sync to remove vectors
    bedrock_agent.start_ingestion_job(
        knowledgeBaseId=knowledge_base_id,
        dataSourceId=data_source_id,
        description=f'Sync after deleting document {document_id}'
    )
```

#### Automatic Status Updates
```python
# ✅ CORRECT - Automatic status update before checking
def generate_presentation():
    # CRITICAL: Trigger automatic status update first
    lambda_client.invoke(
        FunctionName='KnowledgeBaseManagerFunction',
        InvocationType='Event',
        Payload=json.dumps({
            'operation': 'check_ingestion_status',
            'user_id': user_id
        })
    )
    time.sleep(2)  # Wait for async update
    
    # Now check document status (may have been updated)
    if doc.sync_status == 'syncing':
        return waiting_message_with_retry_button
```

### Common Pitfalls and Solutions

| Error Pattern | Root Cause | Solution |
|---------------|------------|----------|
| `Query vector contains invalid values` | Wrong dimensions | Use 1024 for Titan Text v2 |
| `Missing required parameter: "type"` | Missing data source type | Add `'type': 'S3'` |
| `Missing required fields: vectorBucketArn` | Wrong parameter format | Use `indexArn` not `indexName` |
| `not authorized to perform: s3vectors:GetIndex` | Missing IAM permission | Add `s3vectors:GetIndex` |
| `Invalid vector bucket name` | Naming violation | Follow S3 vectors naming rules |

### Debugging Resources

#### CloudWatch Logs Analysis
```bash
# Check Lambda function logs
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/YourStack-KnowledgeBase"

# Get specific error details
aws logs get-log-events --log-group-name "/aws/lambda/..." --log-stream-name "..."
```

#### Resource Status Verification
```python
# Check Knowledge Base status
response = bedrock_agent.get_knowledge_base(knowledgeBaseId=kb_id)
print(f"Status: {response['knowledgeBase']['status']}")

# Check Data Source status
response = bedrock_agent.get_data_source(knowledgeBaseId=kb_id, dataSourceId=ds_id)
print(f"Status: {response['dataSource']['status']}")
```

### Resolved Issues

#### Data Consistency Issues 
**Solution**: ✅ **RESOLVED** - Unified to single `content` field throughout entire system
- GraphQL schema uses only `content: [String!]`
- All backend resolvers use `content` field
- Frontend completely migrated to `content` field

#### AI Improve Splitting Slides 
**Solution**: ✅ **RESOLVED** - Fixed parsing logic to preserve markdown formatting
- Removed `###` splitting from slide parsing
- Markdown headers now preserved within slides
- AI improvements maintain original slide count

#### Preview Button JavaScript Error 
**Solution**: ✅ **RESOLVED** - Cleaned up slide processing logic
- Fixed variable scope issues in showPresentationModal
- Removed duplicate filtering operationsns
- Preview functionality fully restored
- Slide navigation working correctly

#### 1. Bedrock Layer Issues
**Symptoms**: CDK deployment fails with layer not found or S3 Vectors client unavailable

**Solutions**:
```bash
# Verify layer exists
aws lambda list-layer-versions --layer-name bedrock-layer

# If layer doesn't exist, build it first (see Quick Start step 3)
cd infrastructure
mkdir -p bedrock-layer/python
pip install boto3>=1.40.0 botocore>=1.40.0 -t bedrock-layer/python/
aws lambda publish-layer-version --layer-name bedrock-layer --zip-file fileb://<(cd bedrock-layer && zip -r - .)

# Update CDK stack with correct layer version
# Edit infrastructure/lib/ai-ppt-complete-stack.ts if needed
```

#### 1. Knowledge Base Sync Failures
**Symptoms**: Documents uploaded but not searchable

**Solutions**:
```bash
# Check Knowledge Base status
aws bedrock-agent get-knowledge-base --knowledge-base-id <kb-id>

# Check ingestion job status
aws bedrock-agent list-ingestion-jobs --knowledge-base-id <kb-id> --data-source-id <ds-id>

# Verify S3 permissions and document format
```

#### 2. Authentication Issues
**Symptoms**: Sign in fails or session not persisting

**Solutions**:
- Verify Cognito User Pool configuration
- Check Amplify v6 configuration format
- Ensure webpack polyfills are included
- Review browser console for errors

#### 3. RAG Queries Return Empty Results
**Symptoms**: Queries return no results despite documents being synced

**Solutions**:
```bash
# Test Knowledge Base retrieval directly
aws bedrock-agent-runtime retrieve \
  --knowledge-base-id <kb-id> \
  --retrieval-query '{"text": "test query"}'

# Check user isolation filters
# Verify document sync completion
```

#### 4. Lambda Timeout Errors
**Symptoms**: Document processing fails with timeout

**Solutions**:
- Check document size (max 50MB for Knowledge Base ingestion)
- Review CloudWatch logs for specific errors
- Verify timeout settings (15 minutes max)
- Monitor Knowledge Base ingestion job status

### Monitoring

#### CloudWatch Metrics
- Lambda function duration and errors
- Knowledge Base sync job success rate
- Bedrock API call latency
- DynamoDB read/write capacity

#### Recommended Alarms
```bash
# High error rate
aws cloudwatch put-metric-alarm \
  --alarm-name "Lambda-HighErrorRate" \
  --metric-name "Errors" \
  --namespace "AWS/Lambda" \
  --statistic "Sum" \
  --threshold 10

# Knowledge Base sync failures
aws cloudwatch put-metric-alarm \
  --alarm-name "KnowledgeBase-SyncFailures" \
  --metric-name "SyncJobFailures" \
  --namespace "AWS/Bedrock" \
  --threshold 5
```




## 🔧 S3 VECTORS METADATA OPTIMIZATION

### **Critical AWS Limitation: S3 Vectors 2048-Byte Filterable Metadata Limit**

**Official AWS Documentation References:**
- [S3 Vectors Limitations and Restrictions](https://docs.aws.amazon.com/AmazonS3/latest/userguide/s3-vectors-limitations.html)
- [S3 Vectors Metadata Filtering](https://docs.aws.amazon.com/AmazonS3/latest/userguide/s3-vectors-metadata-filtering.html)
- [Using S3 Vectors with Amazon Bedrock Knowledge Bases](https://docs.aws.amazon.com/AmazonS3/latest/userguide/s3-vectors-bedrock-kb.html)

**AWS Official Limitation:**
> **Filterable metadata per vector: Up to 2 KB**

**Root Cause**: Amazon S3 Vectors has a strict **2048-byte limit for filterable metadata per vector**. When using Amazon Bedrock Knowledge Base with S3 Vectors, the combination of automatically generated metadata exceeds this limit:

```
Metadata Components (Estimated):
- Document URI (S3 path): ~100-200 bytes
- User isolation metadata: ~8-16 bytes  
- Nova Pro parsing metadata: ~800-1500 bytes
- Knowledge Base chunk metadata: ~200-400 bytes
- Other processing metadata: ~100-200 bytes
TOTAL: ~1200-2300+ bytes (often exceeds 2048 limit)
```

**Error Message:**
```
"Invalid record for key 'xxx': Filterable metadata must have at most 2048 bytes 
(Service: S3Vectors, Status Code: 400)"
```

### **✅ SOLUTION IMPLEMENTED**

**Comprehensive optimization to stay under S3 Vectors metadata limit:**

#### **1. Removed User Isolation Filtering from S3 Vectors**
```python
# ❌ BEFORE - Caused metadata overflow
'retrievalConfiguration': {
    'vectorSearchConfiguration': {
        'filter': {
            'equals': {
                'key': 'user_hash',
                'value': user_hash  # Added ~8-16 bytes + processing overhead
            }
        }
    }
}

# ✅ AFTER - No user filtering in S3 Vectors metadata
'retrievalConfiguration': {
    'vectorSearchConfiguration': {
        'numberOfResults': top_k
        # No user filtering to stay under metadata limit
    }
}
```

#### **2. Ultra-Minimal S3 Key Structure**
```python
# ❌ BEFORE - Long paths (139+ bytes)
s3_key = f"knowledge-base-documents/{user_id}/{document_id}/{filename}"
# Example: knowledge-base-documents/c4c8d488-4021-70bd-28f7-59469ffcac68/2aa76375-5ffb-4ec3-8a57-0d9ab7f243d9/Vivek Velso - AI Engineering Leadpdf.pdf

# ✅ AFTER - Minimal paths (~20-30 bytes)
s3_key = f"docs/{doc_hash}/{safe_filename}"
# Example: docs/vivek01/resume.txt
```

#### **3. Optimized Chunking Configuration**
```python
# ❌ BEFORE - Large chunks with more metadata
'maxTokens': 500,
'overlapPercentage': 5

# ✅ AFTER - Smaller chunks with less metadata
'maxTokens': 200,  # Reduced chunk size
'overlapPercentage': 1  # Minimal overlap
```

#### **4. Minimal Parsing Prompt**
```python
# ❌ BEFORE - Verbose prompt generating extensive metadata
'parsingPromptText': 'Extract and preserve all text content from this document, maintaining structure and formatting. Include all headings, paragraphs, lists, and any other textual information.'

# ✅ AFTER - Minimal prompt reducing parsing metadata
'parsingPromptText': 'Extract text.'
```

### **🧪 VALIDATION RESULTS**

**Standalone Testing Confirmed:**
- ✅ **Minimal configuration works** (20-byte S3 keys, no user isolation)
- ✅ **Nova Pro parsing compatible** with S3 Vectors when optimized
- ✅ **Ingestion successful** with optimized metadata (0 failed documents)
- ✅ **Retrieval functional** without user isolation filtering

**Metadata Size Analysis:**
```
BEFORE (Failed - Exceeded 2048 bytes):
- Document URI: ~184 bytes
- User isolation: ~16 bytes + processing overhead
- Nova Pro metadata: ~1200+ bytes (actual)
- Other metadata: ~400+ bytes
- TOTAL: ~1800+ bytes (but actual exceeded 2048 limit due to processing overhead)

AFTER (Success - Under 2048 bytes):
- Document URI: ~65 bytes (docs/abc123/file.txt)
- No user isolation: 0 bytes
- Minimal Nova Pro metadata: ~600 bytes (reduced)
- Other metadata: ~200 bytes
- TOTAL: ~865 bytes (well under 2048 limit)
```

## 🔐 SECURITY

### Data Protection
- **Encryption**: All data encrypted at rest and in transit
- **User Isolation**: Strict filtering by user_id in all queries
- **Access Control**: IAM roles with least privilege principle
- **Authentication**: AWS Cognito with MFA support

### Frontend Security
- **No Hardcoded Secrets**: All sensitive configuration values are sourced from environment variables only
- **Fail-Fast Validation**: Application validates required environment variables at startup
- **Secure Configuration**: Centralized config module with explicit validation
- **Single Source of Truth**: Consistent `.env` file usage across all environments

### Configuration Management
- **Environment Variables**: All sensitive values must be provided via environment variables
- **Build Validation**: Secure build process validates all required configuration
- **No Fallback Values**: Removed all hardcoded fallbacks to prevent secret exposure
- **Consistent Naming**: Single `.env` file strategy for all environments



#### **✅ Active Production Files (15 Lambda Functions)**

**Core Lambda Functions (Deployed by CDK)**
```bash
✅ knowledge_base_manager.py          # Per-user KB management
✅ rag_presentation_resolver.py       # AI presentation generation  
✅ presentation_resolvers.py          # CRUD operations
✅ s3_vectors_stats_resolver.py       # Real-time S3 vectors stats
✅ user_knowledge_base_resolver.py    # User KB info
✅ document_processor.py              # Document upload & processing
✅ slide_improvement_resolver.py      # AI slide enhancement
✅ bedrock_rag_service.py            # RAG search functionality
✅ rag_query_resolver.py             # RAG query handling
✅ timeout_manager.py                # Timeout management
✅ presentation_api.py               # Presentation API
✅ rag_presentation_generator.py     # Presentation generation
✅ presentation_output.py            # Output formatting
✅ requirements.txt & __init__.py    # Dependencies & package
```


#### **📁 Current File Structure**

```
ai-ppt-generator/
├── frontend/                    # Next.js React application
│   ├── src/main.js             # Enhanced JSON parsing (Job #95)
│   ├── dist/                   # Built application
│   ├── deploy.sh               # Automated Amplify deployment
│   └── package.json            # Frontend dependencies
├── backend/
│   └── lambda_functions/       # 18 production Lambda functions
├── infrastructure/
│   ├── lib/                    # CDK TypeScript definitions
│   ├── schema-serverless.graphql # GraphQL schema
│   └── cdk.out/               # CDK deployment artifacts
├── .kiro/specs/               # Technical specifications
├── README.md                  # This comprehensive documentation
└── .env                       # Environment configuration
```


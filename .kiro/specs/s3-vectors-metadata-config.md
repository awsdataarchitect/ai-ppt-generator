# S3 Vectors Metadata Configuration for Bedrock Knowledge Base Integration

## Critical Finding

**Date**: August 18, 2025  
**Issue**: S3 Vectors indexing failures with Bedrock Knowledge Base  
**Root Cause**: Missing `metadataConfiguration` in S3 Vector index creation  
**Solution**: Add `nonFilterableMetadataKeys: ["AMAZON_BEDROCK_TEXT"]`  

## Problem Description

When using S3 Vectors with Amazon Bedrock Knowledge Base, documents would:
- ✅ Upload to S3 successfully
- ✅ Trigger ingestion jobs successfully  
- ✅ Show ingestion job status as "COMPLETE"
- ❌ Show `numberOfNewDocumentsIndexed: 0` (not actually indexed)
- ❌ Not be retrievable in RAG queries

## Root Cause Analysis

Bedrock Knowledge Base generates large text chunks with metadata that exceeds the S3 Vectors **2KB filterable metadata limit per vector**. Without proper configuration, these chunks are rejected during indexing.

## Solution Implementation

### Before (Incorrect)
```python
s3vectors.create_index(
    vectorBucketName=bucket_name,
    indexName=index_name,
    dataType="float32",
    dimension=1024,
    distanceMetric="cosine"
    # Missing metadataConfiguration
)
```

### After (Correct)
```python
s3vectors.create_index(
    vectorBucketName=bucket_name,
    indexName=index_name,
    dataType="float32",
    dimension=1024,
    distanceMetric="cosine",
    metadataConfiguration={
        "nonFilterableMetadataKeys": ["AMAZON_BEDROCK_TEXT"]  # CRITICAL
    }
)
```

## AWS Documentation References

1. **[Building cost-effective RAG applications with Amazon Bedrock Knowledge Bases and Amazon S3 Vectors](https://aws.amazon.com/blogs/machine-learning/building-cost-effective-rag-applications-with-amazon-bedrock-knowledge-bases-and-amazon-s3-vectors/)**
   - Explicitly mentions this configuration requirement
   - Explains the metadata size limitations

2. **[Introducing Amazon S3 Vectors](https://aws.amazon.com/blogs/aws/introducing-amazon-s3-vectors-first-cloud-storage-with-native-vector-support-at-scale/)**
   - Shows metadata configuration examples
   - Explains filterable vs non-filterable metadata

## Key Quote from AWS Documentation

> "To accommodate larger text chunks and richer metadata while still allowing filtering on other important attributes, add "AMAZON_BEDROCK_TEXT" to the nonFilterableMetadataKeys list in your index configuration. This approach optimizes your storage allocation for document content while preserving filtering capabilities for meaningful attributes like categories or dates."

## Implementation Details

### Metadata Limits
- **Total metadata per vector**: Up to 40 KB
- **Filterable metadata per vector**: Up to 2 KB (CRITICAL LIMIT)
- **Non-filterable metadata**: No size limit within the 40KB total

### What AMAZON_BEDROCK_TEXT Contains
- Large text chunks from document parsing
- Rich content extracted by Nova Pro parsing
- Structured text with formatting and context

### Impact of Configuration
- **With proper config**: Documents index successfully, RAG queries work
- **Without proper config**: Silent indexing failures, no RAG context

## Optimized Configuration

With proper metadata configuration, we can use optimal settings:

```python
# Chunking Strategy
'chunkingConfiguration': {
    'chunkingStrategy': 'FIXED_SIZE',
    'fixedSizeChunkingConfiguration': {
        'maxTokens': 500,  # Optimal with proper metadata config
        'overlapPercentage': 10  # Better context preservation
    }
}

# Parsing Strategy  
'parsingConfiguration': {
    'parsingStrategy': 'BEDROCK_FOUNDATION_MODEL',
    'bedrockFoundationModelConfiguration': {
        'modelArn': 'arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-pro-v1:0',
        'parsingPrompt': {
            'parsingPromptText': 'Extract and preserve the complete text content from this document, maintaining structure, headings, and formatting.'
        }
    }
}
```

## Verification Steps

1. **Check ingestion job statistics**:
   ```bash
   aws bedrock-agent get-ingestion-job --knowledge-base-id <KB_ID> --data-source-id <DS_ID> --ingestion-job-id <JOB_ID>
   ```
   - Look for `numberOfNewDocumentsIndexed > 0`

2. **Test retrieval**:
   ```bash
   aws bedrock-agent-runtime retrieve --knowledge-base-id <KB_ID> --retrieval-query '{"text": "test query"}'
   ```
   - Should return relevant chunks from indexed documents

## Lessons Learned

1. **Always check AWS documentation** for service-specific integration requirements
2. **Metadata configuration cannot be changed** after index creation - must recreate
3. **Silent failures are common** with S3 Vectors metadata limits
4. **Monitor ingestion statistics** not just job status
5. **Test end-to-end** including retrieval, not just ingestion

## Status

- ✅ **Issue Identified**: August 18, 2025
- ✅ **Solution Implemented**: Proper metadata configuration added
- ✅ **Documentation Updated**: README and specs updated
- ✅ **Ready for Testing**: New KB will be created with correct configuration
- ✅ **Production Verified**: All fixes working in production environment
- ✅ **Complete Solution**: Combined with automatic status updates and document deletion fixes

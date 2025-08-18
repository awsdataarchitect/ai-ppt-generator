# Design Document

## Overview

This design document outlines the technical approach for fixing critical system issues in the AI PPT Generator application. The solution focuses on standardizing inconsistent implementations, completing incomplete features, and establishing robust error handling and monitoring systems.

## Architecture

### Current System Issues
- Inconsistent subscription cancellation implementations
- Incomplete Redis RAG vector search
- Mixed timeout configurations
- Missing input validation and error handling
- Inadequate monitoring and documentation

### Design Principles
1. **Consistency**: Standardize implementations across all components
2. **Reliability**: Implement comprehensive error handling and recovery
3. **Observability**: Add monitoring, logging, and alerting capabilities
4. **Maintainability**: Create clear documentation and operational procedures
5. **Performance**: Optimize timeout handling and resource utilization

## Components and Interfaces

### 1. Subscription Management Service

#### Current State
- Two different cancellation implementations in `subscription_api.py` and `subscription_resolvers.py`
- Inconsistent data updates and return formats

#### Design Solution
```typescript
interface SubscriptionCancellationService {
  cancelSubscription(userId: string): Promise<CancellationResult>
  updateSubscriptionStatus(userId: string, status: SubscriptionStatus, metadata: CancellationMetadata): Promise<void>
  syncCognitoAttributes(userId: string, subscriptionData: SubscriptionData): Promise<void>
}

interface CancellationResult {
  success: boolean
  subscription: SubscriptionData
  cognitoUpdated: boolean
  timestamp: string
}

interface CancellationMetadata {
  cancelledAt: string
  updatedAt: string
  reason?: string
}
```

#### Implementation Strategy
- Create shared `SubscriptionService` class
- Use atomic DynamoDB `update_item` operations
- Implement transaction-like behavior with rollback capability
- Standardize error handling and logging

### 2. File Processing Service

#### Current State
- Limited to PDF files despite multi-format claims
- No MIME type validation
- Basic error handling

#### Design Solution
```typescript
interface FileProcessingService {
  validateFileType(file: File): ValidationResult
  convertToBase64(file: File): Promise<Base64Result>
  getFileMetadata(file: File): FileMetadata
  formatFileSize(bytes: number): string
}

interface ValidationResult {
  isValid: boolean
  mimeType: string
  errorMessage?: string
  supportedFormats: string[]
}

interface Base64Result {
  base64Data: string
  mimeType: string
  size: number
  filename: string
}

interface FileMetadata {
  name: string
  size: number
  type: string
  lastModified: number
}
```

#### Supported File Types
- PDF: `application/pdf`
- DOC: `application/msword`
- DOCX: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- TXT: `text/plain`

### 3. Redis RAG Service

#### Current State
- Incomplete vector search implementation
- Missing error handling for embedding generation
- No connection management

#### Design Solution
```python
class RedisRAGService:
    def __init__(self, redis_config: RedisConfig, embedding_config: EmbeddingConfig):
        self.redis_client = self._create_redis_client(redis_config)
        self.embedding_service = self._create_embedding_service(embedding_config)
        self.connection_pool = self._create_connection_pool()
    
    def search_similar_content(self, query: str, top_k: int = 5) -> SearchResult:
        """Complete implementation with error handling"""
        pass
    
    def store_document_chunks(self, document_id: str, chunks: List[DocumentChunk]) -> StorageResult:
        """Store document chunks with vectors"""
        pass
    
    def health_check(self) -> HealthStatus:
        """Check Redis and embedding service health"""
        pass
```

#### Error Handling Strategy
- Retry logic with exponential backoff for Redis connections
- Fallback mechanisms for embedding service failures
- Circuit breaker pattern for external service calls
- Graceful degradation when vector search is unavailable

### 4. Configuration Management Service

#### Current State
- Hardcoded timeout values
- No centralized configuration

#### Design Solution
```typescript
interface ConfigurationService {
  getTimeout(operation: TimeoutOperation): number
  getDatabaseConfig(): DatabaseConfig
  getRedisConfig(): RedisConfig
  getMonitoringConfig(): MonitoringConfig
  validateConfiguration(): ValidationResult
}

enum TimeoutOperation {
  DOCUMENT_PROCESSING = 'document_processing',
  LAMBDA_EXECUTION = 'lambda_execution',
  REDIS_OPERATION = 'redis_operation',
  EMBEDDING_GENERATION = 'embedding_generation'
}

interface TimeoutConfig {
  documentProcessing: number // 25 seconds
  lambdaExecution: number    // 15 minutes
  redisOperation: number     // 5 seconds
  embeddingGeneration: number // 10 seconds
}
```

#### Environment Variables
```bash
# Timeout Configuration
DOCUMENT_PROCESSING_TIMEOUT=25
LAMBDA_EXECUTION_TIMEOUT=900
REDIS_OPERATION_TIMEOUT=5
EMBEDDING_GENERATION_TIMEOUT=10

# Redis Configuration
REDIS_HOST=your-redis-cluster.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=your-password

# Monitoring Configuration
CLOUDWATCH_LOG_GROUP=/aws/lambda/ai-ppt-generator
ALERT_SNS_TOPIC=arn:aws:sns:region:account:alerts
```

## Data Models

### 1. Enhanced Subscription Model
```python
@dataclass
class SubscriptionData:
    userId: str
    stripeSubscriptionId: str
    status: SubscriptionStatus
    plan: str
    createdAt: str
    updatedAt: str
    cancelledAt: Optional[str] = None
    cancellationReason: Optional[str] = None
    cognitoSyncStatus: str = 'PENDING'
```

### 2. File Processing Models
```typescript
interface ProcessedFile {
  id: string
  originalName: string
  mimeType: string
  size: number
  base64Data: string
  processingStatus: ProcessingStatus
  uploadedAt: string
  processedAt?: string
  errorMessage?: string
}

enum ProcessingStatus {
  UPLOADED = 'UPLOADED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}
```

### 3. Redis Vector Models
```python
@dataclass
class DocumentChunk:
    chunk_id: str
    document_id: str
    content: str
    chunk_index: int
    vector: List[float]
    metadata: Dict[str, Any]

@dataclass
class SearchResult:
    chunks: List[DocumentChunk]
    scores: List[float]
    total_results: int
    query_time_ms: int
```

## Error Handling

### 1. Error Classification
```typescript
enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  BUSINESS_LOGIC_ERROR = 'BUSINESS_LOGIC_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR'
}

interface SystemError {
  type: ErrorType
  code: string
  message: string
  details?: any
  timestamp: string
  requestId: string
  userId?: string
}
```

### 2. Error Recovery Strategies
- **Retry with Backoff**: For transient failures (Redis, embedding service)
- **Circuit Breaker**: For external service failures
- **Graceful Degradation**: Partial functionality when components fail
- **Rollback**: For transaction-like operations (subscription updates)

### 3. User-Friendly Error Messages
```typescript
const ERROR_MESSAGES = {
  FILE_TOO_LARGE: 'File size exceeds 5MB limit. Please choose a smaller file.',
  UNSUPPORTED_FORMAT: 'File format not supported. Please use PDF, DOC, DOCX, or TXT files.',
  PROCESSING_TIMEOUT: 'Document processing is taking longer than expected. Please try again.',
  SUBSCRIPTION_ERROR: 'Unable to update subscription. Please contact support if the issue persists.',
  SEARCH_UNAVAILABLE: 'Search is temporarily unavailable. Please try again in a few moments.'
}
```

## Testing Strategy

### 1. Unit Testing
- Test each service component in isolation
- Mock external dependencies (Redis, Stripe, Cognito)
- Validate error handling paths
- Test timeout scenarios

### 2. Integration Testing
- Test service interactions
- Validate data consistency across components
- Test rollback mechanisms
- Verify monitoring and alerting

### 3. End-to-End Testing
- Test complete user workflows
- Validate error recovery scenarios
- Test performance under load
- Verify monitoring dashboards

### 4. Error Scenario Testing
```typescript
describe('Error Handling', () => {
  test('subscription cancellation rollback on Cognito failure')
  test('file processing with unsupported format')
  test('Redis connection failure recovery')
  test('timeout handling with partial progress')
  test('embedding service circuit breaker')
})
```

## Monitoring and Observability

### 1. Health Check Endpoints
```typescript
// GET /health
interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  services: {
    redis: ServiceHealth
    dynamodb: ServiceHealth
    bedrock: ServiceHealth
    cognito: ServiceHealth
  }
  version: string
}

interface ServiceHealth {
  status: 'up' | 'down' | 'degraded'
  responseTime: number
  lastChecked: string
  errorMessage?: string
}
```

### 2. Metrics and Alerts
```yaml
# CloudWatch Metrics
Metrics:
  - SubscriptionCancellationSuccess
  - SubscriptionCancellationFailure
  - FileProcessingDuration
  - RedisConnectionErrors
  - EmbeddingGenerationLatency
  - DocumentProcessingTimeout

# CloudWatch Alarms
Alarms:
  - HighErrorRate: > 5% in 5 minutes
  - SlowResponse: > 10 seconds average
  - RedisConnectionFailures: > 3 in 1 minute
  - SubscriptionSyncFailures: > 1 in 5 minutes
```

### 3. Structured Logging
```python
import structlog

logger = structlog.get_logger()

# Example usage
logger.info(
    "subscription_cancelled",
    user_id=user_id,
    subscription_id=subscription_id,
    duration_ms=processing_time,
    cognito_updated=True
)
```

## Implementation Phases

### Phase 1: Critical Fixes (Week 1)
1. Fix subscription cancellation consistency
2. Complete Redis RAG implementation
3. Implement timeout configuration management

### Phase 2: Enhanced Error Handling (Week 2)
1. Add comprehensive input validation
2. Implement error recovery mechanisms
3. Add user-friendly error messages

### Phase 3: Monitoring and Operations (Week 3)
1. Add health check endpoints
2. Implement monitoring and alerting
3. Create operational documentation

### Phase 4: Testing and Documentation (Week 4)
1. Comprehensive testing suite
2. Performance optimization
3. Complete documentation update
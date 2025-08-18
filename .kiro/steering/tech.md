# Technology Stack & Build System

## Frontend Stack
- **Framework**: Next.js 15.4.5 with React 19.1.0
- **Build System**: Webpack 5 with Babel transpilation
- **Authentication**: AWS Amplify v6 (modern imports, no CDN)
- **Bundling**: Single bundle.js output (~170 KiB production)
- **Polyfills**: crypto-browserify, stream-browserify, buffer, process for browser compatibility

## Backend Stack
- **Runtime**: Python 3.11 on AWS Lambda
- **AI Services**: Amazon Bedrock (Nova Pro + Titan embeddings)
- **Vector Database**: Amazon Bedrock Knowledge Base with S3 Vectors
- **Document Processing**: Bedrock Knowledge Base auto-ingestion with native format support
- **RAG Framework**: AWS-native Bedrock Knowledge Base
- **API**: AWS AppSync GraphQL with Lambda resolvers

## Infrastructure
- **IaC**: AWS CDK with TypeScript
- **Database**: DynamoDB with GSI for user queries
- **Storage**: S3 buckets for documents and presentations
- **Authentication**: AWS Cognito User Pool
- **Hosting**: AWS Amplify with CI/CD

## Key Dependencies

### Frontend
```json
{
  "aws-amplify": "^6.15.4",
  "next": "15.4.5",
  "react": "19.1.0",
  "webpack": "^5.101.0"
}
```

### Backend
```
boto3==1.34.34
stripe==7.8.0
nltk>=3.8.0
```

## Common Commands

### Development
```bash
# Install all dependencies
npm run install:all

# Build frontend
cd frontend && npm run build

# Deploy infrastructure
cd infrastructure && cdk deploy --all

# View logs
npm run logs:lambda
```

### Testing
```bash
# Frontend tests
npm run test:frontend

# Backend tests
cd backend && python -m pytest

# End-to-end test
python test_end_to_end.py
```

### Deployment
```bash
# Complete deployment
npm run deploy

# Frontend only (Amplify)
cd frontend && npm run build
# Then upload to Amplify console

# Infrastructure only
npm run cdk:deploy
```

## Architecture Patterns

### Authentication Flow
- Modern Amplify v6 imports: `import { signIn } from 'aws-amplify/auth'`
- No CDN loading, webpack bundling only
- Session conflict handling for existing users
- Browser polyfills for crypto/stream operations

### RAG Processing
- Document chunking with 1000-character limits
- Vector embeddings via Amazon Titan
- Bedrock Knowledge Base with S3 Vectors storage
- Timeout-resistant processing (25-second limits)

### Error Handling
- Graceful Lambda timeout handling
- Progress tracking with status updates
- Comprehensive logging via CloudWatch
- User-friendly error messages in UI
# Project Structure & Organization

## Root Directory Layout
```
ai-ppt-generator/
├── frontend/           # Next.js/React application
├── backend/           # Python Lambda functions
├── infrastructure/    # AWS CDK TypeScript code
├── .env.*            # Environment configurations
├── package.json      # Workspace root with scripts
└── README.md         # Comprehensive project documentation
```

## Frontend Structure (`frontend/`)
```
frontend/
├── src/
│   ├── amplify-config.js    # Amplify v6 configuration
│   ├── auth.js             # Authentication service
│   ├── main.js             # Main application logic
│   ├── error-handler.js    # Error handling utilities
│   ├── file-processor.js   # Document upload handling
│   └── file-validator.js   # File validation logic
├── dist/
│   └── bundle.js           # Webpack output (~170 KiB)
├── index.html              # Complete RAG dashboard
├── webpack.config.js       # Build configuration
├── package.json           # Frontend dependencies
└── amplify.yml            # Amplify build settings
```

## Backend Structure (`backend/`)
```
backend/
├── lambda_functions/
│   ├── document_processor.py        # PDF/text extraction & chunking
│   ├── bedrock_rag_service.py       # Vector search & RAG core using Bedrock Knowledge Base
│   ├── rag_presentation_generator.py # AI presentation creation
│   ├── rag_presentation_resolver.py # GraphQL RAG resolvers
│   ├── rag_query_resolver.py       # Q&A functionality
│   ├── presentation_resolvers.py   # Standard CRUD operations
│   ├── subscription_resolvers.py   # Stripe integration
│   ├── stripe_webhook.py          # Payment webhooks
│   ├── test_*.py                  # Unit tests for RAG components
│   └── requirements.txt           # Lambda dependencies
└── requirements.txt               # Backend development deps
```

## Infrastructure Structure (`infrastructure/`)
```
infrastructure/
├── lib/
│   └── ai-ppt-complete-stack.ts   # Complete serverless stack
├── bin/
│   └── ai-ppt-generator.ts       # CDK app entry point
├── cdk.out/                      # CDK synthesis output
├── schema-serverless.graphql     # AppSync GraphQL schema
├── cdk.json                      # CDK configuration
├── package.json                  # CDK dependencies
└── tsconfig.json                 # TypeScript configuration
```

## Key File Conventions

### Naming Patterns
- **Lambda Functions**: `snake_case.py` with descriptive names
- **Frontend Modules**: `kebab-case.js` for utilities, `camelCase.js` for services
- **Infrastructure**: `PascalCase` for CDK constructs
- **Tests**: `test_*.py` prefix for Python, `*.test.js` for JavaScript

### Configuration Files
- **Environment**: `.env.*` files for different deployment stages
- **Build**: `webpack.config.js`, `amplify.yml`, `cdk.json`
- **Dependencies**: `package.json` (workspace root + subprojects), `requirements.txt`

### Documentation
- **README.md**: Comprehensive project guide with deployment instructions
- **ISSUES_TO_FIX.md**: Known issues and technical debt
- **Blog posts**: Technical deep-dives and architecture documentation

## Module Organization

### Frontend Modules
- **Authentication**: `auth.js` - Amplify v6 integration
- **File Handling**: `file-processor.js`, `file-validator.js` - Upload pipeline
- **Error Management**: `error-handler.js` - Centralized error handling
- **Main App**: `main.js` - Dashboard logic and UI interactions

### Backend Modules
- **RAG Core**: `bedrock_rag_service.py` - Vector search and document storage using Bedrock Knowledge Base
- **Processing**: `document_processor.py` - Knowledge Base auto-ingestion and document management
- **AI Generation**: `rag_presentation_*.py` - Bedrock Nova Pro integration
- **API Layer**: `*_resolvers.py` - GraphQL resolver functions

### Infrastructure Modules
- **Stack Definition**: `ai-ppt-complete-stack.ts` - All AWS resources
- **Schema**: `schema-serverless.graphql` - API contract
- **Configuration**: CDK context and deployment settings

## Import Patterns

### Frontend Imports
```javascript
// Modern Amplify v6 imports
import { signIn, signUp } from 'aws-amplify/auth';
import { Amplify } from 'aws-amplify';

// Local modules
import './amplify-config.js';
import { AuthService } from './auth.js';
```

### Backend Imports
```python
# AWS services
import boto3
from botocore.config import Config

# AWS Bedrock for RAG
import boto3

# Local modules
from bedrock_rag_service import BedrockRAGService
```

### Infrastructure Imports
```typescript
// AWS CDK
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as appsync from 'aws-cdk-lib/aws-appsync';

// Local constructs
import { AiPptCompleteStack } from '../lib/ai-ppt-complete-stack';
```

## Testing Structure
- **Unit Tests**: Co-located with source files (`test_*.py`, `*.test.js`)
- **Integration Tests**: `test_end_to_end.py` for full system validation
- **Test Data**: Minimal test fixtures, prefer mocking external services
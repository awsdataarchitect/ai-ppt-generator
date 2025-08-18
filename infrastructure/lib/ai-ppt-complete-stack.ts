import * as cdk from 'aws-cdk-lib';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';

import * as path from 'path';
import { Construct } from 'constructs';

export class AiPptCompleteStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 Bucket for assets
    const assetsBucket = new s3.Bucket(this, 'AiPptAssets', {
      bucketName: `ai-ppt-assets-${this.account}-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.POST, s3.HttpMethods.PUT, s3.HttpMethods.DELETE],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    // S3 Bucket for documents (RAG)
    const documentsBucket = new s3.Bucket(this, 'AiPptDocuments', {
      bucketName: `ai-ppt-documents-${this.account}-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.POST, s3.HttpMethods.PUT, s3.HttpMethods.DELETE],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    // Note: S3 vectors buckets will be created dynamically per user
    // This is just for legacy output reference
    const vectorBucketName = `ai-ppt-s3vectors-${this.account.slice(-8)}-${this.region}`;

    // DynamoDB Tables
    const presentationsTable = new dynamodb.Table(this, 'PresentationsTable', {
      tableName: 'ai-ppt-presentations',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Add GSI for user queries
    presentationsTable.addGlobalSecondaryIndex({
      indexName: 'UserIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // Documents Table for Knowledge Base integration
    const documentsTable = new dynamodb.Table(this, 'DocumentsTable', {
      tableName: 'ai-ppt-documents',
      partitionKey: { name: 'document_id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Add GSI for user document queries
    documentsTable.addGlobalSecondaryIndex({
      indexName: 'UserDocumentsIndex',
      partitionKey: { name: 'user_id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'upload_date', type: dynamodb.AttributeType.STRING },
    });

    // Add GSI for sync status queries
    documentsTable.addGlobalSecondaryIndex({
      indexName: 'SyncStatusIndex',
      partitionKey: { name: 'sync_status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'last_updated', type: dynamodb.AttributeType.STRING },
    });

    // Add GSI for Knowledge Base sync job queries
    documentsTable.addGlobalSecondaryIndex({
      indexName: 'SyncJobIndex',
      partitionKey: { name: 'knowledge_base_sync_job_id', type: dynamodb.AttributeType.STRING },
    });

    // Cognito User Pool
    const userPool = new cognito.UserPool(this, 'AiPptUserPool', {
      userPoolName: 'ai-ppt-users',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        givenName: {
          required: false,
          mutable: true,
        },
        familyName: {
          required: false,
          mutable: true,
        },
      },
      customAttributes: {
        subscriptionTier: new cognito.StringAttribute({ mutable: true }),
        stripeCustomerId: new cognito.StringAttribute({ mutable: true }),
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'AiPptUserPoolClient', {
      userPool,
      authFlows: {
        adminUserPassword: true,
        userPassword: true,
        userSrp: true,
      },
      generateSecret: false,
    });

    // IAM Role for Bedrock Knowledge Base with S3 vectors
    const knowledgeBaseRole = new iam.Role(this, 'KnowledgeBaseRole', {
      assumedBy: new iam.ServicePrincipal('bedrock.amazonaws.com'),
      inlinePolicies: {
        S3DocumentsAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:ListBucket',
              ],
              resources: [
                documentsBucket.bucketArn,
                `${documentsBucket.bucketArn}/*`,
              ],
            }),
          ],
        }),
        S3VectorsAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3vectors:CreateVectorBucket',
                's3vectors:DeleteVectorBucket',
                's3vectors:GetVectorBucket',
                's3vectors:ListVectorBuckets',
                's3vectors:PutObject',
                's3vectors:GetObject',
                's3vectors:DeleteObject',
                's3vectors:ListObjects',
                's3vectors:PutBucketPolicy',
                's3vectors:GetBucketPolicy',
                's3vectors:DeleteBucketPolicy',
                // Vector index permissions
                's3vectors:CreateIndex',
                's3vectors:DeleteIndex',
                's3vectors:GetIndex',
                's3vectors:ListIndexes',
                's3vectors:PutVectors',
                's3vectors:QueryVectors',
                's3vectors:GetVectors',
                's3vectors:DeleteVectors',
              ],
              resources: [
                `arn:aws:s3vectors:${this.region}:${this.account}:bucket/ai-ppt-vectors-*`,
                `arn:aws:s3vectors:${this.region}:${this.account}:bucket/ai-ppt-vectors-*/*`,
                `arn:aws:s3vectors:${this.region}:${this.account}:bucket/ai-ppt-vectors-*/index/*`,
              ],
            }),
          ],
        }),
        BedrockAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'bedrock:InvokeModel',
              ],
              resources: [
                'arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0',
                'arn:aws:bedrock:*::foundation-model/amazon.nova-pro-v1:0', // For parsing
              ],
            }),
          ],
        }),
      },
    });

    // ============================================================================
    // USER KNOWLEDGE BASE TRACKING TABLE
    // ============================================================================
    
    const userKnowledgeBasesTable = new dynamodb.Table(this, 'UserKnowledgeBasesTable', {
      tableName: 'ai-ppt-user-knowledge-bases',
      partitionKey: { name: 'user_id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Add GSI for admin queries
    userKnowledgeBasesTable.addGlobalSecondaryIndex({
      indexName: 'StatusIndex',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'created_at', type: dynamodb.AttributeType.STRING },
    });

    // ============================================================================
    // KNOWLEDGE BASE MANAGER LAMBDA
    // ============================================================================
    
    const knowledgeBaseManagerFunction = new lambda.Function(this, 'KnowledgeBaseManagerFunction', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'knowledge_base_manager.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/lambda_functions')),
      timeout: cdk.Duration.minutes(15),
      memorySize: 1024,
      layers: [
        lambda.LayerVersion.fromLayerVersionArn(this, 'KnowledgeBaseManagerBedrockLayer', 
          `arn:aws:lambda:${this.region}:${this.account}:layer:bedrock-layer:1`
        )
      ],
      environment: {
        USER_KB_TABLE_NAME: userKnowledgeBasesTable.tableName,
        AWS_ACCOUNT_ID: this.account,
        KNOWLEDGE_BASE_ROLE_ARN: knowledgeBaseRole.roleArn,
        DOCUMENTS_BUCKET: documentsBucket.bucketName,
        BEDROCK_MODEL_ARN: 'arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-pro-v1:0',
        EMBEDDING_MODEL_ARN: 'arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v2:0',
      },
    });

    // Grant permissions to Knowledge Base Manager
    userKnowledgeBasesTable.grantReadWriteData(knowledgeBaseManagerFunction);
    documentsTable.grantReadWriteData(knowledgeBaseManagerFunction); // Add missing permission
    documentsBucket.grantReadWrite(knowledgeBaseManagerFunction);
    
    // Grant Bedrock permissions
    knowledgeBaseManagerFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock:CreateKnowledgeBase',
        'bedrock:DeleteKnowledgeBase',
        'bedrock:GetKnowledgeBase',
        'bedrock:UpdateKnowledgeBase',
        'bedrock:ListKnowledgeBases',
        'bedrock:CreateDataSource',
        'bedrock:DeleteDataSource',
        'bedrock:GetDataSource',
        'bedrock:UpdateDataSource',
        'bedrock:ListDataSources',
        'bedrock:InvokeModel', // For Nova Pro parsing
        'bedrock:StartIngestionJob', // ADDED: Missing permission for ingestion jobs
        'bedrock:GetIngestionJob',
        'bedrock:ListIngestionJobs',
        'bedrock-agent:CreateKnowledgeBase',
        'bedrock-agent:DeleteKnowledgeBase',
        'bedrock-agent:GetKnowledgeBase',
        'bedrock-agent:UpdateKnowledgeBase',
        'bedrock-agent:ListKnowledgeBases',
        'bedrock-agent:CreateDataSource',
        'bedrock-agent:DeleteDataSource',
        'bedrock-agent:GetDataSource',
        'bedrock-agent:UpdateDataSource',
        'bedrock-agent:StartIngestionJob',
        'bedrock-agent:GetIngestionJob',
        'bedrock-agent:ListIngestionJobs',
      ],
      resources: ['*'],
    }));

    // Grant S3 Vectors permissions
    knowledgeBaseManagerFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3vectors:CreateVectorBucket',
        's3vectors:DeleteVectorBucket',
        's3vectors:GetVectorBucket',
        's3vectors:ListVectorBuckets',
        's3vectors:CreateIndex',
        's3vectors:DeleteIndex',
        's3vectors:GetIndex',
        's3vectors:ListIndexes',
        's3vectors:PutVectors',
        's3vectors:QueryVectors',
        's3vectors:GetVectors',
        's3vectors:DeleteVectors',
      ],
      resources: ['*'],
    }));

    // Grant IAM pass role permission
    knowledgeBaseManagerFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['iam:PassRole'],
      resources: [knowledgeBaseRole.roleArn],
    }));

    // IAM Role for Lambda functions with enhanced permissions for RAG
    const lambdaRole = new iam.Role(this, 'AiPptLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        DynamoDBAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Query',
                'dynamodb:Scan',
              ],
              resources: [
                presentationsTable.tableArn,
                `${presentationsTable.tableArn}/index/*`,
                documentsTable.tableArn,
                `${documentsTable.tableArn}/index/*`,
                userKnowledgeBasesTable.tableArn,
                `${userKnowledgeBasesTable.tableArn}/index/*`,
              ],
            }),
          ],
        }),
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
                's3:ListBucket',
              ],
              resources: [
                assetsBucket.bucketArn,
                `${assetsBucket.bucketArn}/*`,
                documentsBucket.bucketArn,
                `${documentsBucket.bucketArn}/*`,
              ],
            }),
          ],
        }),
        BedrockAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'bedrock:InvokeModel',
                'bedrock:InvokeModelWithResponseStream',
              ],
              resources: [
                'arn:aws:bedrock:*::foundation-model/amazon.nova-pro-v1:0',
                'arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0',
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'bedrock:Retrieve',
                'bedrock:RetrieveAndGenerate',
                'bedrock:StartIngestionJob',
                'bedrock:GetIngestionJob',
                'bedrock:ListIngestionJobs',
              ],
              resources: [
                `arn:aws:bedrock:${this.region}:${this.account}:knowledge-base/*`,
              ],
            }),
          ],
        }),
        LambdaInvokeAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['lambda:InvokeFunction'],
              resources: [knowledgeBaseManagerFunction.functionArn],
            }),
          ],
        }),
      },
    });

    // Environment variables for Lambda functions
    const commonEnvironment = {
      PRESENTATIONS_TABLE_NAME: presentationsTable.tableName,
      DOCUMENTS_TABLE_NAME: documentsTable.tableName,
      USER_KB_TABLE_NAME: userKnowledgeBasesTable.tableName,
      S3_BUCKET_NAME: assetsBucket.bucketName,
      DOCUMENTS_BUCKET_NAME: documentsBucket.bucketName,
      KB_MANAGER_FUNCTION_NAME: knowledgeBaseManagerFunction.functionName,
      BEDROCK_MODEL_ARN: 'arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-pro-v1:0',
      EMBEDDING_MODEL_ARN: 'arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v2:0',
      DEFAULT_CHUNK_SIZE: '500',
      DEFAULT_CHUNK_OVERLAP: '50',
      MAX_CONTEXT_CHUNKS: '5',
      SIMILARITY_THRESHOLD: '0.7',
      // Centralized timeout configuration
      RAG_QUERY_TIMEOUT: '60',                // 1 minute for RAG queries
      PRESENTATION_GENERATION_TIMEOUT: '540', // 9 minutes for presentation generation
      BEDROCK_API_TIMEOUT: '300',             // 5 minutes for Bedrock API calls
      S3_OPERATION_TIMEOUT: '120',            // 2 minutes for S3 operations
      DYNAMODB_OPERATION_TIMEOUT: '30',       // 30 seconds for DynamoDB operations
    };

    // RAG Presentation Resolver Lambda Function
    const ragPresentationFunction = new lambda.Function(this, 'RagPresentationFunction', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'rag_presentation_resolver.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/lambda_functions')),
      role: lambdaRole,
      environment: commonEnvironment,
      timeout: cdk.Duration.minutes(10),
      memorySize: 1024,
    });

    // Original Presentation Resolvers Lambda Function
    const presentationResolversFunction = new lambda.Function(this, 'PresentationResolversFunction', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'presentation_resolvers.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/lambda_functions')),
      role: lambdaRole,
      environment: commonEnvironment,
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
    });

    // S3 Vectors Stats Resolver Lambda Function
    const s3VectorsStatsFunction = new lambda.Function(this, 'S3VectorsStatsFunction', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 's3_vectors_stats_resolver.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/lambda_functions')),
      role: lambdaRole,
      environment: commonEnvironment,
      timeout: cdk.Duration.minutes(2),
      memorySize: 256,
    });

    // User Knowledge Base Resolver Lambda Function
    const userKnowledgeBaseFunction = new lambda.Function(this, 'UserKnowledgeBaseFunction', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'user_knowledge_base_resolver.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/lambda_functions')),
      role: lambdaRole,
      environment: commonEnvironment,
      timeout: cdk.Duration.minutes(2),
      memorySize: 256,
    });

    // AppSync GraphQL API
    const api = new appsync.GraphqlApi(this, 'AiPptApi', {
      name: 'ai-ppt-rag-api',
      schema: appsync.SchemaFile.fromAsset(path.join(__dirname, '../schema-serverless.graphql')),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.USER_POOL,
          userPoolConfig: {
            userPool,
          },
        },
      },
      logConfig: {
        fieldLogLevel: appsync.FieldLogLevel.ALL,
      },
    });

    // S3 Upload Handler Lambda Function (using document processor for upload URLs)
    const s3UploadHandlerFunction = new lambda.Function(this, 'S3UploadHandlerFunction', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'document_processor.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/lambda_functions')),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        DOCUMENTS_BUCKET: documentsBucket.bucketName,
        DOCUMENTS_TABLE_NAME: documentsTable.tableName,
        USER_KB_TABLE_NAME: userKnowledgeBasesTable.tableName,
        KB_MANAGER_FUNCTION_NAME: knowledgeBaseManagerFunction.functionName,
      },
    });

    // Grant S3 permissions to upload handler
    documentsBucket.grantReadWrite(s3UploadHandlerFunction);
    documentsTable.grantReadWriteData(s3UploadHandlerFunction);
    userKnowledgeBasesTable.grantReadWriteData(s3UploadHandlerFunction);
    knowledgeBaseManagerFunction.grantInvoke(s3UploadHandlerFunction);

    // Document Processor V2 Lambda Function (for S3 events)
    const documentProcessorV2Function = new lambda.Function(this, 'DocumentProcessorV2Function', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'document_processor.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/lambda_functions')),
      timeout: cdk.Duration.minutes(15),
      memorySize: 1024,
      environment: {
        DOCUMENTS_BUCKET: documentsBucket.bucketName,
        PRESENTATIONS_TABLE_NAME: presentationsTable.tableName,
        DOCUMENTS_TABLE_NAME: documentsTable.tableName,
        USER_KB_TABLE_NAME: userKnowledgeBasesTable.tableName,
        KB_MANAGER_FUNCTION_NAME: knowledgeBaseManagerFunction.functionName,
        BEDROCK_MODEL_ARN: 'arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-pro-v1:0',
        EMBEDDING_MODEL_ARN: 'arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v2:0',
        // Timeout configuration
        DOCUMENT_PROCESSING_TIMEOUT: '840',  // 14 minutes (Lambda timeout is 15 minutes)
        S3_OPERATION_TIMEOUT: '120',         // 2 minutes
        KNOWLEDGE_BASE_SYNC_TIMEOUT: '600',  // 10 minutes
        BEDROCK_API_TIMEOUT: '300',          // 5 minutes
        DYNAMODB_OPERATION_TIMEOUT: '30',    // 30 seconds
      },
    });

    // Grant permissions to document processor V2
    documentsBucket.grantReadWrite(documentProcessorV2Function);
    presentationsTable.grantReadWriteData(documentProcessorV2Function);
    documentsTable.grantReadWriteData(documentProcessorV2Function);
    userKnowledgeBasesTable.grantReadWriteData(documentProcessorV2Function);
    
    // Grant permission to invoke KB manager
    knowledgeBaseManagerFunction.grantInvoke(documentProcessorV2Function);
    
    // Grant Bedrock permissions for embeddings and Knowledge Base
    documentProcessorV2Function.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock:InvokeModel',
        'bedrock:InvokeModelWithResponseStream',
      ],
      resources: [
        'arn:aws:bedrock:*::foundation-model/amazon.nova-pro-v1:0',
        'arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0',
      ],
    }));

    // Grant Knowledge Base permissions
    documentProcessorV2Function.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock:Retrieve',
        'bedrock:RetrieveAndGenerate',
        'bedrock:StartIngestionJob',
        'bedrock:GetIngestionJob',
        'bedrock:ListIngestionJobs',
        'bedrock:GetKnowledgeBase',  // CRITICAL: Added for KB verification
      ],
      resources: [
        `arn:aws:bedrock:${this.region}:${this.account}:knowledge-base/*`,
      ],
    }));

    // Grant S3 Vectors access
    documentProcessorV2Function.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3vectors:CreateVectorBucket',
        's3vectors:DeleteVectorBucket',
        's3vectors:GetVectorBucket',
        's3vectors:ListVectorBuckets',
        's3vectors:PutObject',
        's3vectors:GetObject',
        's3vectors:DeleteObject',
        's3vectors:ListObjects',
        's3vectors:PutBucketPolicy',
        's3vectors:GetBucketPolicy',
        's3vectors:DeleteBucketPolicy',
        // Vector index permissions
        's3vectors:CreateIndex',
        's3vectors:DeleteIndex',
        's3vectors:GetIndex',
        's3vectors:ListIndexes',
        's3vectors:PutVectors',
        's3vectors:QueryVectors',
        's3vectors:GetVectors',
        's3vectors:DeleteVectors',
      ],
      resources: [
        `arn:aws:s3vectors:${this.region}:${this.account}:bucket/ai-ppt-vectors-*`,
        `arn:aws:s3vectors:${this.region}:${this.account}:bucket/ai-ppt-vectors-*/*`,
        `arn:aws:s3vectors:${this.region}:${this.account}:bucket/ai-ppt-vectors-*/index/*`,
      ],
    }));

    // Data Sources
    const s3UploadHandlerDataSource = api.addLambdaDataSource(
      'S3UploadHandlerDataSource',
      s3UploadHandlerFunction
    );

    const documentProcessorV2DataSource = api.addLambdaDataSource(
      'DocumentProcessorV2DataSource',
      documentProcessorV2Function
    );

    const ragPresentationDataSource = api.addLambdaDataSource(
      'RagPresentationDataSource',
      ragPresentationFunction
    );

    const presentationResolversDataSource = api.addLambdaDataSource(
      'PresentationResolversDataSource',
      presentationResolversFunction
    );

    const s3VectorsStatsDataSource = api.addLambdaDataSource(
      'S3VectorsStatsDataSource',
      s3VectorsStatsFunction
    );

    const userKnowledgeBaseDataSource = api.addLambdaDataSource(
      'UserKnowledgeBaseDataSource',
      userKnowledgeBaseFunction
    );

    // Resolvers for Document Management (RAG)
    api.createResolver('generateUploadUrlResolver', {
      typeName: 'Mutation',
      fieldName: 'generateUploadUrl',
      dataSource: s3UploadHandlerDataSource,
    });

    api.createResolver('processS3DocumentResolver', {
      typeName: 'Mutation',
      fieldName: 'processS3Document',
      dataSource: documentProcessorV2DataSource,
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        {
          "version": "2017-02-28",
          "operation": "Invoke",
          "payload": {
            "operation": "processS3Document",
            "arguments": $util.toJson($context.arguments)
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString(`
        $util.toJson($context.result)
      `),
    });

    api.createResolver('uploadDocumentResolver', {
      typeName: 'Mutation',
      fieldName: 'uploadDocument',
      dataSource: documentProcessorV2DataSource,
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        {
          "version": "2017-02-28",
          "operation": "Invoke",
          "payload": {
            "operation": "uploadDocument",
            "arguments": $util.toJson($context.arguments),
            "identity": $util.toJson($context.identity)
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString(`
        $util.toJson($context.result)
      `),
    });

    api.createResolver('getUserDocumentsResolver', {
      typeName: 'Query',
      fieldName: 'getUserDocuments',
      dataSource: documentProcessorV2DataSource,
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        {
          "version": "2017-02-28",
          "operation": "Invoke",
          "payload": {
            "operation": "getUserDocuments",
            "arguments": $util.toJson($context.arguments),
            "identity": $util.toJson($context.identity)
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString(`
        $util.toJson($context.result)
      `),
    });

    api.createResolver('searchDocumentsResolver', {
      typeName: 'Query',
      fieldName: 'searchDocuments',
      dataSource: documentProcessorV2DataSource,
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        {
          "version": "2017-02-28",
          "operation": "Invoke",
          "payload": {
            "operation": "searchDocuments",
            "arguments": $util.toJson($context.arguments),
            "identity": $util.toJson($context.identity)
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString(`
        $util.toJson($context.result)
      `),
    });

    // S3 Vectors Stats Query Resolver
    api.createResolver('getS3VectorsStatsResolver', {
      typeName: 'Query',
      fieldName: 'getS3VectorsStats',
      dataSource: s3VectorsStatsDataSource,
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        {
          "version": "2017-02-28",
          "operation": "Invoke",
          "payload": {
            "identity": $util.toJson($context.identity)
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString(`
        $util.toJson($context.result)
      `),
    });

    // User Knowledge Base Query Resolver
    api.createResolver('getUserKnowledgeBaseResolver', {
      typeName: 'Query',
      fieldName: 'getUserKnowledgeBase',
      dataSource: userKnowledgeBaseDataSource,
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        {
          "version": "2017-02-28",
          "operation": "Invoke",
          "payload": {
            "identity": $util.toJson($context.identity)
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString(`
        $util.toJson($context.result)
      `),
    });

    api.createResolver('deleteDocumentResolver', {
      typeName: 'Mutation',
      fieldName: 'deleteDocument',
      dataSource: documentProcessorV2DataSource,
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        {
          "version": "2017-02-28",
          "operation": "Invoke",
          "payload": {
            "operation": "deleteDocument",
            "arguments": $util.toJson($context.arguments),
            "identity": $util.toJson($context.identity)
          }
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString(`
        $util.toJson($context.result)
      `),
    });

    // Resolvers for RAG-Enhanced Presentations
    api.createResolver('generatePresentationWithRAGResolver', {
      typeName: 'Mutation',
      fieldName: 'generatePresentationWithRAG',
      dataSource: ragPresentationDataSource,
    });

    // Create slide improvement Lambda function
    const slideImprovementFunction = new lambda.Function(this, 'SlideImprovementFunction', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'slide_improvement_resolver.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/lambda_functions')),
      timeout: cdk.Duration.minutes(5),
      memorySize: 1024,
      environment: {
        PRESENTATIONS_TABLE_NAME: presentationsTable.tableName,
      },
    });

    // Grant permissions to slide improvement function
    presentationsTable.grantReadWriteData(slideImprovementFunction);
    slideImprovementFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock:InvokeModel',
      ],
      resources: [
        'arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-pro-v1:0',
      ],
    }));

    // Create data source for slide improvement
    const slideImprovementDataSource = api.addLambdaDataSource('SlideImprovementDataSource', slideImprovementFunction);

    // Add slide improvement resolver
    api.createResolver('improveSlideWithAIResolver', {
      typeName: 'Mutation',
      fieldName: 'improveSlideWithAI',
      dataSource: slideImprovementDataSource,
    });

    // Resolvers for Standard Presentations
    api.createResolver('listPresentationsResolver', {
      typeName: 'Query',
      fieldName: 'listPresentations',
      dataSource: presentationResolversDataSource,
    });

    api.createResolver('getPresentationResolver', {
      typeName: 'Query',
      fieldName: 'getPresentation',
      dataSource: presentationResolversDataSource,
    });

    api.createResolver('createPresentationResolver', {
      typeName: 'Mutation',
      fieldName: 'createPresentation',
      dataSource: presentationResolversDataSource,
    });

    api.createResolver('updatePresentationResolver', {
      typeName: 'Mutation',
      fieldName: 'updatePresentation',
      dataSource: presentationResolversDataSource,
    });

    api.createResolver('deletePresentationResolver', {
      typeName: 'Mutation',
      fieldName: 'deletePresentation',
      dataSource: presentationResolversDataSource,
    });

    api.createResolver('generatePresentationWithAIResolver', {
      typeName: 'Mutation',
      fieldName: 'generatePresentationWithAI',
      dataSource: presentationResolversDataSource,
    });

    // Outputs
    new cdk.CfnOutput(this, 'GraphQLApiUrl', {
      value: api.graphqlUrl,
      description: 'GraphQL API URL',
    });

    new cdk.CfnOutput(this, 'GraphQLApiId', {
      value: api.apiId,
      description: 'GraphQL API ID',
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });

    new cdk.CfnOutput(this, 'AssetsBucketName', {
      value: assetsBucket.bucketName,
      description: 'S3 Assets Bucket Name',
    });

    new cdk.CfnOutput(this, 'DocumentsBucketName', {
      value: documentsBucket.bucketName,
      description: 'S3 Documents Bucket Name',
    });

    new cdk.CfnOutput(this, 'VectorBucketName', {
      value: vectorBucketName,
      description: 'S3 Vector Bucket Name (legacy - now per-user buckets created dynamically)',
    });

    new cdk.CfnOutput(this, 'VectorBucketArn', {
      value: `arn:aws:s3vectors:${this.region}:${this.account}:bucket/${vectorBucketName}`,
      description: 'S3 Vector Bucket ARN (legacy - now per-user buckets created dynamically)',
    });

    new cdk.CfnOutput(this, 'UserKnowledgeBasesTableName', {
      value: userKnowledgeBasesTable.tableName,
      description: 'User Knowledge Bases Tracking Table Name',
    });

    new cdk.CfnOutput(this, 'KnowledgeBaseManagerFunctionName', {
      value: knowledgeBaseManagerFunction.functionName,
      description: 'Knowledge Base Manager Function Name',
    });

    new cdk.CfnOutput(this, 'PresentationsTableName', {
      value: presentationsTable.tableName,
      description: 'DynamoDB Presentations Table Name',
    });

    new cdk.CfnOutput(this, 'DocumentsTableName', {
      value: documentsTable.tableName,
      description: 'DynamoDB Documents Table Name',
    });

    // Frontend Configuration Output
    new cdk.CfnOutput(this, 'FrontendConfig', {
      value: JSON.stringify({
        region: this.region,
        userPoolId: userPool.userPoolId,
        userPoolWebClientId: userPoolClient.userPoolClientId,
        graphqlEndpoint: api.graphqlUrl,
        documentsBucket: documentsBucket.bucketName,
        architecture: 'per-user-knowledge-bases',
      }),
      description: 'Frontend Configuration JSON',
    });
  }
}

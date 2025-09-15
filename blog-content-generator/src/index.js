/**
 * Blog Content Generator - Main Entry Point
 * Implements Amazon 4Cs framework for technical blog content generation
 */

import { ContentGenerator } from './generators/ContentGenerator.js';
import { ContentStructure } from './core/ContentStructure.js';
import { FourCsFramework } from './core/FourCsFramework.js';
import fs from 'fs/promises';
import path from 'path';

class BlogContentGeneratorCLI {
  constructor() {
    this.contentGenerator = new ContentGenerator();
    this.contentStructure = new ContentStructure();
    this.fourCs = new FourCsFramework();
  }

  /**
   * Main CLI entry point
   */
  async run() {
    try {
      console.log('🚀 Blog Content Generator - Amazon 4Cs Framework');
      console.log('================================================\n');

      // Ensure output directories exist
      await this.ensureDirectories();

      // Generate example content
      await this.generateExampleContent();

      // Display framework information
      this.displayFrameworkInfo();

      console.log('\n✅ Content generation framework setup complete!');
      console.log('\nNext steps:');
      console.log('1. Review generated examples in content/ directory');
      console.log('2. Customize templates in templates/ directory');
      console.log('3. Use ContentGenerator API to create your own content');

    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }

  /**
   * Ensures required directories exist
   */
  async ensureDirectories() {
    const directories = [
      'content',
      'content/examples',
      'templates',
      'templates/custom'
    ];

    for (const dir of directories) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        // Directory might already exist
      }
    }
  }

  /**
   * Generates example content to demonstrate the framework
   */
  async generateExampleContent() {
    console.log('📝 Generating example content...\n');

    // Example 1: Kiro Experience Post
    const kiroExampleData = {
      title: "How I Built a Production AWS-Native RAG System Using Kiro's Spec-Driven Development",
      subtitle: "From Crisis to Solution: Building an AI PPT Generator with S3 Vectors and Bedrock Knowledge Base",
      author: "Developer",
      tags: ["kiro", "aws", "rag", "s3-vectors", "bedrock", "serverless"],
      crisis: {
        description: "Facing the challenge of building a production-ready RAG system with AWS-native services, traditional development approaches seemed overwhelming for such a complex architecture.",
        urgency: "Need for cost-effective vector storage and per-user data isolation in a serverless RAG system",
        constraints: [
          "Complex AWS serverless architecture requirements",
          "S3 Vectors preview service with limited documentation", 
          "Per-user Knowledge Base isolation needs",
          "Cost optimization requirements (90% savings vs OpenSearch)",
          "Production-ready authentication and UI/UX"
        ]
      },
      discovery: {
        narrative: "That's when I discovered Kiro's spec-driven development approach. Instead of diving into complex AWS documentation, I started by creating detailed specifications for the RAG system.",
        keyMoment: "The moment Kiro generated complete CDK infrastructure for S3 Vectors and Bedrock Knowledge Base integration was a game-changer.",
        reasons: [
          "Spec-driven approach handled complex AWS service integration",
          "AI-powered CDK code generation for cutting-edge services",
          "Built-in AWS best practices and security patterns",
          "Automated hooks for infrastructure validation and deployment"
        ]
      },
      implementation: {
        approach: "Using Kiro's spec-to-code workflow, I broke down the complex AWS RAG system into manageable specifications and let Kiro handle the intricate implementation details.",
        steps: [
          {
            title: "AWS-Native RAG Architecture Specification",
            description: "Created detailed requirements using Kiro's spec framework, defining the serverless RAG system with S3 Vectors and per-user Knowledge Bases.",
            codeExample: {
              code: `# Requirements Document

## User Story
As a user, I want to upload documents and generate AI-powered presentations, so that I can create professional content from my knowledge base.

## Acceptance Criteria
1. WHEN uploading documents THEN they SHALL be processed by user-specific Bedrock Knowledge Base
2. WHEN generating presentations THEN the system SHALL use S3 Vectors for cost-effective retrieval
3. WHEN users access the system THEN they SHALL have complete data isolation through per-user KBs
4. WHEN querying documents THEN response times SHALL be under 10 seconds with 90% cost savings`,
              language: "markdown",
              description: "AWS RAG system requirements specification created with Kiro"
            },
            learnings: [
              "Detailed AWS service specs prevent integration issues",
              "Kiro's AWS expertise shows in generated CDK code",
              "Clear acceptance criteria guide complex serverless architecture"
            ]
          },
          {
            title: "S3 Vectors and Bedrock Knowledge Base Integration",
            description: "Kiro generated the complex CDK infrastructure for S3 Vectors integration with Bedrock Knowledge Base, including per-user isolation.",
            codeExample: {
              code: `// Generated CDK stack for AWS-native RAG system
export class AiPptCompleteStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Knowledge Base Manager with S3 Vectors support
    const knowledgeBaseManager = new Function(this, 'KnowledgeBaseManager', {
      runtime: Runtime.PYTHON_3_11,
      handler: 'knowledge_base_manager.handler',
      code: Code.fromAsset('lambda'),
      layers: [LayerVersion.fromLayerVersionArn(this, 'BedrockLayer', 
        'arn:aws:lambda:us-east-1:283023040015:layer:bedrock-layer:1')]
    });

    // RAG service with Bedrock integration
    const ragService = new Function(this, 'BedrockRAGService', {
      runtime: Runtime.PYTHON_3_11,
      handler: 'bedrock_rag_service.handler',
      code: Code.fromAsset('lambda'),
    });
  }
}`,
              language: "typescript",
              description: "CDK infrastructure for S3 Vectors RAG system generated by Kiro"
            },
            learnings: [
              "S3 Vectors integration requires specific CDK patterns",
              "Kiro's knowledge of preview AWS services is impressive",
              "Per-user Knowledge Base architecture ensures data isolation"
            ]
          }
        ]
      },
      results: {
        summary: "Delivered a production-ready AWS-native RAG system with S3 Vectors, achieving 90% cost savings and perfect user isolation.",
        metrics: [
          { label: "Cost Savings", value: "90% vs OpenSearch Serverless" },
          { label: "Authentication Speed", value: "< 2 seconds" },
          { label: "System Uptime", value: "99.9%" },
          { label: "User Isolation", value: "100% (per-user Knowledge Bases)" }
        ],
        demoLink: "https://main.d2ashs0ytllqag.amplifyapp.com",
        repositoryLink: "https://github.com/example/ai-ppt-generator"
      },
      lessonsLearned: [
        {
          title: "Spec-Driven Development Handles Complex AWS Architecture",
          description: "Starting with detailed specifications for AWS services integration led to better architecture and seamless service connectivity.",
          actionable: "Always create comprehensive AWS service specs before coding, especially for preview services like S3 Vectors."
        },
        {
          title: "Kiro Excels at Cutting-Edge AWS Service Integration",
          description: "Kiro's ability to generate production-ready CDK code for preview services like S3 Vectors saved weeks of research and implementation.",
          actionable: "Leverage Kiro for complex AWS integrations and focus human effort on business logic and user experience."
        }
      ],
      conclusion: {
        reflection: "This project demonstrated how AI-powered development tools like Kiro can transform complex AWS serverless development, enabling rapid delivery of cutting-edge RAG systems without sacrificing quality or best practices.",
        futureWork: [
          "Implement $1-per-presentation monetization framework",
          "Add support for multi-modal document processing",
          "Expand to multi-account architecture for >100 users"
        ],
        callToAction: "Ready to transform your AWS development process? Try Kiro's spec-driven approach on your next serverless project and experience the difference AI-powered development can make for complex cloud architectures.",
        resources: [
          {
            title: "Kiro Documentation",
            url: "https://kiro.dev/docs",
            description: "Complete guide to spec-driven development"
          },
          {
            title: "AWS Serverless Patterns",
            url: "https://serverlessland.com/patterns",
            description: "Proven serverless architecture patterns"
          }
        ]
      },
      authorLinkedIn: "https://linkedin.com/in/developer",
      authorGitHub: "https://github.com/developer"
    };

    const kiroResult = await this.contentGenerator.generateKiroExperiencePost(kiroExampleData);
    
    if (kiroResult.success) {
      await fs.writeFile('content/examples/kiro-experience-example.md', kiroResult.content.markdown);
      console.log('✅ Generated: Kiro Experience Example');
    }

    // Example 2: Technical Journey Post
    const technicalExampleData = {
      title: "Building a Serverless RAG System with AWS Bedrock",
      subtitle: "Architecture decisions, implementation challenges, and lessons learned",
      author: "Developer",
      tags: ["aws", "serverless", "rag", "bedrock", "lambda"],
      difficulty: "advanced",
      overview: {
        description: "A deep dive into building a production-ready Retrieval-Augmented Generation (RAG) system using AWS serverless technologies.",
        features: [
          "Document ingestion and processing pipeline",
          "Vector embeddings with Amazon Bedrock",
          "Real-time query processing",
          "Scalable serverless architecture"
        ]
      },
      techStack: [
        { category: "Backend", technologies: "Python, AWS Lambda, DynamoDB" },
        { category: "AI/ML", technologies: "Amazon Bedrock, Titan Embeddings" },
        { category: "Infrastructure", technologies: "AWS CDK, CloudFormation" },
        { category: "Frontend", technologies: "React, Next.js, Amplify" }
      ],
      requirements: {
        description: "The system needed to handle document processing, generate embeddings, and provide fast query responses while maintaining cost efficiency.",
        functional: [
          "Process documents in multiple formats (PDF, DOCX, TXT)",
          "Generate vector embeddings for semantic search",
          "Provide sub-second query response times",
          "Support concurrent users and document uploads"
        ],
        nonFunctional: [
          "99.9% availability",
          "Cost-effective scaling",
          "Secure document handling",
          "Monitoring and observability"
        ],
        constraints: [
          "Serverless-only architecture",
          "AWS-native services preferred",
          "Budget limitations for AI model usage"
        ]
      },
      architectureDecisions: [
        {
          title: "Serverless Architecture Choice",
          description: "Chose AWS Lambda and serverless services for automatic scaling and cost optimization.",
          alternatives: ["Container-based deployment", "Traditional server architecture"],
          rationale: "Serverless provides automatic scaling, pay-per-use pricing, and reduced operational overhead.",
          tradeoffs: ["Cold start latency", "Execution time limits", "Vendor lock-in"]
        }
      ],
      implementation: [
        {
          title: "Document Processing Pipeline",
          description: "Implemented asynchronous document processing using Lambda and S3 events.",
          codeExample: {
            code: `import boto3
import json
from typing import Dict, List

class DocumentProcessor:
    def __init__(self):
        self.s3 = boto3.client('s3')
        self.bedrock = boto3.client('bedrock-runtime')
    
    def process_document(self, bucket: str, key: str) -> Dict:
        """Process uploaded document and generate embeddings"""
        try:
            # Extract text from document
            text_content = self.extract_text(bucket, key)
            
            # Chunk text for processing
            chunks = self.chunk_text(text_content)
            
            # Generate embeddings
            embeddings = []
            for chunk in chunks:
                embedding = self.generate_embedding(chunk)
                embeddings.append({
                    'text': chunk,
                    'embedding': embedding,
                    'metadata': {'source': key}
                })
            
            return {'status': 'success', 'embeddings': embeddings}
            
        except Exception as e:
            return {'status': 'error', 'message': str(e)}`,
            language: "python",
            description: "Core document processing logic with error handling"
          },
          keyPoints: [
            "Asynchronous processing prevents timeout issues",
            "Chunking strategy optimizes embedding quality",
            "Error handling ensures robust operation"
          ]
        }
      ],
      challenges: [
        {
          title: "Lambda Cold Start Optimization",
          problem: "Initial Lambda invocations had high latency due to cold starts, affecting user experience.",
          solution: "Implemented connection pooling, provisioned concurrency for critical functions, and optimized import statements.",
          codeExample: {
            code: `# Optimized Lambda handler
import json
import boto3

# Initialize clients outside handler for reuse
bedrock_client = boto3.client('bedrock-runtime')
dynamodb = boto3.resource('dynamodb')

def lambda_handler(event, context):
    """Optimized handler with connection reuse"""
    try:
        # Process request using pre-initialized clients
        result = process_query(event['query'])
        return {
            'statusCode': 200,
            'body': json.dumps(result)
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }`,
            language: "python",
            description: "Optimized Lambda handler reducing cold start impact"
          },
          lessons: "Connection reuse and provisioned concurrency significantly improve performance for user-facing functions."
        }
      ],
      testing: {
        approach: "Implemented comprehensive testing strategy including unit tests, integration tests, and load testing.",
        strategies: [
          { type: "Unit Tests", description: "Test individual functions with mocked dependencies" },
          { type: "Integration Tests", description: "Test end-to-end workflows with real AWS services" },
          { type: "Load Tests", description: "Validate performance under concurrent load" }
        ],
        codeExample: {
          code: `import pytest
from moto import mock_s3, mock_dynamodb
from document_processor import DocumentProcessor

@mock_s3
@mock_dynamodb
def test_document_processing():
    """Test document processing with mocked AWS services"""
    # Setup
    processor = DocumentProcessor()
    
    # Create mock S3 bucket and upload test document
    s3 = boto3.client('s3')
    s3.create_bucket(Bucket='test-bucket')
    s3.put_object(Bucket='test-bucket', Key='test.txt', Body='Test content')
    
    # Test processing
    result = processor.process_document('test-bucket', 'test.txt')
    
    # Assertions
    assert result['status'] == 'success'
    assert len(result['embeddings']) > 0
    assert 'Test content' in result['embeddings'][0]['text']`,
          language: "python",
          description: "Example unit test with mocked AWS services"
        }
      },
      deployment: {
        description: "Deployed using AWS CDK with automated CI/CD pipeline and comprehensive monitoring.",
        metrics: [
          { metric: "Average Response Time", value: "245ms", improvement: "60% faster than initial version" },
          { metric: "Cost per Query", value: "$0.003", improvement: "40% reduction" },
          { metric: "Availability", value: "99.95%", improvement: "Exceeded SLA target" }
        ],
        demoLink: "https://rag-demo.example.com"
      },
      reflection: {
        summary: "Building a serverless RAG system taught valuable lessons about AWS AI services, performance optimization, and cost management.",
        successes: [
          "Achieved sub-second query response times",
          "Implemented cost-effective scaling",
          "Created maintainable, testable codebase",
          "Exceeded performance requirements"
        ],
        improvements: [
          "Earlier performance testing would have identified bottlenecks sooner",
          "More comprehensive monitoring from day one",
          "Better documentation of architecture decisions"
        ],
        futureWork: [
          "Implement semantic caching for common queries",
          "Add support for multimodal documents",
          "Explore fine-tuning custom models"
        ]
      },
      repositoryLink: "https://github.com/example/serverless-rag",
      demoLink: "https://rag-demo.example.com",
      authorLinkedIn: "https://linkedin.com/in/developer"
    };

    const technicalResult = await this.contentGenerator.generateBlogPost(technicalExampleData, { template: 'technical-journey' });
    
    if (technicalResult.success) {
      await fs.writeFile('content/examples/technical-journey-example.md', technicalResult.content.markdown);
      console.log('✅ Generated: Technical Journey Example');
    }

    // Generate content outline examples
    const outlineExamples = {
      'crisis-to-solution': this.contentGenerator.generateContentOutline('crisis-solution', {
        targetAudience: ['developers', 'technical-leads'],
        difficulty: 'intermediate',
        tags: ['development', 'problem-solving', 'architecture']
      }),
      'technical-deep-dive': this.contentGenerator.generateContentOutline('technical-deep-dive', {
        targetAudience: ['senior-developers', 'architects'],
        difficulty: 'advanced',
        tags: ['architecture', 'performance', 'scalability']
      }),
      'tutorial': this.contentGenerator.generateContentOutline('tutorial', {
        targetAudience: ['developers', 'beginners'],
        difficulty: 'beginner',
        tags: ['tutorial', 'step-by-step', 'learning']
      })
    };

    await fs.writeFile('content/examples/content-outlines.json', JSON.stringify(outlineExamples, null, 2));
    console.log('✅ Generated: Content Outline Examples');
  }

  /**
   * Displays information about the 4Cs framework
   */
  displayFrameworkInfo() {
    console.log('\n📋 Amazon 4Cs Framework Implementation');
    console.log('=====================================\n');

    Object.entries(this.fourCs.principles).forEach(([key, principle]) => {
      console.log(`${principle.name}: ${principle.description}`);
      principle.guidelines.forEach(guideline => {
        console.log(`  • ${guideline}`);
      });
      console.log('');
    });

    console.log('📊 Content Structure Patterns Available:');
    Object.entries(this.contentStructure.storyArcPatterns).forEach(([key, pattern]) => {
      console.log(`  • ${pattern.name}: ${pattern.description}`);
    });
  }
}

// Run CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = new BlogContentGeneratorCLI();
  cli.run().catch(console.error);
}

export { BlogContentGeneratorCLI, ContentGenerator, ContentStructure, FourCsFramework };
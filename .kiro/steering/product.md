# AI PPT Generator - Product Overview

## Product Description
Enterprise AI-powered presentation generator with complete serverless AWS architecture. The system combines document upload, RAG (Retrieval-Augmented Generation) processing, and AI-powered presentation creation into a unified SaaS platform.

## Core Features
- **Document Upload & Processing**: Drag & drop interface with automatic format detection and processing via Bedrock Knowledge Base
- **RAG Integration**: AWS-native Bedrock Knowledge Base with S3 Vectors for semantic search
- **AI Generation**: Context-aware presentations using Amazon Bedrock Nova Pro
- **Authentication**: AWS Cognito with modern Amplify v6 integration
- **Export Formats**: HTML, Reveal.js, and Marp presentation outputs
- **Subscription Management**: Stripe integration for Professional/Enterprise tiers

## Architecture Philosophy
- **Serverless-First**: Complete AWS serverless stack (Lambda, DynamoDB, S3, AppSync)
- **RAG-Enhanced**: Document context improves AI generation quality
- **Timeout-Resistant**: 25-second processing limits with graceful error handling
- **Production-Ready**: Real authentication, payment processing, and monitoring

## Target Users
- Business professionals creating data-driven presentations
- Educators generating content from research documents
- Enterprise teams requiring document-based presentation workflows

## Key Success Metrics
- Document processing success rate (target: >95%)
- Authentication flow completion (target: <2 seconds)
- Presentation generation time (target: <30 seconds)
- User retention and subscription conversion
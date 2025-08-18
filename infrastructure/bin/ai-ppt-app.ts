#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AiPptCompleteStack } from '../lib/ai-ppt-complete-stack';

const app = new cdk.App();

new AiPptCompleteStack(app, 'AiPptCompleteStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || '123456789012',
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'Complete serverless AI PPT Generator with Stripe subscriptions, Bedrock Nova Pro, and Strands agents',
  tags: {
    Project: 'AI-PPT-Generator',
    Environment: 'Production',
    Architecture: 'Serverless',
    AI: 'Bedrock-Nova-Pro',
    Payments: 'Stripe',
    Frontend: 'Amplify',
  },
});

app.synth();

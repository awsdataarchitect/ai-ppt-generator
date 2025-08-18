#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
require("source-map-support/register");
const cdk = __importStar(require("aws-cdk-lib"));
const ai_ppt_complete_stack_1 = require("../lib/ai-ppt-complete-stack");
const app = new cdk.App();
new ai_ppt_complete_stack_1.AiPptCompleteStack(app, 'AiPptCompleteStackV2', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWktcHB0LWdlbmVyYXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImFpLXBwdC1nZW5lcmF0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSx1Q0FBcUM7QUFDckMsaURBQW1DO0FBQ25DLHdFQUFrRTtBQUVsRSxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUUxQixJQUFJLDBDQUFrQixDQUFDLEdBQUcsRUFBRSxzQkFBc0IsRUFBRTtJQUNsRCxHQUFHLEVBQUU7UUFDSCxPQUFPLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUI7UUFDeEMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLElBQUksV0FBVztLQUN0RDtJQUNELFdBQVcsRUFBRSxzR0FBc0c7SUFDbkgsSUFBSSxFQUFFO1FBQ0osT0FBTyxFQUFFLGtCQUFrQjtRQUMzQixXQUFXLEVBQUUsWUFBWTtRQUN6QixZQUFZLEVBQUUsWUFBWTtRQUMxQixFQUFFLEVBQUUsa0JBQWtCO1FBQ3RCLFFBQVEsRUFBRSxRQUFRO1FBQ2xCLFFBQVEsRUFBRSxTQUFTO0tBQ3BCO0NBQ0YsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuaW1wb3J0ICdzb3VyY2UtbWFwLXN1cHBvcnQvcmVnaXN0ZXInO1xuaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IEFpUHB0Q29tcGxldGVTdGFjayB9IGZyb20gJy4uL2xpYi9haS1wcHQtY29tcGxldGUtc3RhY2snO1xuXG5jb25zdCBhcHAgPSBuZXcgY2RrLkFwcCgpO1xuXG5uZXcgQWlQcHRDb21wbGV0ZVN0YWNrKGFwcCwgJ0FpUHB0Q29tcGxldGVTdGFja1YyJywge1xuICBlbnY6IHtcbiAgICBhY2NvdW50OiBwcm9jZXNzLmVudi5DREtfREVGQVVMVF9BQ0NPVU5ULFxuICAgIHJlZ2lvbjogcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfUkVHSU9OIHx8ICd1cy1lYXN0LTEnLFxuICB9LFxuICBkZXNjcmlwdGlvbjogJ0NvbXBsZXRlIHNlcnZlcmxlc3MgQUkgUFBUIEdlbmVyYXRvciB3aXRoIFN0cmlwZSBzdWJzY3JpcHRpb25zLCBCZWRyb2NrIE5vdmEgUHJvLCBhbmQgU3RyYW5kcyBhZ2VudHMnLFxuICB0YWdzOiB7XG4gICAgUHJvamVjdDogJ0FJLVBQVC1HZW5lcmF0b3InLFxuICAgIEVudmlyb25tZW50OiAnUHJvZHVjdGlvbicsXG4gICAgQXJjaGl0ZWN0dXJlOiAnU2VydmVybGVzcycsXG4gICAgQUk6ICdCZWRyb2NrLU5vdmEtUHJvJyxcbiAgICBQYXltZW50czogJ1N0cmlwZScsXG4gICAgRnJvbnRlbmQ6ICdBbXBsaWZ5JyxcbiAgfSxcbn0pO1xuIl19
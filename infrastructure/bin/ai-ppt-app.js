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
new ai_ppt_complete_stack_1.AiPptCompleteStack(app, 'AiPptCompleteStack', {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWktcHB0LWFwcC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImFpLXBwdC1hcHAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSx1Q0FBcUM7QUFDckMsaURBQW1DO0FBQ25DLHdFQUFrRTtBQUVsRSxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUUxQixJQUFJLDBDQUFrQixDQUFDLEdBQUcsRUFBRSxvQkFBb0IsRUFBRTtJQUNoRCxHQUFHLEVBQUU7UUFDSCxPQUFPLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsSUFBSSxjQUFjO1FBQzFELE1BQU0sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixJQUFJLFdBQVc7S0FDdEQ7SUFDRCxXQUFXLEVBQUUsc0dBQXNHO0lBQ25ILElBQUksRUFBRTtRQUNKLE9BQU8sRUFBRSxrQkFBa0I7UUFDM0IsV0FBVyxFQUFFLFlBQVk7UUFDekIsWUFBWSxFQUFFLFlBQVk7UUFDMUIsRUFBRSxFQUFFLGtCQUFrQjtRQUN0QixRQUFRLEVBQUUsUUFBUTtRQUNsQixRQUFRLEVBQUUsU0FBUztLQUNwQjtDQUNGLENBQUMsQ0FBQztBQUVILEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcbmltcG9ydCAnc291cmNlLW1hcC1zdXBwb3J0L3JlZ2lzdGVyJztcbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBBaVBwdENvbXBsZXRlU3RhY2sgfSBmcm9tICcuLi9saWIvYWktcHB0LWNvbXBsZXRlLXN0YWNrJztcblxuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcblxubmV3IEFpUHB0Q29tcGxldGVTdGFjayhhcHAsICdBaVBwdENvbXBsZXRlU3RhY2snLCB7XG4gIGVudjoge1xuICAgIGFjY291bnQ6IHByb2Nlc3MuZW52LkNES19ERUZBVUxUX0FDQ09VTlQgfHwgJzEyMzQ1Njc4OTAxMicsXG4gICAgcmVnaW9uOiBwcm9jZXNzLmVudi5DREtfREVGQVVMVF9SRUdJT04gfHwgJ3VzLWVhc3QtMScsXG4gIH0sXG4gIGRlc2NyaXB0aW9uOiAnQ29tcGxldGUgc2VydmVybGVzcyBBSSBQUFQgR2VuZXJhdG9yIHdpdGggU3RyaXBlIHN1YnNjcmlwdGlvbnMsIEJlZHJvY2sgTm92YSBQcm8sIGFuZCBTdHJhbmRzIGFnZW50cycsXG4gIHRhZ3M6IHtcbiAgICBQcm9qZWN0OiAnQUktUFBULUdlbmVyYXRvcicsXG4gICAgRW52aXJvbm1lbnQ6ICdQcm9kdWN0aW9uJyxcbiAgICBBcmNoaXRlY3R1cmU6ICdTZXJ2ZXJsZXNzJyxcbiAgICBBSTogJ0JlZHJvY2stTm92YS1Qcm8nLFxuICAgIFBheW1lbnRzOiAnU3RyaXBlJyxcbiAgICBGcm9udGVuZDogJ0FtcGxpZnknLFxuICB9LFxufSk7XG5cbmFwcC5zeW50aCgpO1xuIl19
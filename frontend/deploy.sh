#!/bin/bash

# Amplify Deployment Script for AI PPT Generator
# This script builds the frontend securely and deploys it programmatically

set -e

REGION="us-east-1"
APP_NAME="ai-ppt-generator"
BRANCH_NAME="main"

echo "🚀 AI PPT Generator - Amplify Deployment"
echo "========================================"
echo "🌍 Region: $REGION"
echo "📱 App Name: $APP_NAME"
echo "🌿 Branch: $BRANCH_NAME"
echo ""

# Step 1: Build frontend securely
echo "🔧 Step 1: Building frontend with secure configuration..."
./build.sh

if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi

# Step 2: Discover Amplify app dynamically
echo ""
echo "🔍 Step 2: Discovering Amplify app..."

APP_ID=$(aws amplify list-apps --region $REGION --query "apps[?name=='$APP_NAME'].appId" --output text)

if [ -z "$APP_ID" ] || [ "$APP_ID" = "None" ]; then
    echo "❌ Amplify app '$APP_NAME' not found in region $REGION"
    echo "💡 Available apps:"
    aws amplify list-apps --region $REGION --query "apps[].{Name:name,AppId:appId}" --output table
    exit 1
fi

echo "✅ Found Amplify app: $APP_ID"

# Step 3: Verify branch exists
echo ""
echo "🌿 Step 3: Verifying branch exists..."

BRANCH_EXISTS=$(aws amplify list-branches --app-id $APP_ID --region $REGION --query "branches[?branchName=='$BRANCH_NAME'].branchName" --output text)

if [ -z "$BRANCH_EXISTS" ] || [ "$BRANCH_EXISTS" = "None" ]; then
    echo "❌ Branch '$BRANCH_NAME' not found for app $APP_ID"
    echo "💡 Available branches:"
    aws amplify list-branches --app-id $APP_ID --region $REGION --query "branches[].{BranchName:branchName,Stage:stage}" --output table
    exit 1
fi

echo "✅ Branch '$BRANCH_NAME' exists"

# Step 4: Create deployment package
echo ""
echo "📦 Step 4: Creating deployment package..."

# Create zip file from dist directory
cd dist
zip -r ../deployment.zip . > /dev/null
cd ..

if [ ! -f "deployment.zip" ]; then
    echo "❌ Failed to create deployment package"
    exit 1
fi

echo "✅ Deployment package created: deployment.zip"

# Step 5: Create deployment
echo ""
echo "🚀 Step 5: Creating Amplify deployment..."

DEPLOYMENT_RESPONSE=$(aws amplify create-deployment \
    --app-id $APP_ID \
    --branch-name $BRANCH_NAME \
    --region $REGION \
    --output json)

if [ $? -ne 0 ]; then
    echo "❌ Failed to create Amplify deployment!"
    exit 1
fi

JOB_ID=$(echo $DEPLOYMENT_RESPONSE | jq -r '.jobId')
UPLOAD_URL=$(echo $DEPLOYMENT_RESPONSE | jq -r '.zipUploadUrl')

echo "✅ Deployment created successfully!"
echo "🆔 Job ID: $JOB_ID"

# Step 6: Upload deployment package
echo ""
echo "☁️  Step 6: Uploading deployment package..."

curl -X PUT -T deployment.zip "$UPLOAD_URL" --silent --show-error

if [ $? -ne 0 ]; then
    echo "❌ Failed to upload deployment package!"
    exit 1
fi

echo "✅ Deployment package uploaded successfully"

# Step 7: Start deployment
echo ""
echo "▶️  Step 7: Starting deployment..."

aws amplify start-deployment \
    --app-id $APP_ID \
    --branch-name $BRANCH_NAME \
    --job-id $JOB_ID \
    --region $REGION > /dev/null

if [ $? -ne 0 ]; then
    echo "❌ Failed to start deployment!"
    exit 1
fi

echo "✅ Deployment started successfully!"

# Step 8: Monitor deployment status
echo ""
echo "⏳ Step 8: Monitoring deployment status..."

TIMEOUT=300  # 5 minutes timeout
ELAPSED=0
POLL_INTERVAL=15

while [ $ELAPSED -lt $TIMEOUT ]; do
    STATUS=$(aws amplify get-job \
        --app-id $APP_ID \
        --branch-name $BRANCH_NAME \
        --job-id $JOB_ID \
        --region $REGION \
        --query 'job.summary.status' \
        --output text)
    
    echo "📊 Current status: $STATUS (${ELAPSED}s elapsed)"
    
    case $STATUS in
        "SUCCEED")
            echo ""
            echo "🎉 Deployment completed successfully!"
            break
            ;;
        "FAILED"|"CANCELLED")
            echo ""
            echo "❌ Deployment failed with status: $STATUS"
            echo "🔍 Check the Amplify Console for details:"
            echo "   https://console.aws.amazon.com/amplify/home?region=$REGION#/$APP_ID"
            exit 1
            ;;
        "PENDING"|"PROVISIONING"|"RUNNING")
            sleep $POLL_INTERVAL
            ELAPSED=$((ELAPSED + POLL_INTERVAL))
            ;;
        *)
            echo "❓ Unknown status: $STATUS"
            sleep $POLL_INTERVAL
            ELAPSED=$((ELAPSED + POLL_INTERVAL))
            ;;
    esac
done

if [ $ELAPSED -ge $TIMEOUT ]; then
    echo ""
    echo "⏰ Deployment monitoring timed out after ${TIMEOUT}s"
    echo "🔍 Check the Amplify Console for current status:"
    echo "   https://console.aws.amazon.com/amplify/home?region=$REGION#/$APP_ID"
fi

# Step 9: Get live URL dynamically
echo ""
echo "🌐 Step 9: Getting live URL..."

LIVE_URL=$(aws amplify get-app --app-id $APP_ID --region $REGION --query 'app.defaultDomain' --output text)

if [ -n "$LIVE_URL" ] && [ "$LIVE_URL" != "None" ]; then
    FULL_URL="https://$BRANCH_NAME.$LIVE_URL"
    echo "✅ Live URL: $FULL_URL"
else
    echo "⚠️  Could not determine live URL automatically"
fi

# Cleanup
rm -f deployment.zip
echo "🧹 Cleaned up deployment files"

# Step 10: Summary and verification
echo ""
echo "🎯 Deployment Summary:"
echo "======================================"
echo "   App Name: $APP_NAME"
echo "   App ID: $APP_ID"
echo "   Branch: $BRANCH_NAME"
echo "   Job ID: $JOB_ID"
echo "   Region: $REGION"
if [ -n "$FULL_URL" ]; then
    echo "   Live URL: $FULL_URL"
fi
echo "   Console: https://console.aws.amazon.com/amplify/home?region=$REGION#/$APP_ID"
echo ""
echo "🔍 Verification Steps:"
echo "1. Visit the live URL above"
echo "2. Try to sign in with your credentials"
echo "3. Verify authentication works correctly"
echo ""
echo "✅ Deployment script completed successfully!"

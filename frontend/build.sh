#!/bin/bash

# Build script that sources environment variables from parent .env file
# This ensures consistency and security by using only the main .env file

set -e

echo "🔧 Building frontend with environment variables from .env file..."

# Source environment variables from parent .env file
if [ -f "../.env" ]; then
    echo "📄 Loading environment variables from ../.env"
    
    # Export all NEXT_PUBLIC_ variables for webpack
    while IFS= read -r line; do
        # Skip comments and empty lines
        if [[ $line =~ ^[[:space:]]*# ]] || [[ -z "$line" ]]; then
            continue
        fi
        
        # Only export NEXT_PUBLIC_ variables
        if [[ $line =~ ^NEXT_PUBLIC_ ]]; then
            export "$line"
            echo "✅ Exported: ${line%%=*}"
        fi
    done < "../.env"
else
    echo "❌ Error: ../.env file not found"
    exit 1
fi

# Validate required environment variables
required_vars=("NEXT_PUBLIC_USER_POOL_ID" "NEXT_PUBLIC_USER_POOL_CLIENT_ID" "NEXT_PUBLIC_GRAPHQL_ENDPOINT" "NEXT_PUBLIC_AWS_REGION")

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: Required environment variable $var is not set"
        exit 1
    else
        echo "✅ Validated: $var is set"
    fi
done

echo "✅ All required environment variables are set"
echo "🏗️  Building frontend..."

# Build the frontend with exported environment variables
npm run build

echo "✅ Frontend build completed successfully!"
echo "📦 Bundle location: dist/bundle.js"

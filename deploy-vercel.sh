#!/bin/bash

echo "🚀 Starting Vercel Deployment..."

# Navigate to the Next.js package directory
cd packages/nextjs

# Check if we're logged in to Vercel
if ! yarn vercel whoami > /dev/null 2>&1; then
    echo "❌ Not logged in to Vercel. Please run 'yarn vercel:login' first"
    echo "   Or set VERCEL_TOKEN environment variable"
    exit 1
fi

echo "✅ Logged in to Vercel"

# Deploy to Vercel
echo "📦 Deploying to Vercel..."
yarn vercel --yes --build-env YARN_ENABLE_IMMUTABLE_INSTALLS=false --build-env ENABLE_EXPERIMENTAL_COREPACK=1 --build-env VERCEL_TELEMETRY_DISABLED=1

if [ $? -eq 0 ]; then
    echo "🎉 Deployment successful!"
else
    echo "❌ Deployment failed"
    exit 1
fi
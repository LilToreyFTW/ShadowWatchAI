#!/bin/bash

echo "🚀 Deploying ShadowWatch AI to Vercel"
echo "===================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Login to Vercel (if not already logged in)
echo "🔐 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo "Please login to Vercel:"
    vercel login
fi

# Deploy to Vercel
echo "📦 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo "🌐 Your ShadowWatch AI website is now live on Vercel!"
echo ""
echo "Next steps:"
echo "1. Copy the deployment URL from above"
echo "2. Update your DNS settings if needed"
echo "3. Test all functionality"
echo "4. Monitor performance and logs"

#!/bin/bash

# ShadowWatch AI - Copy to New Project Script
# This script helps you copy ShadowWatch AI to a new game project

echo "🧠 ShadowWatch AI - Copy to New Project"
echo "======================================"

# Check if destination is provided
if [ -z "$1" ]; then
    echo "❌ Error: Please provide destination path"
    echo "Usage: ./copy-to-new-project.sh /path/to/your/game"
    exit 1
fi

DESTINATION="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "📁 Source: $SCRIPT_DIR"
echo "🎯 Destination: $DESTINATION"

# Check if destination exists
if [ ! -d "$DESTINATION" ]; then
    echo "❌ Error: Destination directory does not exist"
    exit 1
fi

# Check if ShadowWatch AI already exists in destination
if [ -d "$DESTINATION/shadowwatch-ai" ]; then
    echo "⚠️  ShadowWatch AI already exists in destination"
    read -p "Overwrite? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Copy cancelled"
        exit 1
    fi
fi

# Copy ShadowWatch AI
echo "📋 Copying ShadowWatch AI..."
cp -r "$SCRIPT_DIR" "$DESTINATION/shadowwatch-ai"

if [ $? -eq 0 ]; then
    echo "✅ ShadowWatch AI copied successfully!"
    echo ""
    echo "📚 Next Steps:"
    echo "1. cd $DESTINATION"
    echo "2. cp shadowwatch-ai/env.example .env"
    echo "3. Edit .env with your database credentials"
    echo "4. Run: npm install pg redis socket.io node-cron crypto"
    echo "5. Follow: shadowwatch-ai/docs/integration-guide.md"
    echo ""
    echo "🚀 Happy integrating! ShadowWatch AI is ready to enhance your game!"
else
    echo "❌ Error: Failed to copy ShadowWatch AI"
    exit 1
fi

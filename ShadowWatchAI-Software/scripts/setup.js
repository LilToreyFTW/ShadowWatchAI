#!/usr/bin/env node

/**
 * ShadowWatch AI - Setup Script
 * Initializes the AI system in a game project directory
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 ShadowWatch AI - Setup & Initialization');
console.log('==========================================');
console.log('');

const currentDir = process.cwd();
const softwareDir = path.join(currentDir, 'ShadowWatchAI-Software');

console.log('📁 Current directory:', currentDir);
console.log('📦 Software directory:', softwareDir);
console.log('');

// Check if we're in the right place
if (!fs.existsSync(softwareDir)) {
    console.error('❌ Error: ShadowWatchAI-Software folder not found');
    console.error('💡 Please run this script from your game project directory containing ShadowWatchAI-Software');
    process.exit(1);
}

console.log('✅ ShadowWatchAI-Software folder found');
console.log('');

// Check Node.js version
const nodeVersion = process.version.match(/^v(\d+)/)[1];
if (parseInt(nodeVersion) < 16) {
    console.error('❌ Error: Node.js 16+ required');
    console.error('   Current version:', process.version);
    console.error('💡 Please upgrade Node.js to version 16 or higher');
    process.exit(1);
}

console.log('✅ Node.js version check passed:', process.version);
console.log('');

// Check for package.json and install dependencies
process.chdir(softwareDir);
console.log('📂 Changed to software directory');

if (fs.existsSync('package.json')) {
    console.log('📦 Installing dependencies...');
    try {
        execSync('npm install', { stdio: 'inherit' });
        console.log('✅ Dependencies installed successfully');
    } catch (error) {
        console.error('❌ Failed to install dependencies:', error.message);
        process.exit(1);
    }
} else {
    console.error('❌ package.json not found');
    process.exit(1);
}

console.log('');

// Create necessary directories
const directories = [
    'models/weapons',
    'models/vehicles',
    'models/characters',
    'models/environments',
    'models/props',
    'models/effects',
    'models/audio',
    'models/textures',
    'models/blueprints',
    'models/scripts',
    'config',
    'logs'
];

console.log('📁 Creating directory structure...');
directories.forEach(dir => {
    const fullPath = path.join(softwareDir, dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log('   ✅ Created:', dir);
    } else {
        console.log('   ✓ Exists:', dir);
    }
});

console.log('');

// Create config file
const configPath = path.join(softwareDir, 'config', 'shadowwatch-config.json');
const config = {
    version: '1.0.0',
    setupDate: new Date().toISOString(),
    projectPath: currentDir,
    features: {
        autonomousDevelopment: true,
        ultraMaximumMode: true,
        unitySupport: true,
        unrealSupport: true,
        weaponCreation: true,
        vehicleCreation: true,
        modelPacks: true,
        antiHackerProtection: true,
        languageRestrictions: {
            unity: 'csharp-only',
            unreal: 'cpp-only',
            web: 'typescript-javascript'
        }
    },
    engines: {
        detected: [],
        active: null
    },
    security: {
        protectionEnabled: true,
        lastScan: new Date().toISOString()
    }
};

fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log('✅ Configuration file created:', 'config/shadowwatch-config.json');
console.log('');

// Create README for the project
const projectReadmePath = path.join(currentDir, 'SHADOWWATCH-AI-README.md');
const projectReadme = `# 🚀 ShadowWatch AI - Integrated

Your game project now has ShadowWatch AI integrated!

## 🎯 Quick Start

1. **Start the AI:** Run \`ShadowWatchAI-Software/scripts/start-server.js\`
2. **Open Control Panel:** Visit \`http://localhost:8080/cursor-control.html\`
3. **Enable Development:** Click "🚀🚀🚀 ENABLE ULTRA-MAXIMUM 9500H MODE 🚀🚀🚀"

## 🎮 Supported Engines

- **Unity Engine** - C# only (professional development)
- **Unreal Engine** - C++ only (no Blueprints)
- **Web Games** - TypeScript/JavaScript

## 🔫 AI Features

- 🤖 **9500-Hour Autonomous Development**
- 🔫 **Weapon Creation & Blueprints**
- 🚗 **Vehicle Creation & Blueprints**
- 🎮 **Full 3D Game Engine**
- 🛡️ **Anti-Hacker Protection**
- 📦 **Model Pack Management**

## 📁 Project Structure

\`\`\`
YourGameProject/
├── ShadowWatchAI-Software/  # AI System
│   ├── core/                 # AI Engine
│   ├── models/              # Generated Assets
│   ├── scripts/             # Utility Scripts
│   └── docs/                # Documentation
├── Assets/ (Unity)          # Your Game Assets
├── Content/ (Unreal)        # Your Game Content
└── src/ (Web)              # Your Game Source
\`\`\`

## 🚀 Development Commands

\`\`\`bash
# Start AI Assistant
node ShadowWatchAI-Software/scripts/start-server.js

# Check system status
node ShadowWatchAI-Software/scripts/setup.js --status

# Update AI system
node ShadowWatchAI-Software/scripts/setup.js --update
\`\`\`

## 🛡️ Security

ShadowWatch AI includes enterprise-level security features:
- Continuous code integrity monitoring
- Anti-redistribution protection
- Automatic security updates
- Hacker detection and prevention

## 📞 Support

The AI will automatically help you develop your game. Enable autonomous mode for 24/7 development assistance!

---

**Generated by ShadowWatch AI Setup - ${new Date().toISOString()}**
`;

fs.writeFileSync(projectReadmePath, projectReadme);
console.log('✅ Project README created:', 'SHADOWWATCH-AI-README.md');
console.log('');

// Create startup batch file for Windows users
const startupBatchPath = path.join(currentDir, 'Start-ShadowWatchAI.bat');
const startupBatch = `@echo off
echo 🚀 Starting ShadowWatch AI...
echo.
cd ShadowWatchAI-Software
node scripts/start-server.js
pause`;

fs.writeFileSync(startupBatchPath, startupBatch);
console.log('✅ Windows startup script created:', 'Start-ShadowWatchAI.bat');
console.log('');

// Final setup complete
console.log('🎉 ShadowWatch AI Setup Complete!');
console.log('===================================');
console.log('');
console.log('✅ Dependencies installed');
console.log('✅ Directory structure created');
console.log('✅ Configuration files generated');
console.log('✅ Documentation created');
console.log('');
console.log('🚀 Ready to start developing with AI!');
console.log('');
console.log('📋 Next Steps:');
console.log('1. Run: Start-ShadowWatchAI.bat (Windows)');
console.log('2. Or run: node ShadowWatchAI-Software/scripts/start-server.js');
console.log('3. Open: http://localhost:8080/cursor-control.html');
console.log('4. Enable: ULTRA-MAXIMUM 9500H MODE');
console.log('');
console.log('🎮 Your AI development assistant is now ready!');
console.log('🔫 Create weapons, vehicles, and complete games with AI!');
console.log('');
console.log('==================================================');
console.log('🚀 ShadowWatch AI is now INTEGRATED in your project!');
console.log('==================================================');

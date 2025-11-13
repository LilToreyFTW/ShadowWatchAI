#!/usr/bin/env node

/**
 * ShadowWatch AI - Startup Script
 * Launches the ultimate AI game development assistant
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 ShadowWatch AI - Ultimate Game Development Assistant');
console.log('==================================================');
console.log('');
console.log('🎮 Initializing AI systems...');

// Check if we're in the right directory
const currentDir = process.cwd();
const softwareDir = path.join(currentDir, 'ShadowWatchAI-Software');

if (!fs.existsSync(path.join(currentDir, 'ShadowWatchAI-Software'))) {
    console.error('❌ Error: ShadowWatchAI-Software folder not found in current directory');
    console.error('💡 Please ensure you\'ve placed the ShadowWatchAI-Software folder in your game project directory');
    process.exit(1);
}

console.log('✅ ShadowWatchAI-Software folder detected');
console.log('📁 Current directory:', currentDir);
console.log('');

// Check Node.js version
const nodeVersion = process.version;
console.log('📋 System Information:');
console.log('   Node.js Version:', nodeVersion);
console.log('   Platform:', process.platform);
console.log('   Architecture:', process.arch);
console.log('');

// Check for package.json
const packagePath = path.join(softwareDir, 'package.json');
if (!fs.existsSync(packagePath)) {
    console.error('❌ Error: package.json not found in ShadowWatchAI-Software directory');
    process.exit(1);
}

console.log('✅ Package configuration found');

// Check for core files
const coreFiles = [
    'core/server.js',
    'core/cursor-api-integration.js',
    'index.html',
    'cursor-control.html'
];

let missingFiles = [];
coreFiles.forEach(file => {
    if (!fs.existsSync(path.join(softwareDir, file))) {
        missingFiles.push(file);
    }
});

if (missingFiles.length > 0) {
    console.error('❌ Error: Missing core files:');
    missingFiles.forEach(file => console.error('   - ' + file));
    process.exit(1);
}

console.log('✅ All core files present');
console.log('');

// Change to software directory
process.chdir(softwareDir);
console.log('📂 Changed to ShadowWatchAI-Software directory');
console.log('');

// Start the server
console.log('🚀 Starting ShadowWatch AI Server...');
console.log('🎮 AI will be available at: http://localhost:8080');
console.log('🎛️  Control Panel: http://localhost:8080/cursor-control.html');
console.log('');

const serverProcess = spawn('node', ['core/server.js'], {
    stdio: 'inherit',
    cwd: softwareDir
});

serverProcess.on('error', (error) => {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
});

serverProcess.on('close', (code) => {
    if (code !== 0) {
        console.error(`❌ Server exited with code ${code}`);
        process.exit(code);
    }
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('');
    console.log('🛑 Shutting down ShadowWatch AI...');
    serverProcess.kill('SIGINT');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('');
    console.log('🛑 Shutting down ShadowWatch AI...');
    serverProcess.kill('SIGTERM');
    process.exit(0);
});

// Keep the script running
serverProcess.on('spawn', () => {
    console.log('✅ ShadowWatch AI Server started successfully!');
    console.log('');
    console.log('🎯 Ready to assist with game development!');
    console.log('🔫 Create weapons and vehicles');
    console.log('🚗 Build complete 3D games');
    console.log('🤖 Enable 9500-hour autonomous development');
    console.log('');
    console.log('Press Ctrl+C to stop the AI assistant');
    console.log('');
    console.log('==================================================');
    console.log('🚀 ShadowWatch AI is now ACTIVE and READY! 🚀');
    console.log('==================================================');
});

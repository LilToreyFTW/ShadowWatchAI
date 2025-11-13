@echo off
echo ============================================
echo 🚀 ShadowWatch AI - Ultimate Game Development Assistant
echo ============================================
echo.
echo 🎮 Initializing AI systems...
echo 📁 Project Directory: %~dp0
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Node.js is not installed
    echo 💡 Please install Node.js 16+ from https://nodejs.org
    pause
    exit /b 1
)

REM Check if we're in the right directory
if not exist "ShadowWatchAI-Software" (
    echo ❌ Error: ShadowWatchAI-Software folder not found
    echo 💡 Please ensure you're running this from your game project directory
    pause
    exit /b 1
)

echo ✅ Node.js detected
echo ✅ ShadowWatchAI-Software folder found
echo.

REM Change to software directory
cd ShadowWatchAI-Software

REM Check if dependencies are installed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed
)

echo.
echo 🚀 Starting ShadowWatch AI Server...
echo 🎛️  Control Panel: http://localhost:8080/cursor-control.html
echo 🌐 Main Interface: http://localhost:8080
echo.
echo 📋 Instructions:
echo 1. Open your browser to the URLs above
echo 2. Go to cursor-control.html
echo 3. Click "🚀🚀🚀 ENABLE ULTRA-MAXIMUM 9500H MODE 🚀🚀🚀"
echo 4. Watch AI develop your game automatically!
echo.
echo ============================================
echo 🎯 AI FEATURES ACTIVATED:
echo 🔫 Weapon & Vehicle Creation
echo 🎮 Unity/Unreal/Web Support
echo 🤖 9500H Autonomous Development
echo 🛡️ Anti-Hacker Protection
echo 🔒 Language Restrictions Enforced
echo ============================================
echo.
echo Press Ctrl+C to stop the AI assistant
echo.

REM Start the server
node scripts/start-server.js

REM Keep window open if server crashes
echo.
echo Server stopped. Press any key to exit...
pause >nul

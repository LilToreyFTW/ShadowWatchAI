@echo off
REM ShadowWatch AI Windows Development Server Setup
REM This script sets up and runs both the marketing website and API server

echo.
echo ================================================
echo   🌙 ShadowWatch AI Windows Server Setup
echo ================================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed!
    echo Please download and install Node.js from https://nodejs.org/
    echo Recommended: Latest LTS version
    pause
    exit /b 1
)

REM Check if PostgreSQL is installed (optional check)
psql --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  PostgreSQL not found. This is required for full ShadowWatch AI functionality.
    echo Please install PostgreSQL from https://www.postgresql.org/download/windows/
    echo.
) else (
    echo ✅ PostgreSQL detected
)

REM Check if Redis is installed (optional check)
redis-cli --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Redis not found. This is optional but recommended for better performance.
    echo You can continue without Redis for development.
    echo.
) else (
    echo ✅ Redis detected
)

echo ✅ Node.js detected
echo.

REM Navigate to the website directory
cd /d "%~dp0"

REM Check if package.json exists
if not exist "package.json" (
    echo ❌ package.json not found in website directory
    echo Please run this script from the shadowwatch-website directory
    pause
    exit /b 1
)

echo 📦 Installing website dependencies...
call npm install
if errorlevel 1 (
    echo ❌ Failed to install website dependencies
    pause
    exit /b 1
)
echo ✅ Website dependencies installed
echo.

REM Check if ShadowWatch AI directory exists
if exist "..\shadowwatch-ai" (
    echo 🔗 ShadowWatch AI source found

    REM Navigate to ShadowWatch AI directory and install dependencies
    cd /d "..\shadowwatch-ai"

    if exist "package.json" (
        echo 📦 Installing ShadowWatch AI dependencies...
        call npm install
        if errorlevel 1 (
            echo ❌ Failed to install ShadowWatch AI dependencies
            cd /d "%~dp0"
        ) else (
            echo ✅ ShadowWatch AI dependencies installed
        )
    ) else (
        echo ⚠️  ShadowWatch AI package.json not found
    )

    cd /d "%~dp0"
) else (
    echo ⚠️  ShadowWatch AI source directory not found
    echo Users will need to download it separately for API functionality
)
echo.

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo 📝 Creating .env file...
    (
        echo # ShadowWatch AI Website Configuration
        echo NODE_ENV=development
        echo PORT=8080
        echo API_PORT=3000
        echo.
        echo # Database Configuration ^(for full API functionality^)
        echo DB_HOST=localhost
        echo DB_PORT=5432
        echo DB_NAME=shadowwatch_ai
        echo DB_USER=shadowwatch_user
        echo DB_PASSWORD=your_secure_password
        echo.
        echo # API Endpoints
        echo SHADOWWATCH_API_URL=http://localhost:3000
        echo.
        echo # Development Settings
        echo CORS_ORIGIN=http://localhost:8080
    ) > .env
    echo ✅ .env file created
    echo ⚠️  Please edit .env with your actual database credentials
) else (
    echo ✅ .env file already exists
)
echo.

REM Create logs directory
if not exist "logs" (
    mkdir logs
    echo 📁 Created logs directory
)

REM Start the servers
echo 🚀 Starting ShadowWatch AI Windows Development Server...
echo.
echo ================================================
echo   🌐 WEBSITE: http://localhost:8080
echo   🔗 API:     http://localhost:3000 ^(if configured^)
echo ================================================
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the website server
node server.js

pause

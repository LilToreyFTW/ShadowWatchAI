@echo off
REM ShadowWatch AI API Service Runner
REM This script runs the API server as a Windows service

title ShadowWatch AI API Service

REM Set working directory to API location
cd /d "%~dp0..\shadowwatch-ai"

REM Ensure Node.js is in PATH
where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found in PATH
    echo Please ensure Node.js is installed and added to PATH
    exit /b 1
)

REM Check if server.js exists
if not exist "deployment\server.js" (
    echo ERROR: deployment\server.js not found in %CD%
    echo Please ensure ShadowWatch AI is properly installed
    exit /b 1
)

REM Set environment variables for production
set NODE_ENV=production
set PORT=3000
set HOST=0.0.0.0

REM Ensure .env file exists
if not exist ".env" (
    echo WARNING: .env file not found. Using default settings.
    echo Please run the database setup script first.
)

REM Log service start
echo [%date% %time%] ShadowWatch AI API Service starting... >> "%~dp0..\shadowwatch-website\logs\api-service.log"

REM Start the server
echo Starting ShadowWatch AI API Server...
node deployment/server.js >> "%~dp0..\shadowwatch-website\logs\api-service.log" 2>&1

REM Log service stop
echo [%date% %time%] ShadowWatch AI API Service stopped >> "%~dp0..\shadowwatch-website\logs\api-service.log"

exit /b %errorlevel%

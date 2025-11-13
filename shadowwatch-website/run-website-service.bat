@echo off
REM ShadowWatch AI Website Service Runner
REM This script runs the website server as a Windows service

title ShadowWatch AI Website Service

REM Set working directory to script location
cd /d "%~dp0"

REM Ensure Node.js is in PATH
where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found in PATH
    echo Please ensure Node.js is installed and added to PATH
    exit /b 1
)

REM Check if server.js exists
if not exist "server.js" (
    echo ERROR: server.js not found in %CD%
    exit /b 1
)

REM Set environment variables for production
set NODE_ENV=production
set PORT=8080
set API_PORT=3000

REM Log service start
echo [%date% %time%] ShadowWatch AI Website Service starting... >> service.log

REM Start the server
echo Starting ShadowWatch AI Website Server...
node server.js >> service.log 2>&1

REM Log service stop
echo [%date% %time%] ShadowWatch AI Website Service stopped >> service.log

exit /b %errorlevel%

@echo off
REM ShadowWatch AI API Server Setup for Windows
REM This script sets up and runs the ShadowWatch AI backend API

echo.
echo ================================================
echo   🧠 ShadowWatch AI API Server Setup
echo ================================================
echo.

REM Check if we're in the right directory
if not exist "..\shadowwatch-ai" (
    echo ❌ ShadowWatch AI source code not found!
    echo Please ensure the shadowwatch-ai directory exists alongside this website directory.
    echo.
    echo Expected structure:
    echo   parent-folder/
    echo   ├── shadowwatch-website/  ^(you are here^)
    echo   └── shadowwatch-ai/       ^(missing^)
    echo.
    pause
    exit /b 1
)

cd /d "..\shadowwatch-ai"

REM Check if package.json exists
if not exist "package.json" (
    echo ❌ package.json not found in ShadowWatch AI directory
    echo The ShadowWatch AI source code may be incomplete.
    pause
    exit /b 1
)

echo 📦 Installing ShadowWatch AI dependencies...
call npm install
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    echo Please check your Node.js installation and try again.
    pause
    exit /b 1
)
echo ✅ Dependencies installed
echo.

REM Check if .env exists
if not exist ".env" (
    echo 📝 Creating .env file...
    (
        echo # ShadowWatch AI Configuration
        echo NODE_ENV=development
        echo PORT=3000
        echo HOST=localhost
        echo.
        echo # Database Configuration
        echo DB_HOST=localhost
        echo DB_PORT=5432
        echo DB_NAME=shadowwatch_ai
        echo DB_USER=shadowwatch_user
        echo DB_PASSWORD=your_secure_password
        echo.
        echo # Redis Configuration ^(Optional^)
        echo REDIS_HOST=localhost
        echo REDIS_PORT=6379
        echo REDIS_PASSWORD=
        echo.
        echo # ShadowWatch Settings
        echo SHADOWWATCH_ENCRYPTION_KEY=your_32_char_encryption_key_here_123
        echo SHADOWWATCH_MAX_CONCURRENT_USERS=10000
        echo SHADOWWATCH_HEARTBEAT_INTERVAL_SECONDS=30
        echo SHADOWWATCH_GLOBAL_MONITORING_ENABLED=true
        echo.
        echo # Privacy Settings
        echo GDPR_COMPLIANCE_ENABLED=true
        echo DATA_RETENTION_DAYS=365
        echo USER_CONSENT_REQUIRED=true
        echo.
        echo # Tutorial System
        echo TUTORIAL_AUTO_START=true
        echo TUTORIAL_REMINDER_INTERVAL_MINUTES=15
        echo.
        echo # Attack Training
        echo ATTACK_TRAINING_MAX_SESSIONS=100
        echo ATTACK_TRAINING_CONSENT_REQUIRED=true
        echo.
        echo # Logging
        echo LOG_LEVEL=info
        echo DEBUG_MODE=false
        echo.
        echo # Security
        echo ADMIN_JWT_SECRET=your_admin_jwt_secret_key
        echo RATE_LIMIT_REQUESTS_PER_MINUTE=100
        echo.
        echo # CORS
        echo FRONTEND_URL=http://localhost:8080
        echo.
        echo # WebSocket
        echo WEBSOCKET_PING_INTERVAL=25000
        echo WEBSOCKET_PING_TIMEOUT=60000
    ) > .env
    echo ✅ .env file created
    echo ⚠️  IMPORTANT: Please edit the .env file with your actual database credentials!
    echo    You need to set up PostgreSQL and create the database first.
    echo.
    timeout /t 5
)

REM Database setup check
echo 🗄️  Checking database configuration...
psql --version >nul 2>&1
if errorlevel 1 (
    echo ❌ PostgreSQL client not found!
    echo Please install PostgreSQL from: https://www.postgresql.org/download/windows/
    echo Then create a database named 'shadowwatch_ai' with user 'shadowwatch_user'
    pause
    exit /b 1
)

REM Try to connect to database
echo 🔌 Testing database connection...
psql -h localhost -U shadowwatch_user -d shadowwatch_ai -c "SELECT 1;" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Database connection failed!
    echo Please ensure:
    echo   1. PostgreSQL is running
    echo   2. Database 'shadowwatch_ai' exists
    echo   3. User 'shadowwatch_user' has access
    echo   4. Password in .env is correct
    echo.
    echo You can run the database setup script:
    echo   node setup-db.js
    echo.
    pause
)

echo ✅ Database connection successful
echo.

REM Run database migrations if needed
echo 🛠️  Setting up database schema...
if exist "database\shadowwatch_schema.sql" (
    psql -h localhost -U shadowwatch_user -d shadowwatch_ai -f "database\shadowwatch_schema.sql" >nul 2>&1
    if errorlevel 1 (
        echo ⚠️  Database schema setup may have issues
        echo Check the database manually if needed
    ) else (
        echo ✅ Database schema applied
    )
) else (
    echo ⚠️  Database schema file not found
)
echo.

REM Start the API server
echo 🚀 Starting ShadowWatch AI API Server...
echo.
echo ================================================
echo   🔗 API Server: http://localhost:3000
echo   🏥 Health Check: http://localhost:3000/api/health
echo   📊 Admin Dashboard: http://localhost:3000/api/admin/shadowwatch
echo ================================================
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the server
node deployment/server.js

pause

@echo off
REM ShadowWatch AI Database Setup Script for Windows
REM This script sets up PostgreSQL database for ShadowWatch AI

echo.
echo ================================================
echo   🗄️  ShadowWatch AI Database Setup
echo ================================================
echo.

REM Check if PostgreSQL is installed
psql --version >nul 2>&1
if errorlevel 1 (
    echo ❌ PostgreSQL is not installed!
    echo Please download and install PostgreSQL from:
    echo https://www.postgresql.org/download/windows/
    echo.
    echo After installation, run this script again.
    pause
    exit /b 1
)

echo ✅ PostgreSQL detected
echo.

REM Check if pg_isready is available (usually comes with PostgreSQL)
pg_isready >nul 2>&1
if errorlevel 1 (
    echo ⚠️  PostgreSQL server may not be running
    echo Please start PostgreSQL service or check your installation
    echo.
) else (
    echo ✅ PostgreSQL server is running
)
echo.

REM Get database credentials from user
echo Please enter your PostgreSQL credentials:
echo.

set /p PG_USER="PostgreSQL admin username (default: postgres): "
if "%PG_USER%"=="" set PG_USER=postgres

set /p PG_HOST="PostgreSQL host (default: localhost): "
if "%PG_HOST%"=="" set PG_HOST=localhost

set /p PG_PORT="PostgreSQL port (default: 5432): "
if "%PG_PORT%"=="" set PG_PORT=5432

REM Get password securely (hidden input would require PowerShell)
set /p PG_PASSWORD="PostgreSQL admin password: "

if "%PG_PASSWORD%"=="" (
    echo ❌ Password is required
    pause
    exit /b 1
)

echo.
echo 🔧 Setting up ShadowWatch AI database...
echo.

REM Test connection
echo 🔌 Testing database connection...
psql -h %PG_HOST% -p %PG_PORT% -U %PG_USER% -c "SELECT version();" >nul 2>&1
if errorlevel 1 (
    echo ❌ Cannot connect to PostgreSQL
    echo Please check your credentials and ensure PostgreSQL is running
    pause
    exit /b 1
)

echo ✅ Database connection successful
echo.

REM Create database and user
echo 📝 Creating ShadowWatch AI database and user...

REM Create database
psql -h %PG_HOST% -p %PG_PORT% -U %PG_USER% -c "CREATE DATABASE shadowwatch_ai;" 2>nul
if errorlevel 1 (
    echo ⚠️  Database 'shadowwatch_ai' may already exist
) else (
    echo ✅ Database 'shadowwatch_ai' created
)

REM Create user
psql -h %PG_HOST% -p %PG_PORT% -U %PG_USER% -c "CREATE USER shadowwatch_user WITH PASSWORD 'secure_password_123';" 2>nul
if errorlevel 1 (
    echo ⚠️  User 'shadowwatch_user' may already exist
) else (
    echo ✅ User 'shadowwatch_user' created
)

REM Grant permissions
psql -h %PG_HOST% -p %PG_PORT% -U %PG_USER% -c "GRANT ALL PRIVILEGES ON DATABASE shadowwatch_ai TO shadowwatch_user;" 2>nul
echo ✅ Database permissions granted
echo.

REM Apply schema
echo 🏗️  Applying database schema...
if exist "..\shadowwatch-ai\database\shadowwatch_schema.sql" (
    psql -h %PG_HOST% -p %PG_PORT% -U shadowwatch_user -d shadowwatch_ai -f "..\shadowwatch-ai\database\shadowwatch_schema.sql" >nul 2>&1
    if errorlevel 1 (
        echo ❌ Failed to apply database schema
        echo Please check the schema file and try again
        pause
        exit /b 1
    ) else (
        echo ✅ Database schema applied successfully
    )
) else (
    echo ❌ Database schema file not found at: ..\shadowwatch-ai\database\shadowwatch_schema.sql
    echo Please ensure the ShadowWatch AI source code is properly downloaded
    pause
    exit /b 1
)
echo.

REM Create .env file with database credentials
echo 📝 Creating .env file for ShadowWatch AI...
if not exist "..\shadowwatch-ai\.env" (
    (
        echo # ShadowWatch AI Configuration
        echo NODE_ENV=development
        echo PORT=3000
        echo HOST=localhost
        echo.
        echo # Database Configuration
        echo DB_HOST=%PG_HOST%
        echo DB_PORT=%PG_PORT%
        echo DB_NAME=shadowwatch_ai
        echo DB_USER=shadowwatch_user
        echo DB_PASSWORD=secure_password_123
        echo.
        echo # Redis Configuration ^(Optional - leave empty if not installed^)
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
    ) > "..\shadowwatch-ai\.env"
    echo ✅ .env file created for ShadowWatch AI
) else (
    echo ⚠️  .env file already exists - not overwriting
)
echo.

echo 🎉 ShadowWatch AI database setup completed!
echo.
echo ================================================
echo   Database: shadowwatch_ai
echo   User: shadowwatch_user
echo   Password: secure_password_123
echo ================================================
echo.
echo ⚠️  IMPORTANT SECURITY NOTES:
echo   1. Change the default password in production
echo   2. Update the encryption key in .env
echo   3. Configure proper firewall rules
echo   4. Set up automated backups
echo.
echo Next steps:
echo   1. Start the API server: setup-api-server.bat
echo   2. Test the setup: curl http://localhost:3000/api/health
echo.

pause

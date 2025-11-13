@echo off
REM ShadowWatch AI Windows Service Setup
REM Installs ShadowWatch AI as a Windows service

echo.
echo ================================================
echo   🔧 ShadowWatch AI Windows Service Setup
echo ================================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Running as administrator
) else (
    echo ❌ This script must be run as administrator
    echo Right-click the batch file and select "Run as administrator"
    pause
    exit /b 1
)

REM Check if NSSM is available (Non-Sucking Service Manager)
nssm version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  NSSM not found. Installing NSSM for Windows service management...
    echo.

    REM Download NSSM
    powershell -Command "& {Invoke-WebRequest -Uri 'https://nssm.cc/release/nssm-2.24.zip' -OutFile 'nssm.zip'}"
    if errorlevel 1 (
        echo ❌ Failed to download NSSM
        echo Please install NSSM manually from: https://nssm.cc/
        pause
        exit /b 1
    )

    REM Extract NSSM
    powershell -Command "& {Expand-Archive -Path 'nssm.zip' -DestinationPath 'nssm' -Force}"
    if errorlevel 1 (
        echo ❌ Failed to extract NSSM
        pause
        exit /b 1
    )

    REM Copy NSSM to System32
    copy "nssm\nssm-2.24\win64\nssm.exe" "C:\Windows\System32\" >nul
    if errorlevel 1 (
        echo ❌ Failed to install NSSM
        pause
        exit /b 1
    )

    REM Clean up
    rmdir /s /q nssm
    del nssm.zip

    echo ✅ NSSM installed successfully
    echo.
)

echo 🔧 Setting up Windows services...
echo.

REM Get the current directory
set "SERVICE_DIR=%~dp0"
set "API_DIR=%~dp0..\shadowwatch-ai"

REM Remove trailing backslash
if "%SERVICE_DIR:~-1%"=="\" set "SERVICE_DIR=%SERVICE_DIR:~0,-1%"
if "%API_DIR:~-1%"=="\" set "API_DIR=%API_DIR:~0,-1%"

echo Service directory: %SERVICE_DIR%
echo API directory: %API_DIR%
echo.

REM Install website service
echo 📦 Installing ShadowWatch Website service...
nssm install ShadowWatchWebsite "%SERVICE_DIR%\run-website-service.bat"
if errorlevel 1 (
    echo ❌ Failed to install website service
) else (
    echo ✅ Website service installed
)

REM Install API service (if API directory exists)
if exist "%API_DIR%" (
    echo 📦 Installing ShadowWatch API service...
    nssm install ShadowWatchAPI "%SERVICE_DIR%\run-api-service.bat"
    if errorlevel 1 (
        echo ❌ Failed to install API service
    ) else (
        echo ✅ API service installed
    )
) else (
    echo ⚠️  API directory not found - skipping API service installation
)

echo.
echo 🎉 Windows services installed successfully!
echo.
echo ================================================
echo   Service Management Commands:
echo ================================================
echo.
echo Start services:
echo   net start ShadowWatchWebsite
echo   net start ShadowWatchAPI
echo.
echo Stop services:
echo   net stop ShadowWatchWebsite
echo   net stop ShadowWatchAPI
echo.
echo Check service status:
echo   sc query ShadowWatchWebsite
echo   sc query ShadowWatchAPI
echo.
echo Remove services:
echo   nssm remove ShadowWatchWebsite confirm
echo   nssm remove ShadowWatchAPI confirm
echo.
echo View service logs:
echo   eventvwr.msc (Windows Event Viewer)
echo.
echo ================================================
echo   🌐 Service URLs:
echo ================================================
echo.
echo Website: http://localhost:8080
echo API:     http://localhost:3000
echo Health:  http://localhost:8080/health
echo Admin:   http://localhost:3000/api/admin/shadowwatch
echo.
echo ================================================
echo.
echo ⚠️  IMPORTANT NOTES:
echo   - Services will start automatically on boot
echo   - Check Windows Event Viewer for service logs
echo   - Use Services.msc to manage services manually
echo   - Update firewall rules for production use
echo.
pause

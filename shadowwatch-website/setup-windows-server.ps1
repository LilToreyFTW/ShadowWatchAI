# ShadowWatch AI Windows Server Setup - PowerShell Edition
# Requires PowerShell 5.1+

param(
    [switch]$SkipDatabaseCheck,
    [switch]$SkipDependencyInstall,
    [switch]$StartServers,
    [string]$Port = "8080",
    [string]$ApiPort = "3000"
)

# Configuration
$ErrorActionPreference = "Stop"
$WebsiteDir = $PSScriptRoot
$ApiDir = Join-Path $PSScriptRoot "..\shadowwatch-ai"
$LogFile = Join-Path $WebsiteDir "setup.log"

# Logging function
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = "[$Timestamp] [$Level] $Message"
    Write-Host $LogMessage
    Add-Content -Path $LogFile -Value $LogMessage
}

# Banner
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   🌙 ShadowWatch AI Windows Server Setup" -ForegroundColor Cyan
Write-Host "   PowerShell Edition" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Log "Starting ShadowWatch AI Windows server setup"

# Check prerequisites
function Test-Prerequisites {
    Write-Log "Checking prerequisites..."

    # Check Node.js
    try {
        $nodeVersion = & node --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✅ Node.js detected: $nodeVersion"
        } else {
            throw "Node.js not found"
        }
    } catch {
        Write-Log "❌ Node.js is not installed or not in PATH" "ERROR"
        Write-Log "Please install Node.js from https://nodejs.org/" "ERROR"
        exit 1
    }

    # Check npm
    try {
        $npmVersion = & npm --version 2>$null
        Write-Log "✅ npm detected: v$npmVersion"
    } catch {
        Write-Log "❌ npm not found" "ERROR"
        exit 1
    }

    # Check PostgreSQL (unless skipped)
    if (-not $SkipDatabaseCheck) {
        try {
            $pgVersion = & psql --version 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Log "✅ PostgreSQL detected: $pgVersion"
            } else {
                throw "PostgreSQL not found"
            }
        } catch {
            Write-Log "⚠️  PostgreSQL not found - this is required for full functionality"
            Write-Log "Install from: https://www.postgresql.org/download/windows/"
        }
    }

    # Check Redis (optional)
    try {
        $redisVersion = & redis-cli --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✅ Redis detected: $redisVersion"
        }
    } catch {
        Write-Log "⚠️  Redis not found - optional but recommended"
    }

    Write-Log "Prerequisites check completed"
}

# Setup environment
function Initialize-Environment {
    Write-Log "Setting up environment..."

    # Create .env if it doesn't exist
    $envFile = Join-Path $WebsiteDir ".env"
    if (-not (Test-Path $envFile)) {
        Write-Log "Creating .env file..."

        $envContent = @"
# ShadowWatch AI Website Configuration
NODE_ENV=development
PORT=$Port
API_PORT=$ApiPort

# Database Configuration (for full API functionality)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=shadowwatch_ai
DB_USER=shadowwatch_user
DB_PASSWORD=secure_password_123

# API Endpoints
SHADOWWATCH_API_URL=http://localhost:$ApiPort

# Development Settings
CORS_ORIGIN=http://localhost:$Port
"@

        Set-Content -Path $envFile -Value $envContent
        Write-Log "✅ .env file created"
    } else {
        Write-Log "✅ .env file already exists"
    }

    # Create logs directory
    $logsDir = Join-Path $WebsiteDir "logs"
    if (-not (Test-Path $logsDir)) {
        New-Item -ItemType Directory -Path $logsDir | Out-Null
        Write-Log "✅ Created logs directory"
    }
}

# Install dependencies
function Install-Dependencies {
    if ($SkipDependencyInstall) {
        Write-Log "Skipping dependency installation"
        return
    }

    Write-Log "Installing website dependencies..."
    Push-Location $WebsiteDir

    try {
        & npm install
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✅ Website dependencies installed"
        } else {
            throw "npm install failed"
        }
    } catch {
        Write-Log "❌ Failed to install website dependencies: $_" "ERROR"
        exit 1
    } finally {
        Pop-Location
    }

    # Check for API directory and install dependencies
    if (Test-Path $ApiDir) {
        Write-Log "Installing ShadowWatch AI API dependencies..."
        Push-Location $ApiDir

        try {
            if (Test-Path "package.json") {
                & npm install
                if ($LASTEXITCODE -eq 0) {
                    Write-Log "✅ API dependencies installed"
                } else {
                    Write-Log "⚠️  API dependency installation may have issues"
                }
            } else {
                Write-Log "⚠️  API package.json not found"
            }
        } catch {
            Write-Log "⚠️  API dependency installation failed: $_"
        } finally {
            Pop-Location
        }
    } else {
        Write-Log "⚠️  ShadowWatch AI API directory not found - limited functionality"
    }
}

# Test API connectivity
function Test-ApiConnectivity {
    Write-Log "Testing API connectivity..."

    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$ApiPort/api/health" -TimeoutSec 5 -ErrorAction Stop
        $data = $response.Content | ConvertFrom-Json

        Write-Log "✅ ShadowWatch AI API detected: $($data.version)"
        return $true
    } catch {
        Write-Log "⚠️  ShadowWatch AI API not accessible - running in website-only mode"
        Write-Log "Start the API server with: cd ../shadowwatch-ai && npm start"
        return $false
    }
}

# Start servers
function Start-Servers {
    Write-Log "Starting servers..."

    # Start website server in background
    Write-Log "Starting website server on port $Port..."
    $websiteJob = Start-Job -ScriptBlock {
        param($dir, $port)
        Set-Location $dir
        & node server.js
    } -ArgumentList $WebsiteDir, $Port

    # Wait a moment for server to start
    Start-Sleep -Seconds 3

    # Test website server
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port/health" -TimeoutSec 5
        $data = $response.Content | ConvertFrom-Json
        Write-Log "✅ Website server started: $($data.service)"
    } catch {
        Write-Log "❌ Website server failed to start: $_" "ERROR"
        exit 1
    }

    # Test API connectivity
    $apiAvailable = Test-ApiConnectivity

    # Display server information
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "   🌐 WEBSITE: http://localhost:$Port" -ForegroundColor Green
    Write-Host "   🏥 Health:  http://localhost:$Port/health" -ForegroundColor Green
    Write-Host "   📊 Status:  http://localhost:$Port/api-status" -ForegroundColor Green

    if ($apiAvailable) {
        Write-Host "   🔗 API:     http://localhost:$ApiPort" -ForegroundColor Green
        Write-Host "   📈 Admin:   http://localhost:$ApiPort/api/admin/shadowwatch" -ForegroundColor Green
        Write-Host "   ✅ Full API functionality available" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  API:     Not available (start API server separately)" -ForegroundColor Yellow
    }

    Write-Host "================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Press Ctrl+C to stop the servers" -ForegroundColor Cyan
    Write-Host ""

    # Keep script running
    try {
        while ($true) {
            Start-Sleep -Seconds 1

            # Check if website job is still running
            if ($websiteJob.State -ne "Running") {
                Write-Log "Website server stopped unexpectedly" "ERROR"
                break
            }
        }
    } catch {
        Write-Log "Stopping servers..."
    } finally {
        # Cleanup
        Stop-Job -Job $websiteJob -ErrorAction SilentlyContinue
        Remove-Job -Job $websiteJob -ErrorAction SilentlyContinue
        Write-Log "Servers stopped"
    }
}

# Main execution
try {
    Test-Prerequisites
    Initialize-Environment
    Install-Dependencies

    if ($StartServers) {
        Start-Servers
    } else {
        Write-Host ""
        Write-Host "Setup completed! Run with -StartServers to launch servers:" -ForegroundColor Green
        Write-Host ".\setup-windows-server.ps1 -StartServers" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Or run individual components:" -ForegroundColor Green
        Write-Host "- Website:  node server.js" -ForegroundColor Cyan
        Write-Host "- API:      cd ../shadowwatch-ai && npm start" -ForegroundColor Cyan
        Write-Host ""
    }

    Write-Log "ShadowWatch AI Windows setup completed successfully"

} catch {
    Write-Log "Setup failed: $_" "ERROR"
    Write-Host ""
    Write-Host "Setup failed. Check the log file: $LogFile" -ForegroundColor Red
    exit 1
}

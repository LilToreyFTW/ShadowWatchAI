@echo off
echo 🚀 Deploying ShadowWatch AI to Vercel
echo ====================================
echo.

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Vercel CLI not found. Installing...
    npm install -g vercel
    echo.
)

REM Login to Vercel (if not already logged in)
echo 🔐 Checking Vercel authentication...
vercel whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo Please login to Vercel:
    vercel login
    echo.
)

REM Deploy to Vercel
echo 📦 Deploying to Vercel...
vercel --prod

echo.
echo ✅ Deployment complete!
echo 🌐 Your ShadowWatch AI website is now live on Vercel!
echo.
echo Next steps:
echo 1. Copy the deployment URL from above
echo 2. Update your DNS settings if needed
echo 3. Test all functionality
echo 4. Monitor performance and logs
echo.
pause

@echo off
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                🌙 SHADOWWATCH AI CLI INSTALLER 🌙              ║
echo ║             Global Terminal Command Installation               ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo This will install ShadowWatch AI CLI globally on your system.
echo After installation, you can use 'shadowwatch' or 'sw' from any terminal.
echo.
echo Requirements:
echo • Node.js installed and in PATH
echo • NPM installed
echo • Administrator privileges may be required
echo.

:choice
set /p install="Install ShadowWatch AI CLI globally? (y/n): "
if /i "%install%"=="y" goto install
if /i "%install%"=="n" goto cancel
echo Please answer y or n
goto choice

:install
echo.
echo 🔧 Installing ShadowWatch AI CLI globally...
echo.

npm install -g .

if %errorlevel% neq 0 (
    echo.
    echo ❌ Installation failed!
    echo Please ensure you have Node.js and NPM installed.
    echo Try running as Administrator if you get permission errors.
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ ShadowWatch AI CLI installed successfully!
echo.
echo 🎉 You can now use these commands from any terminal:
echo.
echo   shadowwatch create --UltraHardCoded -f --test model_dummy --Unreal
echo   shadowwatch create --UltraHardCoded -f --test model_weapon --Unity --name MySword
echo   shadowwatch create --UltraHardCoded -f --test model_vehicle --Unreal --name Car
echo   shadowwatch list-models
echo   shadowwatch --help
echo.
echo 💡 Command aliases:
echo   shadowwatch  (full name)
echo   sw          (short alias)
echo.
echo 📖 View all 50+ commands in: commands-list.txt
echo.
pause
goto end

:cancel
echo.
echo ❌ Installation cancelled.
echo.
pause
goto end

:end
echo.
echo Press any key to exit...
pause >nul

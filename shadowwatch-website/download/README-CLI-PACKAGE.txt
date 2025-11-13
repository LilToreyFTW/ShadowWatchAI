# ShadowWatch AI CLI Tools - CLI Only Package
# This file represents the ShadowWatchAI-CLI.zip download

## What's Included in CLI Package:

### 💻 Core CLI System
- cli.js (Main CLI executable)
- commands-generator.js (Command generation utility)
- commands-list.txt (All 50+ pre-generated commands)

### 📦 Project Templates
- Model generation templates for Unreal/C++
- Unity/C# script templates
- Blueprint configurations

### 🛠️ Development Tools
- shadowwatch command (global CLI)
- sw command (short alias)
- Model creation utilities
- Cursor Agent integration

### 📚 Essential Documentation
- CLI usage guide
- Command reference
- Model creation examples

## Quick Start:

### Install CLI Globally:
```bash
npm install -g .
# or run the installer
./Install-CLI-Globally.bat
```

### Basic Usage:
```bash
# Create 3D models instantly
shadowwatch create --UltraHardCoded -f --test model_dummy --Unreal

# Start autonomous development
shadowwatch cursor-agent-auto 9500h unreal

# Check development status
shadowwatch cursor-status

# List all available models
shadowwatch list-models
```

### Popular Commands:
```bash
shadowwatch create --UltraHardCoded -f --test model_dummy --Unreal --name Hero
shadowwatch create --UltraHardCoded -f --test model_weapon --Unity --name Sword
shadowwatch create --UltraHardCoded -f --test model_vehicle --Unreal --name Car
shadowwatch ultra-hardcoded create --test model_dummy --Unity
shadowwatch force-generate create --UltraHardCoded --test model_weapon --Unreal
```

## Features:
- ✅ 50+ Pre-generated terminal commands
- ✅ Instant 3D model creation
- ✅ Unreal Engine C++ support
- ✅ Unity Engine C# support
- ✅ Cursor Agent autonomous development
- ✅ Ultra-hardcoded maximum quality
- ✅ Cross-platform compatibility

## System Requirements:
- Node.js 16+
- NPM
- Terminal/Command prompt access
- Internet connection (for AI features)

## Integration:
This CLI package works with any game engine and can be integrated into existing projects. Place the CLI tools in your project directory and use the terminal commands to generate assets instantly.

For full documentation, see: commands-list.txt

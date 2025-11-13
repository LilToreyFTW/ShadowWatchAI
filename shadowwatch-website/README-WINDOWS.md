# 🌙 ShadowWatch AI - Windows Development Server

Complete Windows-compatible hosting solution for ShadowWatch AI marketing website and API backend.

## 📋 System Requirements

### Required Software
- **Windows 10/11** (64-bit)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **PostgreSQL 12+** - [Download](https://www.postgresql.org/download/windows/)
- **Git** (optional) - [Download](https://git-scm.com/)

### Optional Software
- **Redis** (for enhanced performance) - [Download](https://redis.io/download)
- **PowerShell 5.1+** (included with Windows)

## 🚀 Quick Start

### Option 1: One-Click Setup (Recommended)
```batch
# Double-click this file in Windows Explorer
setup-windows-server.bat
```

### Option 2: Manual Setup
```batch
# 1. Setup database (if not done already)
setup-database.bat

# 2. Start API server
setup-api-server.bat

# 3. Start website server (in new terminal)
setup-windows-server.bat
```

## 📁 Project Structure

```
shadowwatch-website/
├── setup-windows-server.bat    # Main setup script
├── setup-api-server.bat        # API server setup
├── setup-database.bat          # Database setup
├── server.js                   # Website server
├── index.html                  # Marketing website
├── styles.css                  # Website styles
├── script.js                   # Website JavaScript
├── package.json                # Dependencies
├── 404.html                    # Error page
├── implementation-guide.txt    # Integration docs
├── cursor-prompt.txt          # Cursor AI prompt
└── README-WINDOWS.md          # This file

../shadowwatch-ai/              # API Backend (separate)
├── core/                       # AI engine
├── database/                   # Schema
├── deployment/                 # Server
├── tests/                      # Tests
└── package.json
```

## 🗄️ Database Setup

### Automatic Setup
Run the database setup script:
```batch
setup-database.bat
```

This will:
- ✅ Check PostgreSQL installation
- ✅ Create `shadowwatch_ai` database
- ✅ Create `shadowwatch_user` with permissions
- ✅ Apply database schema
- ✅ Create `.env` configuration file

### Manual Setup (if needed)
```sql
-- Connect as PostgreSQL admin
psql -U postgres

-- Create database and user
CREATE DATABASE shadowwatch_ai;
CREATE USER shadowwatch_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE shadowwatch_ai TO shadowwatch_user;
\q

-- Apply schema
psql -U shadowwatch_user -d shadowwatch_ai -f shadowwatch-ai/database/shadowwatch_schema.sql
```

## 🌐 Starting the Servers

### Website + API (Full Stack)
```batch
setup-windows-server.bat
```

### API Only
```batch
setup-api-server.bat
```

### Website Only
```batch
node server.js
```

## 🌐 Server URLs

After starting the servers:

| Service | URL | Purpose |
|---------|-----|---------|
| **Marketing Website** | http://localhost:8080 | ShadowWatch AI website |
| **API Backend** | http://localhost:3000 | Full API functionality |
| **🤖 Cursor AI Control** | http://localhost:8080/cursor-control | **NEW!** Full AI development control |
| **🚀 Autonomous Mode** | http://localhost:8080/cursor-control | **ULTIMATE!** AI develops your game automatically |
| **🚀🚀🚀 ULTRA-MAXIMUM** | http://localhost:8080/cursor-control | **GOD-TIER!** 9500H continuous 3D game development |
| **Health Check** | http://localhost:8080/health | Website server status |
| **API Status** | http://localhost:8080/api-status | Check API availability |
| **Admin Dashboard** | http://localhost:3000/api/admin/shadowwatch | API admin panel |

## 🤖 Cursor AI Control Panel (NEW!)

The **Cursor AI Control Panel** gives you **full programmatic control** over ShadowWatch AI development!

### Features:
- ✅ **Launch Custom Agents** - Write any development task
- ✅ **Smart Model Selection** - AUTO or Grok Code when available
- ✅ **🤖 AUTONOMOUS DEVELOPMENT** - AI automatically develops your entire game
- ✅ **Game Source Detection** - Auto-detects game files and technologies
- ✅ **Continuous Development** - 24/7 automated development cycles
- ✅ **Auto-save & Commit** - Automatic code commits every 10 minutes
- ✅ **Pre-built Commands** - Feature dev, bug fixes, performance, testing, refactoring
- ✅ **Real-time Monitoring** - Track agent progress and status
- ✅ **Conversation History** - View all agent interactions
- ✅ **Batch Operations** - Execute multiple commands at once
- ✅ **Statistics Dashboard** - Monitor development metrics
- ✅ **Export Capabilities** - Download agent history and logs

### Quick Commands:
```javascript
// Launch a feature development agent
POST /api/cursor/develop-feature
{ "feature": "Add user authentication system" }

// Fix a bug
POST /api/cursor/fix-bug
{ "bug": "Memory leak in WebSocket connections" }

// Optimize performance
POST /api/cursor/improve-performance
{ "issue": "Database queries are slow under load" }

// Add comprehensive tests
POST /api/cursor/add-tests
{ "tests": "Add unit tests for all API endpoints" }

// Refactor code
POST /api/cursor/refactor
{ "refactor": "Improve code organization in core modules" }

// Update documentation
POST /api/cursor/update-docs
{ "docs": "Document the new authentication API" }
```

### Access the Control Panel:
1. Start your servers with `setup-windows-server.bat`
2. Open http://localhost:8080/cursor-control
3. Start controlling ShadowWatch AI development!

## 🧪 Testing Your Setup

### Health Checks
```batch
# Website server
curl http://localhost:8080/health

# API server
curl http://localhost:3000/api/health

# Combined status
curl http://localhost:8080/api-status
```

### API Functionality Test
```batch
# Get demo stats
curl http://localhost:8080/api/demo/stats

# Test tutorial API
curl http://localhost:3000/api/tutorial/status/test-user
```

## 🔧 Configuration

### Environment Variables (.env)

The setup scripts create `.env` files automatically. Key settings:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=shadowwatch_ai
DB_USER=shadowwatch_user
DB_PASSWORD=your_secure_password

# Servers
PORT=8080                    # Website server port
API_PORT=3000               # API server port

# ShadowWatch AI
SHADOWWATCH_ENCRYPTION_KEY=your_32_char_key_here
GDPR_COMPLIANCE_ENABLED=true
DATA_RETENTION_DAYS=365
```

### Security Notes
- ⚠️ **Change default passwords** in production
- 🔐 **Update encryption keys** for security
- 🚫 **Never commit .env files** to version control
- 🔒 **Configure firewall rules** for production

## 📚 Documentation Access

### Implementation Guide
- **File**: `implementation-guide.txt`
- **URL**: http://localhost:8080/docs/implementation-guide.txt
- **Download**: http://localhost:8080/download/implementation-guide.txt

### Cursor AI Integration Prompt
- **File**: `cursor-prompt.txt`
- **URL**: http://localhost:8080/docs/cursor-prompt.txt
- **Download**: http://localhost:8080/download/cursor-prompt.txt

## 🛠️ Development Workflow

### Making Changes
1. **Edit website files** in `shadowwatch-website/`
2. **Restart website server** (Ctrl+C then `node server.js`)
3. **Edit API code** in `../shadowwatch-ai/`
4. **Restart API server** if needed

### Logs
- **Website logs**: Displayed in terminal
- **API logs**: Check `../shadowwatch-ai/logs/`
- **Database logs**: PostgreSQL logs

### Debugging
```batch
# Check Node.js version
node --version

# Check npm version
npm --version

# Test database connection
psql -U shadowwatch_user -d shadowwatch_ai -c "SELECT 1;"

# View running processes
tasklist | findstr node
```

## 🚀 Production Deployment

### Windows Server Setup
1. **Install IIS** (optional, for static hosting)
2. **Configure firewall** for ports 80/443
3. **Set up SSL certificates**
4. **Configure automatic updates**

### Process Management
```batch
# Install PM2 globally
npm install -g pm2

# Start servers with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Backup Strategy
```batch
# Database backup script
pg_dump -U shadowwatch_user shadowwatch_ai > backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%.sql

# File backup
xcopy shadowwatch-website "backups\website_%date:~-4,4%%date:~-10,2%%date:~-7,2%" /E /I /H
```

## 🐛 Troubleshooting

### Common Issues

#### ❌ "Node.js not found"
```batch
# Install Node.js from https://nodejs.org/
# Restart command prompt
node --version
```

#### ❌ "PostgreSQL not found"
```batch
# Install PostgreSQL from https://www.postgresql.org/download/windows/
# Add to PATH environment variable
psql --version
```

#### ❌ "Database connection failed"
```batch
# Check PostgreSQL service is running
services.msc
# Look for "postgresql-x64-12" and ensure it's running

# Test connection
psql -h localhost -U postgres -c "SELECT version();"
```

#### ❌ "Port already in use"
```batch
# Find process using port
netstat -ano | findstr :8080
# Kill process (replace PID)
taskkill /PID <PID> /F
```

#### ❌ "Permission denied"
```batch
# Run command prompt as administrator
# Or check folder permissions
icacls "shadowwatch-website" /grant Users:F /T
```

### Performance Issues

#### High Memory Usage
```batch
# Monitor memory usage
tasklist /FI "IMAGENAME eq node.exe"

# Check for memory leaks
# Add --inspect flag for debugging
node --inspect server.js
```

#### Slow Database Queries
```batch
# Enable query logging in PostgreSQL
# Check slow queries in logs

# Add indexes if needed
psql -U shadowwatch_user -d shadowwatch_ai -c "CREATE INDEX CONCURRENTLY idx_activity_logs_timestamp ON activity_logs(timestamp);"
```

## 📞 Support

### Getting Help
- 📧 **Email**: support@shadowwatch-ai.com
- 🌐 **Forum**: https://forum.shadowwatch-ai.com
- 📖 **Docs**: implementation-guide.txt
- 🤖 **AI Integration**: cursor-prompt.txt

### Community Resources
- **GitHub Issues**: Report bugs and request features
- **Discord Server**: Real-time community support
- **YouTube Tutorials**: Video integration guides

## 📋 Checklist

### Pre-Setup
- [ ] Node.js 18+ installed
- [ ] PostgreSQL 12+ installed and running
- [ ] Redis installed (optional)
- [ ] Git installed (optional)

### Setup Complete
- [ ] Database created and configured
- [ ] Environment variables set
- [ ] Dependencies installed
- [ ] Servers start without errors
- [ ] Health checks pass
- [ ] Website accessible at http://localhost:8080
- [ ] API accessible at http://localhost:3000

### Production Ready
- [ ] Security configured
- [ ] Backups automated
- [ ] Monitoring set up
- [ ] SSL certificates installed
- [ ] Firewall configured

### Cursor AI Control Ready
- [ ] Cursor API key configured
- [ ] Repository access verified
- [ ] Agent launching tested
- [ ] Control panel accessible
- [ ] Development workflow validated

## 🎉 Success!

Once everything is running, you'll have:

- 🌐 **Marketing website** at http://localhost:8080
- 🔗 **Full API backend** at http://localhost:3000
- 🤖 **Cursor AI Control Panel** at http://localhost:8080/cursor-control
- 📚 **Complete documentation** for integration
- 🎯 **Cursor AI prompts** for automated setup
- 🚀 **Full AI development control** over ShadowWatch AI

Users can now:
- **Discover** ShadowWatch AI through your professional website
- **Purchase** licenses with integrated payment simulation
- **Download** comprehensive integration documentation
- **Integrate** using the Cursor AI prompt system
- **Control** ongoing AI development through the control panel

### 🤖 AUTONOMOUS DEVELOPMENT MODE (BETA)

**REVOLUTIONARY FEATURE:** Enable autonomous development and let AI completely develop your game for you!

#### How It Works:
1. **🚀 Enable Autonomous Mode** - Click "Enable Auto Development"
2. **🔍 Auto-Detection** - AI detects your game files and technologies
3. **📋 Smart Planning** - Generates comprehensive development plan
4. **⚡ Continuous Development** - AI works 24/7 on your game
5. **💾 Auto-Save** - Commits improvements every 10 minutes
6. **📊 Progress Tracking** - Real-time development statistics

#### ULTRA-MAXIMUM 9500-HOUR MODE 🚀🚀🚀
**ULTIMATE FEATURE:** Let AI work continuously for 9500 hours to build your complete 3D MMO/RPG game!

**How to Activate:**
1. Click the pulsing **"🚀🚀🚀 ENABLE ULTRA-MAXIMUM 9500H MODE 🚀🚀🚀"** button
2. Confirm you want AI to work 9500 hours continuously
3. Watch AI build your complete game automatically!

**What ULTRA-MAXIMUM Mode Builds:**
- ✅ **Complete 3D Game Engine** - Full WebGL/Three.js implementation
- ✅ **WASD Controls** - Perfect movement with collision detection
- ✅ **Mouse Controls** - Pointer lock, sensitivity, camera follow
- ✅ **MMO/RPG Systems** - Character creation, inventory, combat, quests
- ✅ **HTML Tab Fulfillment** - All 20+ tabs fully functional
- ✅ **Open World** - Procedural generation, weather, wildlife
- ✅ **Multiplayer** - Real-time networking and synchronization
- ✅ **24/7 Development** - Never stops, works continuously

#### What It Does:
- ✅ **Feature Implementation** - Adds missing game features automatically
- ✅ **Bug Detection & Fixing** - Finds and fixes issues continuously
- ✅ **Performance Optimization** - Improves game speed and efficiency
- ✅ **Testing** - Generates and runs comprehensive tests
- ✅ **Documentation** - Updates docs and code comments
- ✅ **Code Quality** - Refactors and improves code structure

#### ENGINE INTEGRATION:
- ✅ **Unity Engine Support** - Full Unity 2022.3+ integration with C# ONLY (no other languages)
- ✅ **Unreal Engine Support** - Full Unreal 5.3+ integration with C++ ONLY (strictly no Blueprints)
- ✅ **Weapon Blueprints** - Complete weapon systems with stats, mechanics, animations
- ✅ **Vehicle Blueprints** - Complete vehicle systems with physics, controls, customization
- ✅ **3D Model Creation** - Full-scale 3D models optimized for each engine
- ✅ **Model Organization** - Structured `models/` directory with categorized subfolders

#### 🔒 LANGUAGE RESTRICTIONS (CRITICAL):
- ✅ **C# ONLY** - Unity Engine projects (mandatory)
- ✅ **C++ ONLY** - Unreal Engine projects (mandatory, no Blueprints)
- ✅ **TypeScript** - Web-based games (optional)
- ✅ **JavaScript** - Web-based games (optional)
- ✅ **HTML** - ONLY webpage-based MMO games (restricted)
- ❌ **NO Python, Java, or other languages** - Strictly prohibited

#### MODEL CREATION FEATURES:
- ✅ **Weapon Packs** - Complete weapon model packs with multiple variants
- ✅ **Vehicle Packs** - Complete vehicle model packs with multiple types
- ✅ **Engine Optimization** - Models optimized for Unity FBX or Unreal formats
- ✅ **LOD Systems** - Level of Detail variations for performance
- ✅ **PBR Materials** - Physically Based Rendering textures and shaders
- ✅ **Animation Ready** - Rigged models ready for animation systems

#### API Endpoints:
```javascript
// AUTONOMOUS DEVELOPMENT
POST /api/cursor/autonomous/enable              // Enable normal autonomous mode
POST /api/cursor/autonomous/enable-ultra-maximum // Enable 9500-hour ULTRA mode
GET  /api/cursor/autonomous/status              // Check autonomous status
POST /api/cursor/autonomous/force-cycle         // Force development cycle
POST /api/cursor/autonomous/clear-queue         // Clear development queue
POST /api/cursor/autonomous/reset               // Reset autonomous system

// ENGINE INTEGRATION
POST /api/cursor/unity/init    // Initialize Unity Engine support
POST /api/cursor/unreal/init   // Initialize Unreal Engine support

// WEAPON CREATION
POST /api/cursor/weapons/create  // Create weapon blueprint & 3D model
POST /api/cursor/weapons/pack    // Create weapon model pack

// VEHICLE CREATION
POST /api/cursor/vehicles/create // Create vehicle blueprint & 3D model
POST /api/cursor/vehicles/pack   // Create vehicle model pack

// MODEL ORGANIZATION
POST /api/cursor/models/structure // Create organized model directory structure

// SECURITY & PROTECTION
GET  /api/cursor/security/status // Get security status
POST /api/cursor/security/scan   // Force security scan
```

#### Safety Features:
- 🛡️ **Human Oversight** - You can disable anytime
- 🔄 **Progress Tracking** - See exactly what AI is doing
- 🧹 **Queue Management** - Clear pending tasks if needed
- 🔄 **System Reset** - Start fresh anytime
- 💾 **Auto-commits** - Never lose work

---

**You now have COMPLETE CONTROL over ShadowWatch AI development using Cursor Cloud Agents with AUTO/Grok Code AI models!** 🚀🤖

**🤖 PLUS: ULTRA-MAXIMUM Autonomous AI that develops your entire 3D MMO/RPG game for 9500 hours continuously!**

**🚀🚀🚀 ULTRA-MAXIMUM FEATURES:**
- ✅ **9500 Hours Continuous Development** - AI never stops working
- ✅ **Complete 3D Game Engine** - Full WebGL/Three.js implementation
- ✅ **Perfect WASD + Mouse Controls** - Professional game controls
- ✅ **Full MMO/RPG Systems** - Character, combat, quests, guilds
- ✅ **All HTML Tabs Fulfilled** - Every tab becomes fully functional
- ✅ **24/7 Auto-Saving** - Commits every minute during development
- ✅ **Maximum Parallel Processing** - Multiple AI agents working simultaneously
- ✅ **Unity & Unreal Engine Support** - Latest versions with full integration
- ✅ **Weapon Blueprints & 3D Models** - Complete weapon creation system
- ✅ **Vehicle Blueprints & 3D Models** - Complete vehicle creation system
- ✅ **Model Pack Creation** - Organized weapon/vehicle collections
- ✅ **Organized Model Directory** - Structured `models/` folder system
- ✅ **Anti-Hacker Protection** - Continuous security monitoring
- ✅ **🔒 LANGUAGE RESTRICTIONS ENFORCED** - Only C#, C++, TypeScript, JavaScript, HTML (context-specific)

---

**ShadowWatch AI** - Ethical gaming intelligence for the future 🚀

**🚀🚀🚀 THE ULTIMATE AI GAME DEVELOPMENT SYSTEM WITH LANGUAGE RESTRICTIONS ENFORCED 🚀🚀🚀**

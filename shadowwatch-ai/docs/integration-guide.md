# ShadowWatch AI Integration Guide

This guide walks you through integrating ShadowWatch AI into your existing browser MMORPG.

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Redis (optional, for enhanced performance)
- Existing WebSocket infrastructure

## 🚀 Step-by-Step Integration

### Step 1: Copy ShadowWatch AI

```bash
# Copy the entire shadowwatch-ai folder to your project
cp -r shadowwatch-ai /path/to/your/game/

# Navigate to your game directory
cd /path/to/your/game/
```

### Step 2: Install Dependencies

```bash
# Install ShadowWatch AI dependencies
npm install pg redis socket.io node-cron crypto

# Optional: Install development dependencies
npm install -D jest cypress eslint prettier
```

### Step 3: Database Setup

```bash
# Create ShadowWatch database (or use existing)
createdb shadowwatch_ai

# Run migrations
psql -d shadowwatch_ai -f shadowwatch-ai/database/shadowwatch_schema.sql
```

### Step 4: Environment Configuration

```bash
# Copy environment template
cp shadowwatch-ai/env.example .env

# Edit .env with your database credentials and settings
nano .env
```

### Step 5: Server Integration

#### Option A: Use ShadowWatch Server (Recommended)

```javascript
// Replace your server.js with ShadowWatch-enhanced version
const server = require('./shadowwatch-ai/deployment/server');

// Or integrate ShadowWatch into existing server:

const ShadowWatchAI = require('./shadowwatch-ai/core/shadowwatch');
const shadowwatch = new ShadowWatchAI();

// In your WebSocket connection handler
io.on('connection', (socket) => {
    socket.on('authenticate', async (data) => {
        const { token } = data;
        const userId = getUserIdFromToken(token);

        if (userId) {
            await shadowwatch.subscribeUser(userId, socket, userConsent);
            socket.emit('authenticated', { success: true });
        }
    });
});
```

#### Option B: Manual Integration

```javascript
// In your existing server.js
const { initializeCompleteSystem } = require('./shadowwatch-ai');

async function startServer() {
    // Initialize your existing systems
    const app = express();
    const io = require('socket.io')(server);

    // Initialize ShadowWatch AI
    const ai = await initializeCompleteSystem({
        dbConfig: {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        }
    });

    // Integrate with WebSocket
    io.on('connection', (socket) => {
        ai.shadowwatch.handleConnection(socket);
    });

    // Start server
    server.listen(process.env.PORT || 3000);
}
```

### Step 6: Client-Side Integration

#### Add ShadowWatch CSS
```html
<!-- In your index.html -->
<link rel="stylesheet" href="shadowwatch-ai/docs/shadowwatch.css">
```

#### Initialize Client
```javascript
// In your main client script
import io from 'socket.io-client';
import { ShadowWatchClient } from './shadowwatch-client-integration';

const socket = io();
const shadowwatchClient = new ShadowWatchClient(socket);

// Authenticate when user logs in
socket.emit('authenticate', { token: userToken });
```

#### Add ShadowWatch UI Elements
```html
<!-- Add to your game UI -->
<div id="shadowwatch-stats-pulse" class="stats-pulse-sidebar">
    <!-- ShadowWatch will populate this -->
</div>
```

### Step 7: API Integration

#### User Registration (Add Consent)
```javascript
// In your registration API
app.post('/api/auth/register', async (req, res) => {
    const { email, password, username, shadowwatchConsent } = req.body;

    // Save user with ShadowWatch consent
    const user = await createUser({
        email,
        password,
        username,
        shadowwatch_enabled: shadowwatchConsent,
        shadowwatch_consent_given: shadowwatchConsent ? new Date() : null
    });

    res.json({
        success: true,
        shadowwatch: {
            enabled: shadowwatchConsent,
            gdprNotice: shadowwatchConsent ?
                'Thank you for enabling ShadowWatch AI...' :
                'ShadowWatch monitoring disabled.'
        }
    });
});
```

#### Activity Monitoring
```javascript
// In your game actions
function performGameAction(actionType, stats) {
    // Your existing game logic
    updatePlayerStats(stats);

    // Notify ShadowWatch
    socket.emit('stats_change', {
        actionType,
        stats: currentPlayerStats
    });
}
```

### Step 8: Tutorial Integration

#### Auto-Start Tutorial
```javascript
// After user login
if (user.needsTutorial) {
    socket.emit('start_tutorial');
}
```

#### Tutorial UI Elements
```javascript
// ShadowWatch handles tutorial overlays automatically
// Just ensure your CSS includes the tutorial styles
```

### Step 9: Attack Training Setup

#### Enable Training Mode
```javascript
// In user profile/settings
app.put('/api/user/training-mode', async (req, res) => {
    const { userId, enabled } = req.body;

    await updateUser(userId, {
        training_open: enabled
    });

    res.json({ success: true });
});
```

#### Training UI Integration
```javascript
// Add training button to your game UI
<button onclick="startAttackTraining()">Attack Training</button>

function startAttackTraining() {
    shadowwatchClient.startAttackTraining();
}
```

### Step 10: Testing & Deployment

#### Run Tests
```bash
# Unit tests
cd shadowwatch-ai
npm test

# E2E tests
npm run test:e2e
```

#### Deploy
```bash
# Use ShadowWatch deployment script
npm run deploy

# Or manual deployment
npm run build
npm start
```

## 🔧 Configuration Options

### Basic Configuration
```javascript
const shadowwatch = new ShadowWatchAI({
    heartbeatInterval: 30, // seconds
    offlineNudgeHours: 72,
    maxUsers: 10000,
    encryptionKey: process.env.SHADOWWATCH_ENCRYPTION_KEY
});
```

### Advanced Configuration
```javascript
const ai = await initializeCompleteSystem({
    dbConfig: { /* database settings */ },
    redisConfig: { /* redis settings */ },
    monitoringRules: {
        customRule: {
            condition: (stats) => stats.level > 10,
            action: (userId) => sendCustomMessage(userId)
        }
    },
    tutorialConfig: {
        autoStart: true,
        voiceEnabled: true,
        skipEnabled: false
    }
});
```

## 🐛 Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   ```bash
   # Check if Socket.IO server is running
   curl http://localhost:3000/api/health

   # Verify client connection
   console.log('Socket connected:', socket.connected);
   ```

2. **Database Connection Error**
   ```bash
   # Test database connection
   psql -h localhost -U shadowwatch_user -d shadowwatch_ai

   # Check environment variables
   echo $DB_HOST $DB_PORT $DB_NAME
   ```

3. **ShadowWatch Not Monitoring**
   ```javascript
   // Check user consent
   console.log('User consent:', user.shadowwatch_enabled);

   // Verify WebSocket authentication
   socket.emit('authenticate', { token });
   ```

### Debug Mode
```javascript
// Enable debug logging
process.env.DEBUG_MODE = 'true';

// Check ShadowWatch status
const health = await fetch('/api/health');
console.log(await health.json());
```

## 📊 Monitoring & Analytics

### Admin Dashboard
```bash
# Access admin insights
curl http://localhost:3000/api/admin/shadowwatch

# Response includes:
# - Active users count
# - Tutorial completion rates
# - Training session statistics
# - Privacy compliance metrics
```

### Performance Metrics
- **Response Time**: <100ms for AI decisions
- **Memory Usage**: <256MB per instance
- **WebSocket Latency**: <50ms
- **Database Queries**: <10ms average

## 🔒 Security Checklist

- [ ] Environment variables configured securely
- [ ] Database credentials encrypted
- [ ] WebSocket connections authenticated
- [ ] User consent obtained for monitoring
- [ ] Data encryption enabled
- [ ] Rate limiting configured
- [ ] Admin access restricted

## 📞 Support

For integration help or issues:
- Check the [documentation](./README.md)
- Run the test suite: `npm test`
- Check health endpoints: `/api/health`

## 🎯 Next Steps

1. **Test Integration**: Run the full test suite
2. **Monitor Performance**: Check health endpoints regularly
3. **User Feedback**: Collect player feedback on AI features
4. **Iterate**: Use analytics to improve AI recommendations
5. **Scale**: Add more servers as user base grows

---

**ShadowWatch AI is now integrated into your game!** 🎉

The AI will begin monitoring consenting players immediately, providing intelligent guidance and enhancing the gaming experience with ethical oversight.

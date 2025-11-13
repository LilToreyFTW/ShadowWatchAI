/**
 * ShadowWatch AI - Core AI Engine
 * Ethical monitoring and guidance system for browser MMORPGs
 */

const crypto = require('crypto');
const { Pool } = require('pg');
const Redis = require('redis');
const cron = require('node-cron');

class ShadowWatchAI {
    constructor(config = {}) {
        this.config = {
            // Database configuration
            dbHost: process.env.DB_HOST || 'localhost',
            dbPort: process.env.DB_PORT || 5432,
            dbName: process.env.DB_NAME || 'shadowwatch_ai',
            dbUser: process.env.DB_USER || 'shadowwatch_user',
            dbPassword: process.env.DB_PASSWORD || '',

            // Redis configuration (optional)
            redisHost: process.env.REDIS_HOST || 'localhost',
            redisPort: process.env.REDIS_PORT || 6379,
            redisPassword: process.env.REDIS_PASSWORD || null,

            // ShadowWatch settings
            encryptionKey: process.env.SHADOWWATCH_ENCRYPTION_KEY || 'default_32_character_key_here_123',
            maxConcurrentUsers: parseInt(process.env.SHADOWWATCH_MAX_CONCURRENT_USERS) || 10000,
            heartbeatInterval: parseInt(process.env.SHADOWWATCH_HEARTBEAT_INTERVAL_SECONDS) || 30,
            offlineNudgeHours: parseInt(process.env.SHADOWWATCH_OFFLINE_NUDGE_HOURS) || 72,
            globalMonitoringEnabled: process.env.SHADOWWATCH_GLOBAL_MONITORING_ENABLED !== 'false',

            // Privacy settings
            gdprComplianceEnabled: process.env.GDPR_COMPLIANCE_ENABLED !== 'false',
            dataRetentionDays: parseInt(process.env.DATA_RETENTION_DAYS) || 365,
            userConsentRequired: process.env.USER_CONSENT_REQUIRED !== 'false',

            // Logging
            logLevel: process.env.LOG_LEVEL || 'info',
            debugMode: process.env.DEBUG_MODE === 'true',

            ...config
        };

        // Core components
        this.db = null;
        this.redis = null;
        this.connectedUsers = new Map();
        this.monitoringRules = new Map();
        this.metrics = {
            activeUsers: 0,
            totalSessions: 0,
            avgResponseTime: 0,
            lastHealthCheck: new Date()
        };

        // Initialize components
        this.initializeDatabase();
        this.initializeRedis();
        this.initializeMonitoringRules();
        this.startScheduledTasks();

        this.log('info', 'ShadowWatch AI initialized', { config: this.getSafeConfig() });
    }

    // #region Initialization Methods

    async initializeDatabase() {
        try {
            this.db = new Pool({
                host: this.config.dbHost,
                port: this.config.dbPort,
                database: this.config.dbName,
                user: this.config.dbUser,
                password: this.config.dbPassword,
                max: 20,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
            });

            // Test connection
            await this.db.query('SELECT NOW()');
            this.log('info', 'Database connection established');
        } catch (error) {
            this.log('error', 'Database connection failed', { error: error.message });
            throw error;
        }
    }

    async initializeRedis() {
        try {
            if (this.config.redisHost) {
                this.redis = Redis.createClient({
                    host: this.config.redisHost,
                    port: this.config.redisPort,
                    password: this.config.redisPassword || undefined
                });

                await this.redis.connect();
                this.log('info', 'Redis connection established');
            }
        } catch (error) {
            this.log('warn', 'Redis connection failed, continuing without cache', { error: error.message });
            this.redis = null;
        }
    }

    initializeMonitoringRules() {
        // Default monitoring rules - can be extended via config
        this.monitoringRules.set('afk_detection', {
            condition: (stats) => stats.lastActivity && (Date.now() - stats.lastActivity) > 300000, // 5 minutes
            action: (userId) => this.sendPersonalizedMessage(userId, 'afk_reminder'),
            priority: 'low'
        });

        this.monitoringRules.set('skill_improvement', {
            condition: (stats, prevStats) => stats.level > (prevStats?.level || 0),
            action: (userId) => this.sendPersonalizedMessage(userId, 'level_up_congratulation'),
            priority: 'medium'
        });

        this.monitoringRules.set('tutorial_progress', {
            condition: (stats) => stats.tutorialStep && stats.tutorialStep % 5 === 0,
            action: (userId) => this.sendPersonalizedMessage(userId, 'tutorial_milestone'),
            priority: 'high'
        });

        // Add custom rules from config
        if (this.config.monitoringRules) {
            Object.entries(this.config.monitoringRules).forEach(([key, rule]) => {
                this.monitoringRules.set(key, rule);
            });
        }
    }

    startScheduledTasks() {
        // Clean up old data (GDPR compliance)
        cron.schedule('0 2 * * *', async () => { // Daily at 2 AM
            await this.cleanupOldData();
        });

        // Send offline nudges
        cron.schedule('0 */6 * * *', async () => { // Every 6 hours
            await this.sendOfflineNudges();
        });

        // Health monitoring
        cron.schedule('*/5 * * * *', async () => { // Every 5 minutes
            await this.performHealthCheck();
        });
    }

    // #endregion

    // #region User Management

    async subscribeUser(userId, socket, consentGiven = false, userData = {}) {
        try {
            // Check GDPR compliance
            if (this.config.userConsentRequired && !consentGiven) {
                this.log('warn', 'User subscription rejected - no consent', { userId });
                socket.emit('shadowwatch_error', {
                    type: 'consent_required',
                    message: 'ShadowWatch AI requires user consent for monitoring'
                });
                return false;
            }

            // Check concurrent user limit
            if (this.connectedUsers.size >= this.config.maxConcurrentUsers) {
                this.log('warn', 'Max concurrent users reached', { userId, currentUsers: this.connectedUsers.size });
                socket.emit('shadowwatch_error', {
                    type: 'server_full',
                    message: 'ShadowWatch AI is at capacity'
                });
                return false;
            }

            // Create user session
            const sessionId = crypto.randomUUID();
            const sessionData = {
                userId,
                socket,
                sessionId,
                connectedAt: new Date(),
                lastActivity: new Date(),
                consentGiven,
                userData,
                stats: {},
                tutorialProgress: {},
                heartbeatCount: 0
            };

            // Store in memory and database
            this.connectedUsers.set(userId, sessionData);
            await this.saveUserSession(sessionData);

            // Setup socket event handlers
            this.setupSocketHandlers(socket, userId);

            // Start heartbeat monitoring
            this.startHeartbeatMonitoring(userId);

            // Send welcome message
            await this.sendPersonalizedGreeting(userId);

            this.metrics.activeUsers = this.connectedUsers.size;
            this.log('info', 'User subscribed to ShadowWatch', { userId, sessionId });

            return true;
        } catch (error) {
            this.log('error', 'Failed to subscribe user', { userId, error: error.message });
            return false;
        }
    }

    async unsubscribeUser(userId) {
        try {
            const session = this.connectedUsers.get(userId);
            if (!session) return;

            // Clean up session
            session.socket.removeAllListeners('stats_change');
            session.socket.removeAllListeners('heartbeat');
            session.socket.removeAllListeners('disconnect');

            // Update session end time
            await this.updateUserSession(session.sessionId, { endedAt: new Date() });

            // Remove from memory
            this.connectedUsers.delete(userId);

            this.metrics.activeUsers = this.connectedUsers.size;
            this.log('info', 'User unsubscribed from ShadowWatch', { userId });

        } catch (error) {
            this.log('error', 'Failed to unsubscribe user', { userId, error: error.message });
        }
    }

    setupSocketHandlers(socket, userId) {
        const session = this.connectedUsers.get(userId);
        if (!session) return;

        // Stats change monitoring
        socket.on('stats_change', async (data) => {
            await this.monitorStatsChange(userId, data.actionType, data.stats);
        });

        // Heartbeat for connection monitoring
        socket.on('heartbeat', () => {
            session.lastActivity = new Date();
            session.heartbeatCount++;
        });

        // Tutorial events
        socket.on('tutorial_step', async (data) => {
            await this.updateTutorialProgress(userId, data.step, data.completed);
        });

        // Attack training events
        socket.on('training_action', async (data) => {
            await this.processTrainingAction(userId, data);
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            this.unsubscribeUser(userId);
        });
    }

    startHeartbeatMonitoring(userId) {
        const interval = setInterval(async () => {
            const session = this.connectedUsers.get(userId);
            if (!session) {
                clearInterval(interval);
                return;
            }

            const timeSinceLastActivity = Date.now() - session.lastActivity.getTime();
            if (timeSinceLastActivity > this.config.heartbeatInterval * 2000) { // 2x interval
                this.log('warn', 'User heartbeat timeout', { userId, timeSinceLastActivity });
                await this.unsubscribeUser(userId);
                clearInterval(interval);
            }
        }, this.config.heartbeatInterval * 1000);

        // Store interval reference for cleanup
        const session = this.connectedUsers.get(userId);
        if (session) {
            session.heartbeatInterval = interval;
        }
    }

    // #endregion

    // #region Monitoring & AI Logic

    async monitorStatsChange(userId, actionType, newStats) {
        try {
            const session = this.connectedUsers.get(userId);
            if (!session) return;

            const prevStats = { ...session.stats };
            session.stats = { ...session.stats, ...newStats, lastActivity: Date.now() };
            session.lastActivity = new Date();

            // Log activity (encrypted)
            await this.logActivity(userId, actionType, newStats, prevStats);

            // Apply monitoring rules
            for (const [ruleName, rule] of this.monitoringRules) {
                try {
                    if (rule.condition(session.stats, prevStats)) {
                        await rule.action(userId, session.stats, prevStats);
                    }
                } catch (error) {
                    this.log('error', 'Rule execution failed', { ruleName, userId, error: error.message });
                }
            }

            // Cache updated stats if Redis available
            if (this.redis) {
                await this.redis.setEx(`user_stats:${userId}`, 3600, JSON.stringify(session.stats));
            }

        } catch (error) {
            this.log('error', 'Stats monitoring failed', { userId, actionType, error: error.message });
        }
    }

    async sendPersonalizedMessage(userId, messageType, data = {}) {
        const session = this.connectedUsers.get(userId);
        if (!session) return;

        const messages = {
            afk_reminder: {
                type: 'reminder',
                title: 'Still there?',
                message: 'You seem to be away. Would you like to continue your adventure?',
                actions: ['continue', 'logout']
            },
            level_up_congratulation: {
                type: 'celebration',
                title: 'Level Up!',
                message: `Congratulations on reaching level ${session.stats.level}! You're doing great!`,
                actions: ['continue']
            },
            tutorial_milestone: {
                type: 'progress',
                title: 'Tutorial Progress',
                message: `You've completed ${session.stats.tutorialStep} tutorial steps! Keep it up!`,
                actions: ['continue_tutorial', 'skip_tutorial']
            },
            welcome_back: {
                type: 'greeting',
                title: 'Welcome Back!',
                message: `Good to see you again! Ready to continue your adventure?`,
                actions: ['start_game']
            }
        };

        const message = messages[messageType];
        if (message) {
            session.socket.emit('shadowwatch_message', {
                ...message,
                timestamp: new Date(),
                ...data
            });

            await this.logActivity(userId, 'ai_message_sent', { messageType, message });
        }
    }

    async sendPersonalizedGreeting(userId) {
        const session = this.connectedUsers.get(userId);
        if (!session) return;

        // Check if returning user
        const lastSession = await this.getLastUserSession(userId);
        const isReturning = lastSession && (Date.now() - lastSession.ended_at) > 86400000; // 24 hours

        if (isReturning) {
            await this.sendPersonalizedMessage(userId, 'welcome_back');
        } else {
            session.socket.emit('shadowwatch_message', {
                type: 'greeting',
                title: 'Welcome to ShadowWatch AI',
                message: 'I\'m here to guide and support your gaming experience. Let\'s make this adventure amazing!',
                actions: ['start_tutorial', 'explore_game'],
                timestamp: new Date()
            });
        }
    }

    // #endregion

    // #region Database Operations

    async saveUserSession(sessionData) {
        if (!this.db) return;

        const encryptedData = this.encryptData(sessionData);
        const query = `
            INSERT INTO user_sessions (user_id, session_id, connected_at, consent_given, session_data)
            VALUES ($1, $2, $3, $4, $5)
        `;

        await this.db.query(query, [
            sessionData.userId,
            sessionData.sessionId,
            sessionData.connectedAt,
            sessionData.consentGiven,
            encryptedData
        ]);
    }

    async updateUserSession(sessionId, updates) {
        if (!this.db) return;

        const fields = [];
        const values = [];
        let paramIndex = 1;

        Object.entries(updates).forEach(([key, value]) => {
            fields.push(`${key} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
        });

        values.push(sessionId);
        const query = `UPDATE user_sessions SET ${fields.join(', ')} WHERE session_id = $${paramIndex}`;

        await this.db.query(query, values);
    }

    async logActivity(userId, actionType, data, prevData = null) {
        if (!this.db) return;

        const encryptedData = this.encryptData({ data, prevData });
        const query = `
            INSERT INTO activity_logs (user_id, action_type, timestamp, activity_data, encrypted)
            VALUES ($1, $2, $3, $4, $5)
        `;

        await this.db.query(query, [
            userId,
            actionType,
            new Date(),
            encryptedData,
            true
        ]);
    }

    async getLastUserSession(userId) {
        if (!this.db) return null;

        const query = `
            SELECT * FROM user_sessions
            WHERE user_id = $1
            ORDER BY connected_at DESC
            LIMIT 1
        `;

        const result = await this.db.query(query, [userId]);
        return result.rows[0] || null;
    }

    async cleanupOldData() {
        if (!this.db) return;

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.config.dataRetentionDays);

        const queries = [
            'DELETE FROM activity_logs WHERE timestamp < $1',
            'DELETE FROM user_sessions WHERE connected_at < $1 AND ended_at IS NOT NULL'
        ];

        for (const query of queries) {
            await this.db.query(query, [cutoffDate]);
        }

        this.log('info', 'Old data cleanup completed', { cutoffDate });
    }

    async sendOfflineNudges() {
        if (!this.db) return;

        const nudgeCutoff = new Date();
        nudgeCutoff.setHours(nudgeCutoff.getHours() - this.config.offlineNudgeHours);

        const query = `
            SELECT DISTINCT user_id
            FROM user_sessions
            WHERE ended_at < $1
            AND user_id NOT IN (
                SELECT user_id FROM user_sessions
                WHERE ended_at IS NULL
            )
        `;

        const result = await this.db.query(query, [nudgeCutoff]);

        // In a real implementation, this would send email/push notifications
        // For now, we'll just log the users who would receive nudges
        this.log('info', 'Offline nudge candidates found', {
            count: result.rows.length,
            cutoffHours: this.config.offlineNudgeHours
        });
    }

    // #endregion

    // #region Tutorial System Integration

    async updateTutorialProgress(userId, step, completed) {
        const session = this.connectedUsers.get(userId);
        if (!session) return;

        session.tutorialProgress = {
            ...session.tutorialProgress,
            [step]: { completed, timestamp: new Date() }
        };

        await this.logActivity(userId, 'tutorial_progress', { step, completed });

        // Update tutorial system if available
        if (this.tutorialSystem) {
            this.tutorialSystem.handleTutorialProgress(userId, step, completed);
        }
    }

    // #endregion

    // #region Attack Training Integration

    async processTrainingAction(userId, actionData) {
        // Delegate to attack trainer if available
        if (this.attackTrainer) {
            this.attackTrainer.processTrainingAction(userId, actionData);
        }
    }

    // #endregion

    // #region Utility Methods

    encryptData(data) {
        const algorithm = 'aes-256-cbc';
        const key = crypto.scryptSync(this.config.encryptionKey, 'salt', 32);
        const iv = crypto.randomBytes(16);

        const cipher = crypto.createCipher(algorithm, key);
        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');

        return {
            encrypted,
            iv: iv.toString('hex'),
            algorithm
        };
    }

    decryptData(encryptedData) {
        try {
            const algorithm = 'aes-256-cbc';
            const key = crypto.scryptSync(this.config.encryptionKey, 'salt', 32);
            const iv = Buffer.from(encryptedData.iv, 'hex');

            const decipher = crypto.createDecipher(algorithm, key);
            let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return JSON.parse(decrypted);
        } catch (error) {
            this.log('error', 'Data decryption failed', { error: error.message });
            return null;
        }
    }

    async performHealthCheck() {
        const health = {
            status: 'healthy',
            timestamp: new Date(),
            metrics: this.metrics,
            connections: {
                database: this.db ? 'connected' : 'disconnected',
                redis: this.redis ? 'connected' : 'disconnected',
                activeUsers: this.connectedUsers.size
            }
        };

        // Check database
        if (this.db) {
            try {
                await this.db.query('SELECT 1');
            } catch (error) {
                health.status = 'degraded';
                health.connections.database = 'error';
            }
        }

        // Check Redis
        if (this.redis) {
            try {
                await this.redis.ping();
            } catch (error) {
                health.status = 'degraded';
                health.connections.redis = 'error';
            }
        }

        this.metrics.lastHealthCheck = new Date();
        return health;
    }

    async getGlobalInsights() {
        if (!this.db) return { error: 'Database not available' };

        const insights = {
            activeUsers: this.connectedUsers.size,
            totalSessions: 0,
            avgSessionDuration: 0,
            tutorialCompletionRate: 0,
            trainingSessionsCount: 0,
            topActivities: [],
            privacyCompliance: {
                gdprEnabled: this.config.gdprComplianceEnabled,
                dataRetentionDays: this.config.dataRetentionDays,
                encryptedLogsCount: 0
            }
        };

        try {
            // Get session statistics
            const sessionStats = await this.db.query(`
                SELECT
                    COUNT(*) as total_sessions,
                    AVG(EXTRACT(EPOCH FROM (ended_at - connected_at))) as avg_duration
                FROM user_sessions
                WHERE ended_at IS NOT NULL
            `);

            if (sessionStats.rows[0]) {
                insights.totalSessions = parseInt(sessionStats.rows[0].total_sessions);
                insights.avgSessionDuration = Math.round(sessionStats.rows[0].avg_duration / 60); // minutes
            }

            // Get activity statistics
            const activityStats = await this.db.query(`
                SELECT action_type, COUNT(*) as count
                FROM activity_logs
                GROUP BY action_type
                ORDER BY count DESC
                LIMIT 10
            `);

            insights.topActivities = activityStats.rows;

            // Get privacy compliance metrics
            const encryptedLogs = await this.db.query(`
                SELECT COUNT(*) as encrypted_count
                FROM activity_logs
                WHERE encrypted = true
            `);

            insights.privacyCompliance.encryptedLogsCount = parseInt(encryptedLogs.rows[0].encrypted_count);

        } catch (error) {
            this.log('error', 'Failed to get global insights', { error: error.message });
            return { error: 'Failed to retrieve insights' };
        }

        return insights;
    }

    log(level, message, data = {}) {
        if (this.shouldLog(level)) {
            const logEntry = {
                timestamp: new Date().toISOString(),
                level,
                message,
                ...data
            };

            console.log(`[${logEntry.timestamp}] ${level.toUpperCase()}: ${message}`, Object.keys(data).length ? data : '');
        }
    }

    shouldLog(level) {
        const levels = ['error', 'warn', 'info', 'debug'];
        const currentLevelIndex = levels.indexOf(this.config.logLevel);
        const messageLevelIndex = levels.indexOf(level);
        return messageLevelIndex <= currentLevelIndex;
    }

    getSafeConfig() {
        const safe = { ...this.config };
        delete safe.dbPassword;
        delete safe.redisPassword;
        delete safe.encryptionKey;
        return safe;
    }

    // #endregion

    // #region Cleanup

    async shutdown() {
        this.log('info', 'ShadowWatch AI shutting down');

        // Disconnect all users
        for (const [userId, session] of this.connectedUsers) {
            await this.unsubscribeUser(userId);
        }

        // Close database connection
        if (this.db) {
            await this.db.end();
        }

        // Close Redis connection
        if (this.redis) {
            await this.redis.disconnect();
        }

        this.log('info', 'ShadowWatch AI shutdown complete');
    }

    // #endregion
}

export default ShadowWatchAI;

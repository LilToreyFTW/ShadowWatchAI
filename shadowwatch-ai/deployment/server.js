/**
 * ShadowWatch AI Production Server
 * Production-ready Express.js server with ShadowWatch AI integration
 */

import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import socketIo from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ShadowWatch AI Core
import { ShadowWatchAI, AttackTrainer, TutorialSystem } from '../index.js';

class ShadowWatchServer {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:3000",
                methods: ["GET", "POST"],
                credentials: true
            },
            pingInterval: parseInt(process.env.WEBSOCKET_PING_INTERVAL) || 25000,
            pingTimeout: parseInt(process.env.WEBSOCKET_PING_TIMEOUT) || 60000
        });

        this.shadowwatch = null;
        this.attackTrainer = null;
        this.tutorialSystem = null;

        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocketHandlers();
        this.setupErrorHandling();
    }

    // #region Server Setup

    setupMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                    fontSrc: ["'self'", "https://fonts.gstatic.com"],
                    scriptSrc: ["'self'"],
                    connectSrc: ["'self'", "ws:", "wss:"]
                }
            }
        }));

        // CORS configuration
        this.app.use(cors({
            origin: process.env.FRONTEND_URL || "http://localhost:3000",
            credentials: true
        }));

        // Compression
        this.app.use(compression());

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));

        // Static files
        this.app.use(express.static(path.join(__dirname, '../docs')));
        this.app.use('/assets', express.static(path.join(__dirname, '../assets')));

        // Rate limiting would be added here in production
        // this.app.use('/api/', rateLimit({ ... }));
    }

    setupRoutes() {
        // Health check endpoint
        this.app.get('/api/health', async (req, res) => {
            try {
                const health = await this.shadowwatch?.performHealthCheck() || { status: 'initializing' };
                res.json({
                    service: 'ShadowWatch AI',
                    version: '1.0.0',
                    status: health.status || 'unknown',
                    timestamp: new Date().toISOString(),
                    ...health
                });
            } catch (error) {
                res.status(500).json({
                    service: 'ShadowWatch AI',
                    status: 'error',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Admin dashboard endpoint
        this.app.get('/api/admin/shadowwatch', async (req, res) => {
            try {
                // Basic auth check (would be more sophisticated in production)
                const authHeader = req.headers.authorization;
                if (!authHeader || !this.checkAdminAuth(authHeader)) {
                    return res.status(401).json({ error: 'Unauthorized' });
                }

                const insights = await this.shadowwatch?.getGlobalInsights() || {};
                const tutorialStats = this.tutorialSystem?.getTutorialAnalytics() || {};

                res.json({
                    timestamp: new Date().toISOString(),
                    insights,
                    tutorialStats,
                    server: {
                        uptime: process.uptime(),
                        memory: process.memoryUsage(),
                        version: process.version
                    }
                });
            } catch (error) {
                res.status(500).json({ error: 'Failed to retrieve admin data' });
            }
        });

        // User API endpoints
        this.app.post('/api/users/:userId/consent', async (req, res) => {
            try {
                const { userId } = req.params;
                const { consent, consentVersion } = req.body;

                // Update user consent in database
                // This would integrate with your user management system

                res.json({
                    success: true,
                    consent: consent,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({ error: 'Failed to update consent' });
            }
        });

        // Training API endpoints
        this.app.get('/api/training/stats/:userId', async (req, res) => {
            try {
                const { userId } = req.params;
                const stats = await this.attackTrainer?.getTrainingStats(userId);
                res.json(stats);
            } catch (error) {
                res.status(500).json({ error: 'Failed to get training stats' });
            }
        });

        this.app.post('/api/training/request', async (req, res) => {
            try {
                const { userId, preferences } = req.body;
                const result = await this.attackTrainer?.requestTrainingSession(userId, preferences);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: 'Failed to request training' });
            }
        });

        this.app.delete('/api/training/cancel/:userId', async (req, res) => {
            try {
                const { userId } = req.params;
                const result = await this.attackTrainer?.cancelTrainingRequest(userId);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: 'Failed to cancel training' });
            }
        });

        // Tutorial API endpoints
        this.app.get('/api/tutorial/status/:userId', async (req, res) => {
            try {
                const { userId } = req.params;
                const status = await this.tutorialSystem?.getTutorialStatus(userId);
                res.json(status);
            } catch (error) {
                res.status(500).json({ error: 'Failed to get tutorial status' });
            }
        });

        this.app.post('/api/tutorial/start/:userId', async (req, res) => {
            try {
                const { userId } = req.params;
                const { options } = req.body;
                const result = await this.tutorialSystem?.startTutorial(userId, 1, options);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: 'Failed to start tutorial' });
            }
        });

        this.app.post('/api/tutorial/progress/:userId', async (req, res) => {
            try {
                const { userId } = req.params;
                const { action } = req.body;
                const result = await this.tutorialSystem?.progressTutorial(userId, action);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: 'Failed to progress tutorial' });
            }
        });

        // Privacy API endpoints (GDPR compliance)
        this.app.get('/api/privacy/data/:userId', async (req, res) => {
            try {
                const { userId } = req.params;
                // Verify user identity (JWT token, session, etc.)

                // Return user's data in human-readable format
                const userData = await this.getUserDataForExport(userId);
                res.json({
                    userId,
                    exportDate: new Date().toISOString(),
                    data: userData
                });
            } catch (error) {
                res.status(500).json({ error: 'Failed to export user data' });
            }
        });

        this.app.delete('/api/privacy/data/:userId', async (req, res) => {
            try {
                const { userId } = req.params;
                // Verify user identity and consent

                // Perform GDPR-compliant data deletion
                await this.deleteUserData(userId);

                res.json({
                    success: true,
                    message: 'User data deleted successfully',
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({ error: 'Failed to delete user data' });
            }
        });

        // WebSocket upgrade endpoint
        this.app.get('/socket.io/*', (req, res) => {
            res.sendStatus(400); // WebSocket connections should use ws:// protocol
        });

        // Serve client integration files
        this.app.get('/shadowwatch-client.js', (req, res) => {
            res.sendFile(path.join(__dirname, '../shadowwatch-client.js'));
        });

        this.app.get('/shadowwatch.css', (req, res) => {
            res.sendFile(path.join(__dirname, '../docs/shadowwatch.css'));
        });

        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({ error: 'Endpoint not found' });
        });
    }

    setupWebSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);

            // Authentication handler
            socket.on('authenticate', async (data) => {
                try {
                    const { token, userId, consent } = data;

                    // Verify user authentication (integrate with your auth system)
                    const user = await this.authenticateUser(token, userId);
                    if (!user) {
                        socket.emit('authentication_failed', { reason: 'Invalid credentials' });
                        return;
                    }

                    // Subscribe user to ShadowWatch
                    const success = await this.shadowwatch?.subscribeUser(
                        userId,
                        socket,
                        consent || user.shadowwatch_consent_given
                    );

                    if (success) {
                        socket.emit('authenticated', {
                            userId,
                            shadowwatch_enabled: user.shadowwatch_enabled
                        });

                        // Send welcome message
                        setTimeout(() => {
                            this.sendWelcomeMessage(socket, user);
                        }, 1000);
                    } else {
                        socket.emit('authentication_failed', { reason: 'ShadowWatch subscription failed' });
                    }

                } catch (error) {
                    console.error('Authentication error:', error);
                    socket.emit('authentication_failed', { reason: 'Server error' });
                }
            });

            // Heartbeat handler
            socket.on('heartbeat', () => {
                socket.emit('heartbeat_ack', { timestamp: Date.now() });
            });

            // Disconnect handler
            socket.on('disconnect', (reason) => {
                console.log('Client disconnected:', socket.id, reason);
                // ShadowWatch handles user cleanup automatically
            });
        });
    }

    setupErrorHandling() {
        // Global error handler
        this.app.use((error, req, res, next) => {
            console.error('Server error:', error);
            res.status(500).json({
                error: 'Internal server error',
                timestamp: new Date().toISOString()
            });
        });

        // WebSocket error handler
        this.io.on('connection_error', (error) => {
            console.error('WebSocket connection error:', error);
        });

        // Process error handlers
        process.on('uncaughtException', (error) => {
            console.error('Uncaught Exception:', error);
            this.gracefulShutdown();
        });

        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled Rejection at:', promise, 'reason:', reason);
            this.gracefulShutdown();
        });
    }

    // #endregion

    // #region Authentication & Authorization

    async authenticateUser(token, userId) {
        // This should integrate with your authentication system
        // For now, return a mock user object
        return {
            userId,
            shadowwatch_enabled: true,
            shadowwatch_consent_given: true,
            tutorial_completed: false
        };
    }

    checkAdminAuth(authHeader) {
        // Basic auth check - replace with proper authentication
        const expectedAuth = `Basic ${Buffer.from(`${process.env.ADMIN_USERNAME || 'admin'}:${process.env.ADMIN_PASSWORD || 'password'}`).toString('base64')}`;
        return authHeader === expectedAuth;
    }

    // #endregion

    // #region Privacy & GDPR Compliance

    async getUserDataForExport(userId) {
        // Aggregate all user data for GDPR export
        const data = {
            profile: {},
            sessions: [],
            activities: [],
            tutorialProgress: {},
            trainingHistory: [],
            privacySettings: {}
        };

        // This would query all relevant tables and decrypt encrypted data
        // Implementation depends on your specific data structure

        return data;
    }

    async deleteUserData(userId) {
        // Perform GDPR-compliant data deletion
        // This should cascade delete all user data and log the deletion

        if (this.shadowwatch?.db) {
            const queries = [
                'DELETE FROM activity_logs WHERE user_id = $1',
                'DELETE FROM user_sessions WHERE user_id = $1',
                'DELETE FROM tutorial_progress WHERE user_id = $1',
                'DELETE FROM training_sessions WHERE player1_id = $1 OR player2_id = $1',
                'DELETE FROM training_queue WHERE user_id = $1',
                'DELETE FROM ai_insights_cache WHERE user_id = $1',
                'UPDATE users SET shadowwatch_enabled = false, shadowwatch_consent_given = NULL WHERE user_id = $1'
            ];

            for (const query of queries) {
                await this.shadowwatch.db.query(query, [userId]);
            }
        }

        // Log the deletion for audit purposes
        console.log(`GDPR data deletion completed for user: ${userId}`);
    }

    // #endregion

    // #region WebSocket Communication

    sendWelcomeMessage(socket, user) {
        const welcomeData = {
            type: 'welcome',
            message: 'Welcome to ShadowWatch AI!',
            features: [
                'Real-time activity monitoring',
                'Personalized guidance',
                'Safe PvP training',
                'Interactive tutorials'
            ],
            user: {
                shadowwatch_enabled: user.shadowwatch_enabled,
                tutorial_completed: user.tutorial_completed
            }
        };

        socket.emit('shadowwatch_message', welcomeData);
    }

    // #endregion

    // #region Server Lifecycle

    async initializeShadowWatch() {
        try {
            // Initialize core ShadowWatch AI
            this.shadowwatch = new ShadowWatchAI();

            // Initialize subsystems
            this.attackTrainer = new AttackTrainer(this.shadowwatch);
            this.tutorialSystem = new TutorialSystem(this.shadowwatch);

            // Link subsystems
            this.shadowwatch.attackTrainer = this.attackTrainer;
            this.shadowwatch.tutorialSystem = this.tutorialSystem;

            console.log('✅ ShadowWatch AI initialized successfully');

        } catch (error) {
            console.error('❌ Failed to initialize ShadowWatch AI:', error);
            throw error;
        }
    }

    async start(port = process.env.PORT || 3000) {
        try {
            // Initialize ShadowWatch AI first
            await this.initializeShadowWatch();

            // Start server
            this.server.listen(port, () => {
                console.log(`🚀 ShadowWatch AI Server running on port ${port}`);
                console.log(`📊 Health check: http://localhost:${port}/api/health`);
                console.log(`🔧 Admin dashboard: http://localhost:${port}/api/admin/shadowwatch`);
                console.log(`🌐 WebSocket endpoint: ws://localhost:${port}`);
            });

        } catch (error) {
            console.error('❌ Failed to start server:', error);
            process.exit(1);
        }
    }

    async gracefulShutdown() {
        console.log('🛑 Received shutdown signal, closing server gracefully...');

        // Stop accepting new connections
        this.server.close(async () => {
            console.log('✅ HTTP server closed');

            // Shutdown ShadowWatch AI
            if (this.shadowwatch) {
                await this.shadowwatch.shutdown();
            }

            // Close database connections
            if (this.shadowwatch?.db) {
                await this.shadowwatch.db.end();
            }

            // Close Redis connections
            if (this.shadowwatch?.redis) {
                await this.shadowwatch.redis.disconnect();
            }

            console.log('✅ ShadowWatch AI shutdown complete');
            process.exit(0);
        });

        // Force shutdown after timeout
        setTimeout(() => {
            console.error('❌ Forced shutdown due to timeout');
            process.exit(1);
        }, 10000);
    }

    // #endregion
}

// Start server if called directly
if (require.main === module) {
    const server = new ShadowWatchServer();

    // Graceful shutdown handlers
    process.on('SIGTERM', () => server.gracefulShutdown());
    process.on('SIGINT', () => server.gracefulShutdown());

    server.start();
}

export default ShadowWatchServer;

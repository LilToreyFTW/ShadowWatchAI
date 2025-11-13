#!/usr/bin/env node

/**
 * ShadowWatch AI Website Server
 * Windows-compatible development server for hosting the marketing website
 * and proxying API requests to ShadowWatch AI backend
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Cursor API Integration
import CursorAPIIntegration from './cursor-api-integration.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

class ShadowWatchWebsiteServer {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 8080;
        this.apiPort = process.env.API_PORT || 3000;
        this.isDevelopment = process.env.NODE_ENV !== 'production';

        // Initialize Cursor API Integration
        this.cursorAPI = new CursorAPIIntegration();

        this.setupMiddleware();
        this.setupRoutes();
        this.setupCursorAPIRoutes();
        this.setupAPIProxy();
        this.setupErrorHandling();
    }

    setupCursorAPIRoutes() {
        // Cursor AI Control API Endpoints

        // List all agents
        this.app.get('/api/cursor/agents', async (req, res) => {
            try {
                const limit = parseInt(req.query.limit) || 20;
                const cursor = req.query.cursor;
                const data = await this.cursorAPI.listAgents(limit, cursor);
                res.json(data);
            } catch (error) {
                res.status(500).json({ error: 'Failed to list agents', details: error.message });
            }
        });

        // Get agent status
        this.app.get('/api/cursor/agents/:id', async (req, res) => {
            try {
                const data = await this.cursorAPI.getAgentStatus(req.params.id);
                res.json(data);
            } catch (error) {
                res.status(500).json({ error: 'Failed to get agent status', details: error.message });
            }
        });

        // Get agent conversation
        this.app.get('/api/cursor/agents/:id/conversation', async (req, res) => {
            try {
                const data = await this.cursorAPI.getAgentConversation(req.params.id);
                res.json(data);
            } catch (error) {
                res.status(500).json({ error: 'Failed to get agent conversation', details: error.message });
            }
        });

        // Launch new agent
        this.app.post('/api/cursor/agents', async (req, res) => {
            try {
                const { prompt, options } = req.body;
                if (!prompt) {
                    return res.status(400).json({ error: 'Prompt is required' });
                }

                // Log which model is being used
                const modelUsed = options?.model || 'AUTO';
                console.log(`🚀 Launching agent with model: ${modelUsed}`);

                const data = await this.cursorAPI.launchAgent(prompt, options);
                res.json(data);
            } catch (error) {
                res.status(500).json({ error: 'Failed to launch agent', details: error.message });
            }
        });

        // Add followup to agent
        this.app.post('/api/cursor/agents/:id/followup', async (req, res) => {
            try {
                const { prompt, images } = req.body;
                if (!prompt) {
                    return res.status(400).json({ error: 'Followup prompt is required' });
                }
                const data = await this.cursorAPI.addFollowup(req.params.id, prompt, images);
                res.json(data);
            } catch (error) {
                res.status(500).json({ error: 'Failed to add followup', details: error.message });
            }
        });

        // Delete agent
        this.app.delete('/api/cursor/agents/:id', async (req, res) => {
            try {
                const data = await this.cursorAPI.deleteAgent(req.params.id);
                res.json(data);
            } catch (error) {
                res.status(500).json({ error: 'Failed to delete agent', details: error.message });
            }
        });

        // Get API key info
        this.app.get('/api/cursor/me', async (req, res) => {
            try {
                const data = await this.cursorAPI.getAPIKeyInfo();
                res.json(data);
            } catch (error) {
                res.status(500).json({ error: 'Failed to get API key info', details: error.message });
            }
        });

        // List available models
        this.app.get('/api/cursor/models', async (req, res) => {
            try {
                const data = await this.cursorAPI.listModels();
                res.json(data);
            } catch (error) {
                res.status(500).json({ error: 'Failed to list models', details: error.message });
            }
        });

        // List repositories
        this.app.get('/api/cursor/repositories', async (req, res) => {
            try {
                const data = await this.cursorAPI.listRepositories();
                res.json(data);
            } catch (error) {
                res.status(500).json({ error: 'Failed to list repositories', details: error.message });
            }
        });

        // ShadowWatch AI Development Commands
        this.app.post('/api/cursor/develop-feature', async (req, res) => {
            try {
                const { feature } = req.body;
                if (!feature) {
                    return res.status(400).json({ error: 'Feature description is required' });
                }
                const data = await this.cursorAPI.developFeature(feature);
                res.json(data);
            } catch (error) {
                res.status(500).json({ error: 'Failed to develop feature', details: error.message });
            }
        });

        this.app.post('/api/cursor/fix-bug', async (req, res) => {
            try {
                const { bug } = req.body;
                if (!bug) {
                    return res.status(400).json({ error: 'Bug description is required' });
                }
                const data = await this.cursorAPI.fixBug(bug);
                res.json(data);
            } catch (error) {
                res.status(500).json({ error: 'Failed to fix bug', details: error.message });
            }
        });

        this.app.post('/api/cursor/improve-performance', async (req, res) => {
            try {
                const { issue } = req.body;
                if (!issue) {
                    return res.status(400).json({ error: 'Performance issue description is required' });
                }
                const data = await this.cursorAPI.improvePerformance(issue);
                res.json(data);
            } catch (error) {
                res.status(500).json({ error: 'Failed to improve performance', details: error.message });
            }
        });

        this.app.post('/api/cursor/add-tests', async (req, res) => {
            try {
                const { tests } = req.body;
                if (!tests) {
                    return res.status(400).json({ error: 'Test description is required' });
                }
                const data = await this.cursorAPI.addTests(tests);
                res.json(data);
            } catch (error) {
                res.status(500).json({ error: 'Failed to add tests', details: error.message });
            }
        });

        this.app.post('/api/cursor/refactor', async (req, res) => {
            try {
                const { refactor } = req.body;
                if (!refactor) {
                    return res.status(400).json({ error: 'Refactoring description is required' });
                }
                const data = await this.cursorAPI.refactorCode(refactor);
                res.json(data);
            } catch (error) {
                res.status(500).json({ error: 'Failed to refactor code', details: error.message });
            }
        });

        this.app.post('/api/cursor/update-docs', async (req, res) => {
            try {
                const { docs } = req.body;
                if (!docs) {
                    return res.status(400).json({ error: 'Documentation update description is required' });
                }
                const data = await this.cursorAPI.updateDocumentation(docs);
                res.json(data);
            } catch (error) {
                res.status(500).json({ error: 'Failed to update documentation', details: error.message });
            }
        });

        // Agent monitoring
        this.app.get('/api/cursor/monitor', async (req, res) => {
            try {
                await this.cursorAPI.monitorAgents();
                const stats = this.cursorAPI.getAgentStats();
                res.json(stats);
            } catch (error) {
                res.status(500).json({ error: 'Failed to monitor agents', details: error.message });
            }
        });

        // ================================================
        // AUTONOMOUS DEVELOPMENT ENDPOINTS
        // ================================================

        // Enable autonomous development mode
        this.app.post('/api/cursor/autonomous/enable', async (req, res) => {
            try {
                const result = await this.cursorAPI.enableAutonomousMode(req.body);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: 'Failed to enable autonomous mode', details: error.message });
            }
        });

        // Enable ULTRA-MAXIMUM autonomous development mode
        this.app.post('/api/cursor/autonomous/enable-ultra-maximum', async (req, res) => {
            try {
                console.log('🚀🚀🚀 RECEIVED ULTRA-MAXIMUM AUTONOMOUS MODE REQUEST! 🚀🚀🚀');
                const result = await this.cursorAPI.enableUltraMaximumAutonomousMode();
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: 'Failed to enable ultra-maximum autonomous mode', details: error.message });
            }
        });

        // Disable autonomous development mode
        this.app.post('/api/cursor/autonomous/disable', async (req, res) => {
            try {
                const result = this.cursorAPI.disableAutonomousMode();
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: 'Failed to disable autonomous mode', details: error.message });
            }
        });

        // Get autonomous development status
        this.app.get('/api/cursor/autonomous/status', async (req, res) => {
            try {
                const status = this.cursorAPI.getAutonomousStatus();
                res.json(status);
            } catch (error) {
                res.status(500).json({ error: 'Failed to get autonomous status', details: error.message });
            }
        });

        // Force development cycle
        this.app.post('/api/cursor/autonomous/force-cycle', async (req, res) => {
            try {
                const result = await this.cursorAPI.forceDevelopmentCycle();
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: 'Failed to force development cycle', details: error.message });
            }
        });

        // Clear development queue
        this.app.post('/api/cursor/autonomous/clear-queue', async (req, res) => {
            try {
                const result = this.cursorAPI.clearDevelopmentQueue();
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: 'Failed to clear development queue', details: error.message });
            }
        });

        // Reset autonomous development
        this.app.post('/api/cursor/autonomous/reset', async (req, res) => {
            try {
                const result = await this.cursorAPI.resetAutonomousDevelopment();
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: 'Failed to reset autonomous development', details: error.message });
            }
        });

        // ================================================
        // UNITY & UNREAL ENGINE ENDPOINTS
        // ================================================

        // Initialize Unity support
        this.app.post('/api/cursor/unity/init', async (req, res) => {
            try {
                const { version } = req.body;
                const result = await this.cursorAPI.initializeUnitySupport(version);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: 'Failed to initialize Unity support', details: error.message });
            }
        });

        // Initialize Unreal Engine support
        this.app.post('/api/cursor/unreal/init', async (req, res) => {
            try {
                const { version } = req.body;
                const result = await this.cursorAPI.initializeUnrealSupport(version);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: 'Failed to initialize Unreal support', details: error.message });
            }
        });

        // ================================================
        // WEAPON BLUEPRINT & MODEL ENDPOINTS
        // ================================================

        // Create weapon blueprint and model
        this.app.post('/api/cursor/weapons/create', async (req, res) => {
            try {
                const { weaponName, weaponType, engineType } = req.body;
                if (!weaponName || !weaponType) {
                    return res.status(400).json({ error: 'Weapon name and type are required' });
                }

                const result = await this.cursorAPI.createWeaponBlueprint(weaponName, weaponType, engineType);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: 'Failed to create weapon blueprint', details: error.message });
            }
        });

        // Create weapon model pack
        this.app.post('/api/cursor/weapons/pack', async (req, res) => {
            try {
                const { packName, weapons } = req.body;
                if (!packName || !weapons || !Array.isArray(weapons)) {
                    return res.status(400).json({ error: 'Pack name and weapons array are required' });
                }

                const result = await this.cursorAPI.createWeaponModelPack(packName, weapons);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: 'Failed to create weapon pack', details: error.message });
            }
        });

        // ================================================
        // VEHICLE BLUEPRINT & MODEL ENDPOINTS
        // ================================================

        // Create vehicle blueprint and model
        this.app.post('/api/cursor/vehicles/create', async (req, res) => {
            try {
                const { vehicleName, vehicleType, engineType } = req.body;
                if (!vehicleName || !vehicleType) {
                    return res.status(400).json({ error: 'Vehicle name and type are required' });
                }

                const result = await this.cursorAPI.createVehicleBlueprint(vehicleName, vehicleType, engineType);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: 'Failed to create vehicle blueprint', details: error.message });
            }
        });

        // Create vehicle model pack
        this.app.post('/api/cursor/vehicles/pack', async (req, res) => {
            try {
                const { packName, vehicles } = req.body;
                if (!packName || !vehicles || !Array.isArray(vehicles)) {
                    return res.status(400).json({ error: 'Pack name and vehicles array are required' });
                }

                const result = await this.cursorAPI.createVehicleModelPack(packName, vehicles);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: 'Failed to create vehicle pack', details: error.message });
            }
        });

        // ================================================
        // MODEL ORGANIZATION ENDPOINTS
        // ================================================

        // Create model directory structure
        this.app.post('/api/cursor/models/structure', async (req, res) => {
            try {
                await this.cursorAPI.createModelDirectoryStructure();
                res.json({ status: 'structure-created', message: 'Model directory structure created' });
            } catch (error) {
                res.status(500).json({ error: 'Failed to create model structure', details: error.message });
            }
        });

        // ================================================
        // ANTI-HACKER PROTECTION ENDPOINTS
        // ================================================

        // Get security status
        this.app.get('/api/cursor/security/status', async (req, res) => {
            try {
                const status = {
                    antiHackerProtection: this.cursorAPI.antiHackerProtection,
                    securityLog: this.cursorAPI.securityLog,
                    lastScan: new Date().toISOString()
                };
                res.json(status);
            } catch (error) {
                res.status(500).json({ error: 'Failed to get security status', details: error.message });
            }
        });

        // Force security scan
        this.app.post('/api/cursor/security/scan', async (req, res) => {
            try {
                await this.cursorAPI.performHackerDetection();
                res.json({ status: 'scan-completed', message: 'Security scan completed' });
            } catch (error) {
                res.status(500).json({ error: 'Failed to perform security scan', details: error.message });
            }
        });

        // Agent history
        this.app.get('/api/cursor/history', (req, res) => {
            try {
                const history = this.cursorAPI.exportAgentHistory();
                res.json(history);
            } catch (error) {
                res.status(500).json({ error: 'Failed to export history', details: error.message });
            }
        });

        // Batch operations
        this.app.post('/api/cursor/batch', async (req, res) => {
            try {
                const { operations } = req.body;
                if (!Array.isArray(operations)) {
                    return res.status(400).json({ error: 'Operations must be an array' });
                }
                const results = await this.cursorAPI.batchOperation(operations);
                res.json(results);
            } catch (error) {
                res.status(500).json({ error: 'Failed to execute batch operations', details: error.message });
            }
        });
    }

    setupMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                    fontSrc: ["'self'", "https://fonts.gstatic.com"],
                    scriptSrc: ["'self'", "'unsafe-inline'"],
                    connectSrc: ["'self'", "ws:", "wss:", "http://localhost:*"],
                    imgSrc: ["'self'", "data:", "https:"]
                }
            }
        }));

        // CORS configuration
        this.app.use(cors({
            origin: process.env.CORS_ORIGIN || "http://localhost:8080",
            credentials: true
        }));

        // Compression
        this.app.use(compression());

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));

        // Static files with cache control
        this.app.use(express.static(path.join(__dirname), {
            maxAge: this.isDevelopment ? 0 : '1d',
            etag: true
        }));

        console.log('🔧 Middleware configured');
    }

    setupRoutes() {
        // Health check for website server
        this.app.get('/health', (req, res) => {
            res.json({
                service: 'ShadowWatch AI Website',
                version: '1.0.0',
                status: 'healthy',
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'development',
                port: this.port
            });
        });

        // API status check
        this.app.get('/api-status', async (req, res) => {
            try {
                // Check if ShadowWatch AI API is running
                const apiUrl = `http://localhost:${this.apiPort}/api/health`;

                const response = await fetch(apiUrl, {
                    timeout: 5000,
                    headers: {
                        'User-Agent': 'ShadowWatch-Website-Server/1.0'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    res.json({
                        api_available: true,
                        api_status: data.status,
                        api_version: data.version,
                        message: 'ShadowWatch AI API is running'
                    });
                } else {
                    res.json({
                        api_available: false,
                        message: 'ShadowWatch AI API is not responding',
                        suggestion: 'Start the API server with: cd ../shadowwatch-ai && npm start'
                    });
                }
            } catch (error) {
                res.json({
                    api_available: false,
                    message: 'ShadowWatch AI API is not running',
                    error: error.message,
                    suggestion: 'Start the API server with: cd ../shadowwatch-ai && npm start'
                });
            }
        });

        // Serve documentation files
        this.app.get('/docs/:filename', (req, res) => {
            const filename = req.params.filename;
            const filePath = path.join(__dirname, filename);

            if (fs.existsSync(filePath) && filename.endsWith('.txt')) {
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                res.sendFile(filePath);
            } else {
                res.status(404).json({ error: 'Documentation file not found' });
            }
        });

        // Download links for implementation files
        this.app.get('/download/:filename', (req, res) => {
            const filename = req.params.filename;
            const allowedFiles = [
                'implementation-guide.txt',
                'cursor-prompt.txt',
                'package.json'
            ];

            if (allowedFiles.includes(filename)) {
                const filePath = path.join(__dirname, filename);
                if (fs.existsSync(filePath)) {
                    res.download(filePath);
                } else {
                    res.status(404).json({ error: 'File not found' });
                }
            } else {
                res.status(403).json({ error: 'File not available for download' });
            }
        });

        // Cursor AI Control Panel
        this.app.get('/cursor-control', (req, res) => {
            res.sendFile(path.join(__dirname, 'cursor-control.html'));
        });

        // Demo API endpoints for testing
        this.app.get('/api/demo/stats', (req, res) => {
            res.json({
                active_users: Math.floor(Math.random() * 10000) + 5000,
                total_sessions: Math.floor(Math.random() * 100000) + 50000,
                avg_response_time: Math.floor(Math.random() * 50) + 25,
                server_health: 'excellent',
                timestamp: new Date().toISOString()
            });
        });

        // Purchase simulation endpoint
        this.app.post('/api/purchase', (req, res) => {
            const { plan, email } = req.body;

            if (!plan || !email) {
                return res.status(400).json({
                    success: false,
                    error: 'Plan and email are required'
                });
            }

            // Simulate purchase processing
            setTimeout(() => {
                const licenseKey = `SW-${plan.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

                res.json({
                    success: true,
                    message: 'Purchase successful!',
                    license_key: licenseKey,
                    download_links: {
                        source_code: `/download/source-${licenseKey}.zip`,
                        documentation: '/docs/implementation-guide.txt',
                        cursor_prompt: '/docs/cursor-prompt.txt'
                    },
                    next_steps: [
                        'Check your email for license details',
                        'Download the implementation guide',
                        'Follow the step-by-step integration instructions',
                        'Use the Cursor prompt for automated integration'
                    ]
                });
            }, 2000); // Simulate processing time
        });

        // Main website route - serve index.html for all non-API routes
        this.app.get('*', (req, res) => {
            // Skip API routes
            if (req.path.startsWith('/api/')) {
                return res.status(404).json({ error: 'API endpoint not found' });
            }

            res.sendFile(path.join(__dirname, 'index.html'));
        });
    }

    setupAPIProxy() {
        // Proxy API requests to ShadowWatch AI backend if available
        try {
            this.app.use('/api/shadowwatch', createProxyMiddleware({
                target: `http://localhost:${this.apiPort}`,
                changeOrigin: true,
                pathRewrite: {
                    '^/api/shadowwatch': '/api'
                },
                onError: (err, req, res) => {
                    console.log('🔄 API proxy error - ShadowWatch AI backend not available');
                    res.status(503).json({
                        error: 'ShadowWatch AI API is not available',
                        message: 'The full API functionality requires running the ShadowWatch AI server',
                        suggestion: 'Start the API server with: cd ../shadowwatch-ai && npm start'
                    });
                }
            }));

            console.log('🔄 API proxy configured for ShadowWatch AI backend');
        } catch (error) {
            console.log('⚠️  API proxy not available - http-proxy-middleware not installed');
        }
    }

    setupErrorHandling() {
        // 404 handler
        this.app.use((req, res) => {
            if (req.path.startsWith('/api/')) {
                res.status(404).json({
                    error: 'API endpoint not found',
                    message: 'This is a website server. For full API functionality, start the ShadowWatch AI backend.'
                });
            } else {
                res.status(404).sendFile(path.join(__dirname, '404.html'));
            }
        });

        // Global error handler
        this.app.use((error, req, res, next) => {
            console.error('🌐 Website server error:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: this.isDevelopment ? error.message : 'Something went wrong',
                timestamp: new Date().toISOString()
            });
        });

        console.log('🛡️  Error handling configured');
    }

    async checkAPIServer() {
        try {
            const response = await fetch(`http://localhost:${this.apiPort}/api/health`, {
                timeout: 3000
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ ShadowWatch AI API detected:', data.version);
                return true;
            }
        } catch (error) {
            // API not available - this is fine for website-only mode
        }

        console.log('⚠️  ShadowWatch AI API not detected - running in website-only mode');
        return false;
    }

    async start() {
        try {
            // Check if API server is available
            const apiAvailable = await this.checkAPIServer();

            // Start the website server
            const server = this.app.listen(this.port, '0.0.0.0', () => {
                console.log('\n🌙 ShadowWatch AI Website Server Started!');
                console.log('================================================');
                console.log(`🌐 Website:     http://localhost:${this.port}`);
                console.log(`🏥 Health:      http://localhost:${this.port}/health`);
                console.log(`📊 API Status:  http://localhost:${this.port}/api-status`);

                if (apiAvailable) {
                    console.log(`🔗 Full API:    http://localhost:${this.apiPort}`);
                    console.log('✅ ShadowWatch AI backend is running');
                } else {
                    console.log('⚠️  ShadowWatch AI backend not detected');
                    console.log('   For full functionality, start the API server:');
                    console.log('   cd ../shadowwatch-ai && npm start');
                }

                console.log('================================================');
                console.log('Press Ctrl+C to stop the server');
                console.log('');

                // Open browser automatically on Windows
                if (process.platform === 'win32') {
                    const { exec } = require('child_process');
                    exec(`start http://localhost:${this.port}`, (error) => {
                        if (error) {
                            console.log('💡 Open your browser and navigate to:', `http://localhost:${this.port}`);
                        }
                    });
                }
            });

            // Graceful shutdown
            process.on('SIGINT', () => {
                console.log('\n🛑 Shutting down ShadowWatch AI Website Server...');
                server.close(() => {
                    console.log('✅ Website server stopped');
                    process.exit(0);
                });
            });

            process.on('SIGTERM', () => {
                console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
                server.close(() => {
                    console.log('✅ Website server stopped');
                    process.exit(0);
                });
            });

        } catch (error) {
            console.error('❌ Failed to start website server:', error);
            process.exit(1);
        }
    }
}

// Start the server if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const server = new ShadowWatchWebsiteServer();
    server.start();
}

export default ShadowWatchWebsiteServer;

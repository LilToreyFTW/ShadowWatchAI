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
import session from 'express-session';
import cookieParser from 'cookie-parser';
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

        // ================================================
        // OPENAI API MANAGEMENT ENDPOINTS
        // ================================================

        // Set OpenAI API key
        this.app.post('/api/openai/set-key', async (req, res) => {
            try {
                const { apiKey } = req.body;

                if (!apiKey || !apiKey.startsWith('sk-')) {
                    return res.status(400).json({ error: 'Invalid OpenAI API key format' });
                }

                const result = this.cursorAPI.setOpenAIKey(apiKey);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: 'Failed to set OpenAI API key', details: error.message });
            }
        });

        // Toggle AI provider
        this.app.post('/api/ai/toggle-provider', async (req, res) => {
            try {
                const { useOpenAI } = req.body;

                if (typeof useOpenAI !== 'boolean') {
                    return res.status(400).json({ error: 'useOpenAI must be a boolean' });
                }

                const result = this.cursorAPI.setAIProvider(useOpenAI);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: 'Failed to toggle AI provider', details: error.message });
            }
        });

        // Get AI provider status
        this.app.get('/api/ai/provider-status', async (req, res) => {
            try {
                const status = this.cursorAPI.getAIProviderStatus();
                res.json(status);
            } catch (error) {
                res.status(500).json({ error: 'Failed to get AI provider status', details: error.message });
            }
        });

        // Test OpenAI connection
        this.app.post('/api/openai/test', async (req, res) => {
            try {
                if (!this.cursorAPI.openaiApiKey) {
                    return res.status(400).json({ error: 'OpenAI API key not configured' });
                }

                const testPrompt = 'Hello! Please respond with a simple greeting to confirm the API is working.';
                const result = await this.cursorAPI.callOpenAI(testPrompt, { maxTokens: 100 });

                res.json({
                    success: true,
                    message: 'OpenAI API connection successful',
                    response: result.content.substring(0, 200) + '...'
                });
            } catch (error) {
                res.status(500).json({ error: 'OpenAI API test failed', details: error.message });
            }
        });

        // ================================================
        // VEHICLE MANUFACTURER CREATION ENDPOINTS
        // ================================================

        // Create single vehicle
        this.app.post('/api/cursor/vehicles/create', async (req, res) => {
            try {
                const { manufacturer, model, engineType = 'unreal' } = req.body;

                if (!manufacturer || !model) {
                    return res.status(400).json({ error: 'Manufacturer and model are required' });
                }

                const result = await this.cursorAPI.createVehicleBlueprint(manufacturer, model, engineType);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: 'Failed to create vehicle', details: error.message });
            }
        });

        // Create manufacturer pack
        this.app.post('/api/cursor/vehicles/pack', async (req, res) => {
            try {
                const { manufacturer, engineType = 'unreal' } = req.body;

                if (!manufacturer) {
                    return res.status(400).json({ error: 'Manufacturer is required' });
                }

                const result = await this.cursorAPI.createManufacturerVehiclePack(manufacturer, engineType);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: 'Failed to create manufacturer pack', details: error.message });
            }
        });

        // Create all manufacturers
        this.app.post('/api/cursor/vehicles/all-manufacturers', async (req, res) => {
            try {
                const { engineType = 'unreal' } = req.body;

                // Start the massive operation asynchronously
                this.cursorAPI.createAllManufacturerVehiclePacks(engineType).then(result => {
                    console.log('All manufacturer vehicle packs created successfully');
                }).catch(error => {
                    console.error('Failed to create all manufacturer packs:', error);
                });

                res.json({
                    success: true,
                    message: 'Massive vehicle creation started for all 50+ manufacturers',
                    status: 'processing'
                });
            } catch (error) {
                res.status(500).json({ error: 'Failed to start massive vehicle creation', details: error.message });
            }
        });

        // ================================================
        // DOWNLOAD ENDPOINTS
        // ================================================

        // Serve ShadowWatchAI-Software.zip download
        this.app.get('/download/ShadowWatchAI-Software.zip', (req, res) => {
            try {
                const zipPath = path.join(__dirname, 'download', 'ShadowWatchAI-Software.zip');

                // Check if the ZIP file exists
                if (fs.existsSync(zipPath)) {
                    // Serve the actual ZIP file
                    res.setHeader('Content-Type', 'application/zip');
                    res.setHeader('Content-Disposition', 'attachment; filename="ShadowWatchAI-Software.zip"');

                    const fileStream = fs.createReadStream(zipPath);
                    fileStream.pipe(res);

                    fileStream.on('error', (error) => {
                        res.status(500).json({ error: 'File read error', details: error.message });
                    });
                } else {
                    // Fallback: create a placeholder message
                    res.setHeader('Content-Type', 'application/zip');
                    res.setHeader('Content-Disposition', 'attachment; filename="ShadowWatchAI-Software.zip"');

                    const downloadMessage = `
ShadowWatchAI-Software Package
=============================

This is a placeholder for the ShadowWatchAI-Software.zip download.

The actual ZIP file is not available at this time. Please visit the
GitHub repository to download the ShadowWatchAI-Software folder directly.

Contents should include:
- core/server.js (AI server)
- core/cursor-api-integration.js (AI integration)
- models/ (generated assets directory)
- scripts/start-server.js (startup script)
- scripts/setup.js (setup script)
- config/default-config.json (configuration)
- docs/README.md (documentation)
- docs/setup-guide.md (setup guide)
- Start-ShadowWatchAI.bat (Windows launcher)
- package.json (dependencies)
- index.html (landing page)

For installation instructions, visit: /documentation.html

Generated on: ${new Date().toISOString()}
Version: 1.0.0
                    `;

                    res.send(downloadMessage);
                }

            } catch (error) {
                res.status(500).json({ error: 'Download failed', details: error.message });
            }
        });

        // ================================================
        // OWNER AUTHENTICATION SYSTEM
        // ================================================

        // Owner login credentials (hardcoded as requested)
        const OWNER_CREDENTIALS = {
            username: 'ToreyOwner57',
            password: 'KelsiesGotNiceTits5799@##'
        };

        // Authentication middleware
        const requireOwnerAuth = (req, res, next) => {
            if (req.session && req.session.ownerAuthenticated) {
                return next();
            }
            res.redirect('/owner-login?redirect=' + encodeURIComponent(req.originalUrl));
        };

        // Owner login page
        this.app.get('/owner-login', (req, res) => {
            const redirect = req.query.redirect || '/owner-dashboard';
            res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ShadowWatch AI - Owner Login</title>
    <link rel="stylesheet" href="styles.css">
    <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&family=Orbitron:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🤖</text></svg>">
    <style>
        .login-container {
            max-width: 400px;
            margin: 100px auto;
            padding: 2rem;
            background: rgba(30, 58, 138, 0.3);
            border: 1px solid rgba(6, 182, 212, 0.2);
            border-radius: 1rem;
            text-align: center;
        }

        .login-title {
            font-size: 2rem;
            font-weight: 700;
            color: var(--moon-accent);
            margin-bottom: 1rem;
            font-family: 'Orbitron', monospace;
        }

        .login-subtitle {
            color: var(--text-secondary);
            margin-bottom: 2rem;
        }

        .login-form {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .form-group {
            text-align: left;
        }

        .form-label {
            display: block;
            color: var(--text-primary);
            margin-bottom: 0.5rem;
            font-weight: 500;
        }

        .form-input {
            width: 100%;
            padding: 0.75rem;
            background: var(--moon-dark);
            border: 1px solid rgba(6, 182, 212, 0.3);
            border-radius: 0.5rem;
            color: var(--text-primary);
            font-size: 1rem;
        }

        .form-input:focus {
            outline: none;
            border-color: var(--moon-accent);
            box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.2);
        }

        .login-btn {
            background: linear-gradient(135deg, var(--moon-accent), var(--moon-secondary));
            color: var(--moon-bg);
            border: none;
            padding: 1rem;
            border-radius: 0.5rem;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .login-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 0 30px rgba(6, 182, 212, 0.6);
        }

        .login-error {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #ef4444;
            padding: 0.75rem;
            border-radius: 0.5rem;
            margin-top: 1rem;
            display: none;
        }

        .owner-badge {
            display: inline-block;
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 1rem;
            font-size: 0.8rem;
            font-weight: 600;
            margin-bottom: 1rem;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="owner-badge">OWNER ACCESS ONLY</div>
        <h1 class="login-title">Owner Login</h1>
        <p class="login-subtitle">Access ShadowWatch AI Owner Dashboard</p>

        <form class="login-form" action="/owner-login" method="POST">
            <input type="hidden" name="redirect" value="${redirect}">
            <div class="form-group">
                <label class="form-label" for="username">Username</label>
                <input class="form-input" type="text" id="username" name="username" required>
            </div>
            <div class="form-group">
                <label class="form-label" for="password">Password</label>
                <input class="form-input" type="password" id="password" name="password" required>
            </div>
            <button class="login-btn" type="submit">Login to Owner Dashboard</button>
        </form>

        <div id="login-error" class="login-error"></div>
    </div>

    <script>
        // Check for login error in URL params
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        if (error) {
            const errorDiv = document.getElementById('login-error');
            errorDiv.textContent = error;
            errorDiv.style.display = 'block';
        }
    </script>
</body>
</html>
            `);
        });

        // Owner login POST handler
        this.app.post('/owner-login', (req, res) => {
            const { username, password, redirect } = req.body;

            if (username === OWNER_CREDENTIALS.username && password === OWNER_CREDENTIALS.password) {
                req.session.ownerAuthenticated = true;
                req.session.ownerUsername = username;
                req.session.ownerLoginTime = new Date().toISOString();

                console.log(`🔑 Owner ${username} logged in at ${req.session.ownerLoginTime}`);
                res.redirect(redirect || '/owner-dashboard');
            } else {
                res.redirect('/owner-login?error=Invalid username or password&redirect=' + encodeURIComponent(redirect || '/owner-dashboard'));
            }
        });

        // Owner logout
        this.app.post('/owner-logout', (req, res) => {
            const username = req.session.ownerUsername;
            console.log(`👋 Owner ${username} logged out`);
            req.session.destroy((err) => {
                if (err) {
                    console.error('Session destruction error:', err);
                }
                res.redirect('/owner-login');
            });
        });

        // Owner dashboard
        this.app.get('/owner-dashboard', requireOwnerAuth, (req, res) => {
            res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ShadowWatch AI - Owner Dashboard</title>
    <link rel="stylesheet" href="styles.css">
    <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&family=Orbitron:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🤖</text></svg>">
    <style>
        .dashboard-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 2rem;
        }

        .dashboard-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 3rem;
            padding-bottom: 2rem;
            border-bottom: 2px solid var(--moon-accent);
        }

        .dashboard-title {
            font-size: 3rem;
            font-weight: 700;
            color: var(--moon-accent);
            font-family: 'Orbitron', monospace;
        }

        .owner-info {
            background: rgba(30, 58, 138, 0.3);
            border: 1px solid rgba(6, 182, 212, 0.2);
            border-radius: 1rem;
            padding: 1rem;
            text-align: right;
        }

        .owner-badge {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 1rem;
            font-size: 0.8rem;
            font-weight: 600;
            display: inline-block;
            margin-bottom: 0.5rem;
        }

        .logout-btn {
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            cursor: pointer;
            font-size: 0.9rem;
            transition: all 0.3s ease;
        }

        .logout-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.4);
        }

        .dashboard-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
            margin-bottom: 3rem;
        }

        .dashboard-panel {
            background: rgba(30, 58, 138, 0.3);
            border: 1px solid rgba(6, 182, 212, 0.2);
            border-radius: 1rem;
            padding: 2rem;
        }

        .panel-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--moon-accent);
            margin-bottom: 1rem;
            font-family: 'Orbitron', monospace;
        }

        .owner-actions {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
        }

        .action-btn {
            display: block;
            background: linear-gradient(135deg, var(--moon-accent), var(--moon-secondary));
            color: var(--moon-bg);
            text-decoration: none;
            padding: 1rem;
            border-radius: 0.5rem;
            text-align: center;
            font-weight: 600;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
        }

        .action-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 0 30px rgba(6, 182, 212, 0.4);
        }

        .action-btn.secondary {
            background: linear-gradient(135deg, #10b981, #059669);
        }

        .action-btn.danger {
            background: linear-gradient(135deg, #ef4444, #dc2626);
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
        }

        .stat-card {
            background: rgba(30, 58, 138, 0.4);
            border-radius: 0.5rem;
            padding: 1rem;
            text-align: center;
        }

        .stat-number {
            font-size: 2rem;
            font-weight: 700;
            color: var(--moon-accent);
            display: block;
        }

        .stat-label {
            font-size: 0.9rem;
            color: var(--text-secondary);
            margin-top: 0.5rem;
        }

        .recent-activity {
            max-height: 300px;
            overflow-y: auto;
        }

        .activity-item {
            padding: 0.75rem;
            border-bottom: 1px solid rgba(6, 182, 212, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .activity-item:last-child {
            border-bottom: none;
        }

        .activity-text {
            color: var(--text-secondary);
            font-size: 0.9rem;
        }

        .activity-time {
            color: var(--text-muted);
            font-size: 0.8rem;
        }
    </style>
</head>
<body>
    <div class="dashboard-container">
        <header class="dashboard-header">
            <h1 class="dashboard-title">Owner Dashboard</h1>
            <div class="owner-info">
                <div class="owner-badge">OWNER ACCESS</div>
                <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 0.5rem;">
                    Logged in as: ${req.session.ownerUsername}
                </div>
                <form action="/owner-logout" method="POST" style="display: inline;">
                    <button class="logout-btn" type="submit">Logout</button>
                </form>
            </div>
        </header>

        <div class="dashboard-grid">
            <!-- Quick Actions -->
            <div class="dashboard-panel">
                <h2 class="panel-title">🚀 Quick Actions</h2>
                <div class="owner-actions">
                    <a href="/cursor-control.html" class="action-btn">🤖 AI Control Panel</a>
                    <a href="/documentation.html" class="action-btn secondary">📚 Documentation</a>
                    <button onclick="createOwnerVehicle()" class="action-btn">🚗 Create Owner Vehicle</button>
                    <button onclick="createOwnerWeapon()" class="action-btn">🔫 Create Owner Weapon</button>
                    <button onclick="accessOwnerProjects()" class="action-btn danger">📁 Owner Projects</button>
                </div>
            </div>

            <!-- System Stats -->
            <div class="dashboard-panel">
                <h2 class="panel-title">📊 System Statistics</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <span class="stat-number">50+</span>
                        <div class="stat-label">Vehicle Manufacturers</div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-number">500+</span>
                        <div class="stat-label">Vehicle Models</div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-number">∞</span>
                        <div class="stat-label">AI Generations</div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-number">24/7</span>
                        <div class="stat-label">Owner Access</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Recent Activity -->
        <div class="dashboard-panel">
            <h2 class="panel-title">📝 Recent Owner Activity</h2>
            <div class="recent-activity" id="recent-activity">
                <div class="activity-item">
                    <span class="activity-text">Owner logged in</span>
                    <span class="activity-time">${new Date().toLocaleString()}</span>
                </div>
                <div class="activity-item">
                    <span class="activity-text">Dashboard accessed</span>
                    <span class="activity-time">${new Date().toLocaleString()}</span>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Owner dashboard functions
        async function createOwnerVehicle() {
            const manufacturer = prompt('Enter vehicle manufacturer (e.g., Ferrari, Lamborghini, Tesla):');
            if (!manufacturer) return;

            const model = prompt('Enter vehicle model (e.g., 488 Spider, Huracan, Model S):');
            if (!model) return;

            try {
                const response = await fetch('/api/cursor/vehicles/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ manufacturer, model, engineType: 'unreal' })
                });

                const result = await response.json();
                if (response.ok) {
                    alert('✅ Owner vehicle created successfully!');
                    addActivityItem('Created vehicle: ' + manufacturer + ' ' + model);
                } else {
                    alert('❌ Failed to create vehicle: ' + result.error);
                }
            } catch (error) {
                alert('❌ Error: ' + error.message);
            }
        }

        async function createOwnerWeapon() {
            const weaponType = prompt('Enter weapon type (e.g., Pistol, Rifle, Sword, Rocket Launcher):');
            if (!weaponType) return;

            try {
                const response = await fetch('/api/cursor/weapons/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: weaponType })
                });

                const result = await response.json();
                if (response.ok) {
                    alert('✅ Owner weapon created successfully!');
                    addActivityItem('Created weapon: ' + weaponType);
                } else {
                    alert('❌ Failed to create weapon: ' + result.error);
                }
            } catch (error) {
                alert('❌ Error: ' + error.message);
            }
        }

        async function accessOwnerProjects() {
            alert('📁 Owner Projects feature coming soon! This will provide access to your personal project management system.');
        }

        function addActivityItem(text) {
            const activityDiv = document.getElementById('recent-activity');
            const newItem = document.createElement('div');
            newItem.className = 'activity-item';
            newItem.innerHTML = \`
                <span class="activity-text">\${text}</span>
                <span class="activity-time">\${new Date().toLocaleString()}</span>
            \`;

            // Insert at the top
            if (activityDiv.firstChild) {
                activityDiv.insertBefore(newItem, activityDiv.firstChild);
            } else {
                activityDiv.appendChild(newItem);
            }
        }

        // Check session every 5 minutes
        setInterval(async () => {
            try {
                const response = await fetch('/api/owner/check-session');
                if (response.status === 401) {
                    window.location.href = '/owner-login';
                }
            } catch (error) {
                console.log('Session check failed');
            }
        }, 5 * 60 * 1000);
    </script>
</body>
</html>
            `);
        });

        // Session check endpoint
        this.app.get('/api/owner/check-session', (req, res) => {
            if (req.session && req.session.ownerAuthenticated) {
                res.json({ authenticated: true, username: req.session.ownerUsername });
            } else {
                res.status(401).json({ authenticated: false });
            }
        });

        // Protect AI control panel for owners only
        this.app.get('/cursor-control.html', requireOwnerAuth, (req, res, next) => {
            // If authenticated, serve the file
            next();
        });

        // Owner projects management
        this.app.get('/owner-projects', requireOwnerAuth, (req, res) => {
            const ownerProjectsPath = path.join(__dirname, 'owner-projects');
            const projects = {};

            // Read directory contents
            try {
                const dirs = fs.readdirSync(ownerProjectsPath);
                for (const dir of dirs) {
                    const dirPath = path.join(ownerProjectsPath, dir);
                    if (fs.statSync(dirPath).isDirectory()) {
                        const files = fs.readdirSync(dirPath);
                        projects[dir] = files.length;
                    }
                }
            } catch (error) {
                console.error('Error reading owner projects:', error);
            }

            res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ShadowWatch AI - Owner Projects</title>
    <link rel="stylesheet" href="styles.css">
    <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&family=Orbitron:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🤖</text></svg>">
    <style>
        .projects-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 2rem;
        }

        .projects-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 3rem;
            padding-bottom: 2rem;
            border-bottom: 2px solid var(--moon-accent);
        }

        .projects-title {
            font-size: 2.5rem;
            font-weight: 700;
            color: var(--moon-accent);
            font-family: 'Orbitron', monospace;
        }

        .back-btn {
            background: linear-gradient(135deg, var(--moon-primary), var(--moon-secondary));
            color: var(--moon-bg);
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s ease;
        }

        .back-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 0 30px rgba(6, 182, 212, 0.4);
        }

        .projects-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            margin-bottom: 3rem;
        }

        .project-card {
            background: rgba(30, 58, 138, 0.3);
            border: 1px solid rgba(6, 182, 212, 0.2);
            border-radius: 1rem;
            padding: 2rem;
            text-align: center;
            transition: all 0.3s ease;
        }

        .project-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(6, 182, 212, 0.2);
        }

        .project-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
        }

        .project-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--moon-accent);
            margin-bottom: 1rem;
        }

        .project-count {
            font-size: 2rem;
            font-weight: 700;
            color: var(--moon-accent);
            margin-bottom: 0.5rem;
        }

        .project-desc {
            color: var(--text-secondary);
            margin-bottom: 1.5rem;
        }

        .project-actions {
            display: flex;
            gap: 0.5rem;
            justify-content: center;
        }

        .action-btn {
            background: linear-gradient(135deg, var(--moon-accent), var(--moon-secondary));
            color: var(--moon-bg);
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: 600;
            transition: all 0.3s ease;
        }

        .action-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 0 20px rgba(6, 182, 212, 0.4);
        }

        .action-btn.secondary {
            background: linear-gradient(135deg, #10b981, #059669);
        }

        .recent-files {
            background: rgba(30, 58, 138, 0.2);
            border: 1px solid rgba(6, 182, 212, 0.1);
            border-radius: 1rem;
            padding: 2rem;
        }

        .recent-title {
            font-size: 1.8rem;
            font-weight: 600;
            color: var(--moon-accent);
            margin-bottom: 1.5rem;
            text-align: center;
        }

        .files-list {
            display: grid;
            gap: 0.5rem;
        }

        .file-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem;
            background: rgba(30, 58, 138, 0.3);
            border-radius: 0.5rem;
        }

        .file-name {
            color: var(--text-primary);
            font-weight: 500;
        }

        .file-meta {
            color: var(--text-secondary);
            font-size: 0.8rem;
        }
    </style>
</head>
<body>
    <div class="projects-container">
        <header class="projects-header">
            <h1 class="projects-title">Owner Projects</h1>
            <a href="/owner-dashboard" class="back-btn">← Back to Dashboard</a>
        </header>

        <div class="projects-grid">
            <div class="project-card">
                <div class="project-icon">🚗</div>
                <h3 class="project-title">Vehicles</h3>
                <div class="project-count">${projects.vehicles || 0}</div>
                <p class="project-desc">Custom vehicle models and blueprints created by you</p>
                <div class="project-actions">
                    <button onclick="viewFolder('vehicles')" class="action-btn">View</button>
                    <button onclick="createVehicle()" class="action-btn secondary">Create</button>
                </div>
            </div>

            <div class="project-card">
                <div class="project-icon">🔫</div>
                <h3 class="project-title">Weapons</h3>
                <div class="project-count">${projects.weapons || 0}</div>
                <p class="project-desc">Weapon designs and configurations</p>
                <div class="project-actions">
                    <button onclick="viewFolder('weapons')" class="action-btn">View</button>
                    <button onclick="createWeapon()" class="action-btn secondary">Create</button>
                </div>
            </div>

            <div class="project-card">
                <div class="project-icon">📐</div>
                <h3 class="project-title">Blueprints</h3>
                <div class="project-count">${projects.blueprints || 0}</div>
                <p class="project-desc">Technical blueprints and specifications</p>
                <div class="project-actions">
                    <button onclick="viewFolder('blueprints')" class="action-btn">View</button>
                    <button onclick="createBlueprint()" class="action-btn secondary">Create</button>
                </div>
            </div>

            <div class="project-card">
                <div class="project-icon">🎨</div>
                <h3 class="project-title">Models</h3>
                <div class="project-count">${projects.models || 0}</div>
                <p class="project-desc">3D models and assets</p>
                <div class="project-actions">
                    <button onclick="viewFolder('models')" class="action-btn">View</button>
                    <button onclick="createModel()" class="action-btn secondary">Create</button>
                </div>
            </div>

            <div class="project-card">
                <div class="project-icon">📁</div>
                <h3 class="project-title">Projects</h3>
                <div class="project-count">${projects.projects || 0}</div>
                <p class="project-desc">Complete game projects and templates</p>
                <div class="project-actions">
                    <button onclick="viewFolder('projects')" class="action-btn">View</button>
                    <button onclick="createProject()" class="action-btn secondary">Create</button>
                </div>
            </div>

            <div class="project-card">
                <div class="project-icon">💾</div>
                <h3 class="project-title">Backups</h3>
                <div class="project-count">${projects.backups || 0}</div>
                <p class="project-desc">Project backups and archives</p>
                <div class="project-actions">
                    <button onclick="viewFolder('backups')" class="action-btn">View</button>
                    <button onclick="createBackup()" class="action-btn secondary">Backup</button>
                </div>
            </div>
        </div>

        <div class="recent-files">
            <h2 class="recent-title">Recent Owner Activity</h2>
            <div class="files-list" id="recent-files">
                <div class="file-item">
                    <span class="file-name">Welcome to Owner Projects!</span>
                    <span class="file-meta">Owner access granted</span>
                </div>
                <div class="file-item">
                    <span class="file-name">Project folders initialized</span>
                    <span class="file-meta">System setup</span>
                </div>
                <div class="file-item">
                    <span class="file-name">AI integration ready</span>
                    <span class="file-meta">Cursor API connected</span>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Owner projects functions
        async function viewFolder(folderName) {
            alert('📁 Viewing ' + folderName + ' folder. This feature allows you to browse and manage your ' + folderName + ' files.');
            addRecentActivity('Viewed ' + folderName + ' folder');
        }

        async function createVehicle() {
            const manufacturer = prompt('Enter vehicle manufacturer:');
            if (!manufacturer) return;

            const model = prompt('Enter vehicle model:');
            if (!model) return;

            try {
                const response = await fetch('/api/cursor/vehicles/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        manufacturer,
                        model,
                        engineType: 'unreal',
                        ownerProject: true
                    })
                });

                const result = await response.json();
                if (response.ok) {
                    alert('✅ Owner vehicle created successfully!');
                    addRecentActivity('Created vehicle: ' + manufacturer + ' ' + model);
                    location.reload();
                } else {
                    alert('❌ Failed to create vehicle: ' + result.error);
                }
            } catch (error) {
                alert('❌ Error: ' + error.message);
            }
        }

        async function createWeapon() {
            const weaponType = prompt('Enter weapon type:');
            if (!weaponType) return;

            try {
                const response = await fetch('/api/cursor/weapons/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: weaponType,
                        ownerProject: true
                    })
                });

                const result = await response.json();
                if (response.ok) {
                    alert('✅ Owner weapon created successfully!');
                    addRecentActivity('Created weapon: ' + weaponType);
                    location.reload();
                } else {
                    alert('❌ Failed to create weapon: ' + result.error);
                }
            } catch (error) {
                alert('❌ Error: ' + error.message);
            }
        }

        async function createBlueprint() {
            const blueprintName = prompt('Enter blueprint name:');
            if (!blueprintName) return;

            alert('📐 Blueprint creation feature coming soon! This will generate detailed technical blueprints.');
            addRecentActivity('Blueprint created: ' + blueprintName);
        }

        async function createModel() {
            const modelName = prompt('Enter model name:');
            if (!modelName) return;

            alert('🎨 3D Model creation feature coming soon! This will generate detailed 3D models.');
            addRecentActivity('Model created: ' + modelName);
        }

        async function createProject() {
            const projectName = prompt('Enter project name:');
            if (!projectName) return;

            alert('📁 Project creation feature coming soon! This will initialize complete game projects.');
            addRecentActivity('Project created: ' + projectName);
        }

        async function createBackup() {
            const confirmBackup = confirm('Create a backup of all your owner projects?');
            if (!confirmBackup) return;

            alert('💾 Backup feature coming soon! This will create comprehensive backups of your work.');
            addRecentActivity('Backup created');
        }

        function addRecentActivity(text) {
            const filesList = document.getElementById('recent-files');
            const newItem = document.createElement('div');
            newItem.className = 'file-item';
            newItem.innerHTML = \`
                <span class="file-name">\${text}</span>
                <span class="file-meta">\${new Date().toLocaleString()}</span>
            \`;

            // Insert at the top
            if (filesList.firstChild) {
                filesList.insertBefore(newItem, filesList.firstChild);
            } else {
                filesList.appendChild(newItem);
            }
        }
    </script>
</body>
</html>
            `);
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

        // Cookie parser
        this.app.use(cookieParser());

        // Session configuration
        this.app.use(session({
            secret: process.env.SESSION_SECRET || 'shadowwatch-ai-owner-session-secret-2025',
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: false, // Set to true in production with HTTPS
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            }
        }));

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

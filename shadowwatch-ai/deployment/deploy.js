#!/usr/bin/env node

/**
 * ShadowWatch AI Deployment Script
 * Automated deployment and setup for ShadowWatch AI
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ShadowWatchDeployer {
    constructor() {
        this.config = {
            targetDir: process.cwd(),
            envFile: path.join(process.cwd(), '.env'),
            dbName: process.env.DB_NAME || 'shadowwatch_ai',
            dbUser: process.env.DB_USER || 'shadowwatch_user',
            createDatabase: true,
            runMigrations: true,
            installDependencies: true,
            startServer: false
        };

        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    // #region Main Deployment Flow

    async deploy(options = {}) {
        console.log('🧠 ShadowWatch AI Deployment');
        console.log('============================\n');

        try {
            // Merge options
            Object.assign(this.config, options);

            // Pre-deployment checks
            await this.preDeploymentChecks();

            // Environment setup
            await this.setupEnvironment();

            // Database setup
            if (this.config.createDatabase) {
                await this.setupDatabase();
            }

            // Dependency installation
            if (this.config.installDependencies) {
                await this.installDependencies();
            }

            // Database migrations
            if (this.config.runMigrations) {
                await this.runMigrations();
            }

            // Build and optimization
            await this.buildAndOptimize();

            // Post-deployment setup
            await this.postDeploymentSetup();

            // Start server if requested
            if (this.config.startServer) {
                await this.startServer();
            }

            console.log('\n✅ ShadowWatch AI deployment completed successfully!');
            console.log('\n📋 Next Steps:');
            console.log('1. Review the generated .env file and update credentials');
            console.log('2. Start the server: npm start');
            console.log('3. Check health: curl http://localhost:3000/api/health');
            console.log('4. Access admin dashboard: curl http://localhost:3000/api/admin/shadowwatch');

        } catch (error) {
            console.error('\n❌ Deployment failed:', error.message);
            console.log('\n🔧 Troubleshooting:');
            console.log('1. Check your database credentials');
            console.log('2. Ensure PostgreSQL is running');
            console.log('3. Verify Node.js version (>= 18)');
            console.log('4. Check file permissions');

            process.exit(1);
        } finally {
            this.rl.close();
        }
    }

    // #endregion

    // #region Pre-deployment Checks

    async preDeploymentChecks() {
        console.log('🔍 Running pre-deployment checks...\n');

        // Check Node.js version
        const nodeVersion = process.version;
        const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);
        if (majorVersion < 18) {
            throw new Error(`Node.js version ${nodeVersion} is not supported. Please upgrade to Node.js 18+`);
        }
        console.log(`✅ Node.js version: ${nodeVersion}`);

        // Check if in correct directory
        const packageJsonPath = path.join(this.config.targetDir, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            throw new Error('package.json not found. Please run this script from the ShadowWatch AI root directory.');
        }

        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        if (packageJson.name !== 'shadowwatch-ai') {
            throw new Error('This does not appear to be the ShadowWatch AI project directory.');
        }
        console.log('✅ ShadowWatch AI project detected');

        // Check required tools
        await this.checkRequiredTools();

        // Check existing installation
        if (fs.existsSync(this.config.envFile)) {
            console.log('⚠️  .env file already exists');
            const overwrite = await this.askYesNo('Overwrite existing .env file?');
            if (!overwrite) {
                this.config.skipEnvSetup = true;
            }
        }

        console.log('');
    }

    async checkRequiredTools() {
        const tools = [
            { command: 'node --version', name: 'Node.js' },
            { command: 'npm --version', name: 'npm' },
            { command: 'psql --version', name: 'PostgreSQL client' }
        ];

        for (const tool of tools) {
            try {
                execSync(tool.command, { stdio: 'pipe' });
                console.log(`✅ ${tool.name} available`);
            } catch (error) {
                throw new Error(`${tool.name} is not installed or not in PATH`);
            }
        }

        // Check optional tools
        try {
            execSync('redis-cli --version', { stdio: 'pipe' });
            console.log('✅ Redis client available');
            this.config.redisAvailable = true;
        } catch (error) {
            console.log('⚠️  Redis client not available (optional)');
            this.config.redisAvailable = false;
        }
    }

    // #endregion

    // #region Environment Setup

    async setupEnvironment() {
        console.log('🔧 Setting up environment...\n');

        if (this.config.skipEnvSetup) {
            console.log('⏭️  Skipping .env setup (file exists)\n');
            return;
        }

        // Copy env.example to .env
        const envExamplePath = path.join(this.config.targetDir, 'env.example');
        if (!fs.existsSync(envExamplePath)) {
            throw new Error('env.example file not found');
        }

        fs.copyFileSync(envExamplePath, this.config.envFile);
        console.log('✅ Created .env file from template');

        // Interactive environment configuration
        console.log('\n📝 Configuring environment variables...\n');

        const envVars = await this.collectEnvironmentVariables();
        this.updateEnvFile(envVars);

        console.log('✅ Environment configured\n');
    }

    async collectEnvironmentVariables() {
        const env = {};

        console.log('Database Configuration:');
        env.DB_HOST = await this.askQuestion('Database host', process.env.DB_HOST || 'localhost');
        env.DB_PORT = await this.askQuestion('Database port', process.env.DB_PORT || '5432');
        env.DB_NAME = await this.askQuestion('Database name', this.config.dbName);
        env.DB_USER = await this.askQuestion('Database user', this.config.dbUser);
        env.DB_PASSWORD = await this.askQuestion('Database password', process.env.DB_PASSWORD || '', true);

        console.log('\nShadowWatch Configuration:');
        env.SHADOWWATCH_ENCRYPTION_KEY = this.generateEncryptionKey();
        console.log(`✅ Generated encryption key: ${env.SHADOWWATCH_ENCRYPTION_KEY.substring(0, 16)}...`);

        env.SHADOWWATCH_MAX_CONCURRENT_USERS = await this.askQuestion('Max concurrent users', '10000');
        env.SHADOWWATCH_HEARTBEAT_INTERVAL_SECONDS = await this.askQuestion('Heartbeat interval (seconds)', '30');

        console.log('\nPrivacy Configuration:');
        env.GDPR_COMPLIANCE_ENABLED = await this.askYesNo('Enable GDPR compliance?', true) ? 'true' : 'false';
        env.DATA_RETENTION_DAYS = await this.askQuestion('Data retention (days)', '365');

        console.log('\nOptional Services:');
        if (this.config.redisAvailable) {
            const useRedis = await this.askYesNo('Configure Redis?');
            if (useRedis) {
                env.REDIS_HOST = await this.askQuestion('Redis host', 'localhost');
                env.REDIS_PORT = await this.askQuestion('Redis port', '6379');
                env.REDIS_PASSWORD = await this.askQuestion('Redis password (optional)', '');
            }
        }

        console.log('\nServer Configuration:');
        env.NODE_ENV = 'production';
        env.PORT = await this.askQuestion('Server port', '3000');
        env.FRONTEND_URL = await this.askQuestion('Frontend URL', 'http://localhost:3000');

        return env;
    }

    updateEnvFile(envVars) {
        let envContent = fs.readFileSync(this.config.envFile, 'utf8');

        // Update environment variables
        for (const [key, value] of Object.entries(envVars)) {
            const regex = new RegExp(`^${key}=.*$`, 'm');
            const newLine = `${key}=${value}`;
            if (regex.test(envContent)) {
                envContent = envContent.replace(regex, newLine);
            } else {
                envContent += `\n${newLine}`;
            }
        }

        fs.writeFileSync(this.config.envFile, envContent);
    }

    generateEncryptionKey() {
        return require('crypto').randomBytes(32).toString('hex');
    }

    // #endregion

    // #region Database Setup

    async setupDatabase() {
        console.log('🗄️  Setting up database...\n');

        try {
            // Test database connection
            await this.testDatabaseConnection();

            // Create database if it doesn't exist
            await this.createDatabaseIfNotExists();

            console.log('✅ Database setup completed\n');

        } catch (error) {
            console.error('❌ Database setup failed:', error.message);
            throw error;
        }
    }

    async testDatabaseConnection() {
        console.log('🔌 Testing database connection...');

        const env = this.loadEnvVariables();
        const connectionString = `postgresql://${env.DB_USER}:${env.DB_PASSWORD}@${env.DB_HOST}:${env.DB_PORT}/postgres`;

        try {
            execSync(`psql "${connectionString}" -c "SELECT version();"`, { stdio: 'pipe' });
            console.log('✅ Database connection successful');
        } catch (error) {
            throw new Error('Cannot connect to PostgreSQL. Please check your credentials and ensure PostgreSQL is running.');
        }
    }

    async createDatabaseIfNotExists() {
        console.log('📦 Checking database existence...');

        const env = this.loadEnvVariables();
        const connectionString = `postgresql://${env.DB_USER}:${env.DB_PASSWORD}@${env.DB_HOST}:${env.DB_PORT}/postgres`;

        try {
            // Check if database exists
            const result = execSync(`psql "${connectionString}" -t -c "SELECT 1 FROM pg_database WHERE datname='${env.DB_NAME}';"`, { encoding: 'utf8' });

            if (result.trim()) {
                console.log(`✅ Database '${env.DB_NAME}' already exists`);
                return;
            }

            // Create database
            console.log(`📝 Creating database '${env.DB_NAME}'...`);
            execSync(`psql "${connectionString}" -c "CREATE DATABASE ${env.DB_NAME};"`);
            console.log(`✅ Database '${env.DB_NAME}' created`);

        } catch (error) {
            throw new Error(`Failed to create database: ${error.message}`);
        }
    }

    // #endregion

    // #region Dependencies & Migrations

    async installDependencies() {
        console.log('📦 Installing dependencies...\n');

        try {
            console.log('Installing npm dependencies...');
            execSync('npm install', { stdio: 'inherit', cwd: this.config.targetDir });
            console.log('✅ Dependencies installed\n');
        } catch (error) {
            throw new Error('Failed to install dependencies');
        }
    }

    async runMigrations() {
        console.log('🗃️  Running database migrations...\n');

        const schemaPath = path.join(this.config.targetDir, 'database', 'shadowwatch_schema.sql');
        if (!fs.existsSync(schemaPath)) {
            throw new Error('Database schema file not found');
        }

        const env = this.loadEnvVariables();
        const connectionString = `postgresql://${env.DB_USER}:${env.DB_PASSWORD}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`;

        try {
            console.log('Applying database schema...');
            execSync(`psql "${connectionString}" -f "${schemaPath}"`, { stdio: 'inherit' });
            console.log('✅ Database migrations completed\n');
        } catch (error) {
            throw new Error('Failed to run database migrations');
        }
    }

    // #endregion

    // #region Build & Optimization

    async buildAndOptimize() {
        console.log('🔨 Building and optimizing...\n');

        // Run linting
        try {
            console.log('Running ESLint...');
            execSync('npm run lint', { stdio: 'pipe', cwd: this.config.targetDir });
            console.log('✅ Code linting passed');
        } catch (error) {
            console.log('⚠️  Code linting found issues (non-fatal)');
        }

        // Run tests if available
        try {
            console.log('Running tests...');
            execSync('npm test', { stdio: 'pipe', cwd: this.config.targetDir });
            console.log('✅ Tests passed');
        } catch (error) {
            console.log('⚠️  Tests failed (non-fatal in deployment)');
        }

        console.log('✅ Build and optimization completed\n');
    }

    // #endregion

    // #region Post-deployment Setup

    async postDeploymentSetup() {
        console.log('⚙️  Running post-deployment setup...\n');

        // Create necessary directories
        const dirs = ['logs', 'backups', 'temp'];
        for (const dir of dirs) {
            const dirPath = path.join(this.config.targetDir, dir);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
                console.log(`✅ Created directory: ${dir}`);
            }
        }

        // Set up log rotation (basic)
        const logConfig = {
            errorLog: 'logs/error.log',
            accessLog: 'logs/access.log',
            maxSize: '10m',
            maxFiles: 5
        };

        fs.writeFileSync(
            path.join(this.config.targetDir, 'log-config.json'),
            JSON.stringify(logConfig, null, 2)
        );
        console.log('✅ Log configuration created');

        // Create systemd service file (Linux)
        if (process.platform === 'linux') {
            await this.createSystemdService();
        }

        // Create deployment info
        const deployInfo = {
            deployedAt: new Date().toISOString(),
            version: '1.0.0',
            nodeVersion: process.version,
            platform: process.platform,
            architecture: process.arch,
            environment: process.env.NODE_ENV || 'production'
        };

        fs.writeFileSync(
            path.join(this.config.targetDir, 'deployment-info.json'),
            JSON.stringify(deployInfo, null, 2)
        );
        console.log('✅ Deployment info recorded\n');
    }

    async createSystemdService() {
        const serviceContent = `[Unit]
Description=ShadowWatch AI Server
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=${process.env.USER || 'www-data'}
WorkingDirectory=${this.config.targetDir}
ExecStart=${process.execPath} ${path.join(this.config.targetDir, 'deployment', 'server.js')}
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
`;

        const servicePath = '/etc/systemd/system/shadowwatch-ai.service';
        try {
            fs.writeFileSync(servicePath, serviceContent);
            console.log('✅ Systemd service created');

            console.log('To enable the service:');
            console.log('  sudo systemctl enable shadowwatch-ai');
            console.log('  sudo systemctl start shadowwatch-ai');
        } catch (error) {
            console.log('⚠️  Could not create systemd service (requires sudo)');
        }
    }

    // #endregion

    // #region Server Management

    async startServer() {
        console.log('🚀 Starting ShadowWatch AI server...\n');

        const serverProcess = spawn(process.execPath, ['deployment/server.js'], {
            cwd: this.config.targetDir,
            stdio: 'inherit',
            detached: true
        });

        // Wait a moment for server to start
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Check if server is running
        try {
            const response = execSync('curl -s http://localhost:3000/api/health', { timeout: 5000 });
            const health = JSON.parse(response.toString());

            if (health.status === 'healthy') {
                console.log('✅ Server started successfully');
                console.log(`🌐 Server running at: http://localhost:${process.env.PORT || 3000}`);
            } else {
                console.log('⚠️  Server started but health check failed');
            }
        } catch (error) {
            console.log('⚠️  Could not verify server status');
        }

        serverProcess.unref();
    }

    // #endregion

    // #region Utility Methods

    loadEnvVariables() {
        const envPath = this.config.envFile;
        if (!fs.existsSync(envPath)) {
            return {};
        }

        const envContent = fs.readFileSync(envPath, 'utf8');
        const env = {};

        envContent.split('\n').forEach(line => {
            const match = line.match(/^([^=#]+)=(.*)$/);
            if (match) {
                env[match[1].trim()] = match[2].trim();
            }
        });

        return env;
    }

    askQuestion(question, defaultValue = '', password = false) {
        return new Promise((resolve) => {
            const prompt = defaultValue ? `${question} [${defaultValue}]: ` : `${question}: `;

            if (password) {
                // For password input, don't show default
                this.rl.question(question + ': ', (answer) => {
                    resolve(answer || defaultValue);
                });
            } else {
                this.rl.question(prompt, (answer) => {
                    resolve(answer || defaultValue);
                });
            }
        });
    }

    askYesNo(question, defaultYes = false) {
        return new Promise((resolve) => {
            const prompt = `${question} ${defaultYes ? '[Y/n]' : '[y/N]'}: `;
            this.rl.question(prompt, (answer) => {
                const normalized = answer.toLowerCase().trim();
                if (normalized === '') {
                    resolve(defaultYes);
                } else {
                    resolve(normalized === 'y' || normalized === 'yes');
                }
            });
        });
    }

    // #endregion
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {};

    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--no-db':
                options.createDatabase = false;
                break;
            case '--no-deps':
                options.installDependencies = false;
                break;
            case '--no-migrate':
                options.runMigrations = false;
                break;
            case '--start':
                options.startServer = true;
                break;
            case '--help':
                console.log(`
ShadowWatch AI Deployment Script

Usage: node deployment/deploy.js [options]

Options:
  --no-db       Skip database creation
  --no-deps     Skip dependency installation
  --no-migrate  Skip database migrations
  --start       Start server after deployment
  --help        Show this help message

Examples:
  node deployment/deploy.js                    # Full deployment
  node deployment/deploy.js --start           # Deploy and start server
  node deployment/deploy.js --no-db --start   # Skip DB setup, deploy and start
                `);
                process.exit(0);
                break;
        }
    }

    const deployer = new ShadowWatchDeployer();
    deployer.deploy(options);
}

export default ShadowWatchDeployer;

/**
 * ShadowWatch AI Core - Unit Tests
 * Comprehensive testing for the main AI engine
 */

const { ShadowWatchAI } = require('../index');

// Mock external dependencies
jest.mock('pg', () => {
    const mockClient = {
        connect: jest.fn(),
        query: jest.fn(),
        end: jest.fn(),
    };
    return { Pool: jest.fn(() => mockClient) };
});

jest.mock('redis', () => ({
    createClient: jest.fn(() => ({
        connect: jest.fn(),
        disconnect: jest.fn(),
        ping: jest.fn(),
        setEx: jest.fn(),
    })),
}));

jest.mock('node-cron', () => ({
    schedule: jest.fn(),
}));

describe('ShadowWatchAI', () => {
    let shadowwatch;
    let mockSocket;
    let mockDb;
    let mockRedis;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Setup mock socket
        mockSocket = {
            emit: jest.fn(),
            on: jest.fn(),
            removeAllListeners: jest.fn(),
            id: 'mock-socket-id'
        };

        // Get mock instances
        const { Pool } = require('pg');
        mockDb = new Pool();

        const redis = require('redis');
        mockRedis = redis.createClient();

        // Create ShadowWatch instance
        shadowwatch = new ShadowWatchAI({
            encryptionKey: 'test_32_character_key_for_testing_123',
            heartbeatInterval: 1, // Fast for testing
            dataRetentionDays: 30
        });
    });

    afterEach(async () => {
        if (shadowwatch) {
            await shadowwatch.shutdown();
        }
    });

    describe('Initialization', () => {
        test('should initialize with default config', () => {
            expect(shadowwatch.config.encryptionKey).toBe('test_32_character_key_for_testing_123');
            expect(shadowwatch.config.maxConcurrentUsers).toBe(10000);
            expect(shadowwatch.config.gdprComplianceEnabled).toBe(true);
        });

        test('should initialize monitoring rules', () => {
            expect(shadowwatch.monitoringRules.size).toBeGreaterThan(0);
            expect(shadowwatch.monitoringRules.has('afk_detection')).toBe(true);
            expect(shadowwatch.monitoringRules.has('skill_improvement')).toBe(true);
        });

        test('should handle database connection failure gracefully', async () => {
            mockDb.query.mockRejectedValue(new Error('Connection failed'));

            const newShadowWatch = new ShadowWatchAI();
            // Should not throw, but db will be null
            expect(newShadowWatch.db).toBeNull();
        });
    });

    describe('User Management', () => {
        const testUserId = 'user123';
        const testConsent = true;

        test('should subscribe user with valid consent', async () => {
            mockDb.query.mockResolvedValue({ rows: [] });

            const result = await shadowwatch.subscribeUser(testUserId, mockSocket, testConsent);

            expect(result).toBe(true);
            expect(shadowwatch.connectedUsers.has(testUserId)).toBe(true);
            expect(mockSocket.emit).toHaveBeenCalledWith('shadowwatch_error', expect.any(Object));
        });

        test('should reject user without consent', async () => {
            const result = await shadowwatch.subscribeUser(testUserId, mockSocket, false);

            expect(result).toBe(false);
            expect(mockSocket.emit).toHaveBeenCalledWith('shadowwatch_error', {
                type: 'consent_required',
                message: expect.stringContaining('consent')
            });
        });

        test('should handle max concurrent users limit', async () => {
            // Fill up to max users
            shadowwatch.config.maxConcurrentUsers = 1;
            shadowwatch.connectedUsers.set('existingUser', { socket: mockSocket });

            const result = await shadowwatch.subscribeUser(testUserId, mockSocket, testConsent);

            expect(result).toBe(false);
            expect(mockSocket.emit).toHaveBeenCalledWith('shadowwatch_error', {
                type: 'server_full',
                message: expect.stringContaining('capacity')
            });
        });

        test('should unsubscribe user correctly', async () => {
            // Setup user session
            shadowwatch.connectedUsers.set(testUserId, {
                socket: mockSocket,
                sessionId: 'session123',
                heartbeatInterval: setInterval(() => {}, 1000)
            });

            mockDb.query.mockResolvedValue();

            await shadowwatch.unsubscribeUser(testUserId);

            expect(shadowwatch.connectedUsers.has(testUserId)).toBe(false);
            expect(mockSocket.removeAllListeners).toHaveBeenCalled();
        });
    });

    describe('Activity Monitoring', () => {
        const testUserId = 'user123';

        beforeEach(() => {
            // Setup user session
            shadowwatch.connectedUsers.set(testUserId, {
                userId: testUserId,
                socket: mockSocket,
                stats: { level: 1, health: 100 },
                lastActivity: new Date()
            });
        });

        test('should monitor stats changes', async () => {
            const actionType = 'level_up';
            const newStats = { level: 2, experience: 150 };

            mockDb.query.mockResolvedValue();

            await shadowwatch.monitorStatsChange(testUserId, actionType, newStats);

            expect(mockDb.query).toHaveBeenCalled();
            const session = shadowwatch.connectedUsers.get(testUserId);
            expect(session.stats.level).toBe(2);
            expect(session.stats.experience).toBe(150);
        });

        test('should trigger monitoring rules', async () => {
            const newStats = { level: 10 };

            await shadowwatch.monitorStatsChange(testUserId, 'level_up', newStats);

            // Should trigger skill_improvement rule
            expect(mockSocket.emit).toHaveBeenCalledWith('shadowwatch_message', expect.objectContaining({
                type: 'celebration',
                title: 'Level Up!'
            }));
        });

        test('should handle non-existent user', async () => {
            await expect(shadowwatch.monitorStatsChange('nonexistent', 'test', {}))
                .resolves.not.toThrow();
        });
    });

    describe('Personalized Messages', () => {
        const testUserId = 'user123';

        beforeEach(() => {
            shadowwatch.connectedUsers.set(testUserId, {
                userId: testUserId,
                socket: mockSocket,
                stats: { level: 1 }
            });
        });

        test('should send AFK reminder', () => {
            shadowwatch.sendPersonalizedMessage(testUserId, 'afk_reminder');

            expect(mockSocket.emit).toHaveBeenCalledWith('shadowwatch_message', expect.objectContaining({
                type: 'reminder',
                title: 'Still there?'
            }));
        });

        test('should send level up congratulation', () => {
            shadowwatch.sendPersonalizedMessage(testUserId, 'level_up_congratulation');

            expect(mockSocket.emit).toHaveBeenCalledWith('shadowwatch_message', expect.objectContaining({
                type: 'celebration',
                title: 'Level Up!'
            }));
        });

        test('should send welcome back message', () => {
            shadowwatch.sendPersonalizedGreeting(testUserId);

            expect(mockSocket.emit).toHaveBeenCalledWith('shadowwatch_message', expect.objectContaining({
                type: 'greeting',
                title: 'Welcome to ShadowWatch AI'
            }));
        });
    });

    describe('Privacy & Security', () => {
        test('should encrypt and decrypt data', () => {
            const testData = { userId: '123', sensitive: 'data' };

            const encrypted = shadowwatch.encryptData(testData);
            expect(encrypted).toHaveProperty('encrypted');
            expect(encrypted).toHaveProperty('iv');

            const decrypted = shadowwatch.decryptData(encrypted);
            expect(decrypted).toEqual(testData);
        });

        test('should handle decryption errors gracefully', () => {
            const invalidData = { encrypted: 'invalid', iv: 'invalid' };

            const result = shadowwatch.decryptData(invalidData);
            expect(result).toBeNull();
        });
    });

    describe('Health Monitoring', () => {
        test('should perform health check', async () => {
            mockDb.query.mockResolvedValue({ rows: [{ version: 'PostgreSQL 13.0' }] });
            mockRedis.ping.mockResolvedValue('PONG');

            const health = await shadowwatch.performHealthCheck();

            expect(health).toHaveProperty('status');
            expect(health).toHaveProperty('timestamp');
            expect(health.metrics).toHaveProperty('activeUsers');
            expect(health.connections).toHaveProperty('database');
            expect(health.connections).toHaveProperty('redis');
        });

        test('should handle database health check failure', async () => {
            mockDb.query.mockRejectedValue(new Error('Connection failed'));

            const health = await shadowwatch.performHealthCheck();

            expect(health.status).toBe('degraded');
            expect(health.connections.database).toBe('error');
        });
    });

    describe('Global Insights', () => {
        test('should return insights without database', async () => {
            shadowwatch.db = null;

            const insights = await shadowwatch.getGlobalInsights();

            expect(insights).toHaveProperty('error');
            expect(insights.error).toContain('not available');
        });

        test('should aggregate insights from database', async () => {
            const mockResults = {
                total_sessions: 100,
                avg_duration: 1800, // 30 minutes
                action_types: ['login', 'combat', 'level_up']
            };

            mockDb.query.mockImplementation((query) => {
                if (query.includes('total_sessions')) {
                    return Promise.resolve({ rows: [mockResults] });
                }
                if (query.includes('action_type')) {
                    return Promise.resolve({
                        rows: [
                            { action_type: 'login', count: 50 },
                            { action_type: 'combat', count: 30 }
                        ]
                    });
                }
                return Promise.resolve({ rows: [{ encrypted_count: 75 }] });
            });

            const insights = await shadowwatch.getGlobalInsights();

            expect(insights).toHaveProperty('activeUsers');
            expect(insights).toHaveProperty('totalSessions', 100);
            expect(insights).toHaveProperty('topActivities');
            expect(insights.privacyCompliance).toHaveProperty('encryptedLogsCount', 75);
        });
    });

    describe('Data Retention', () => {
        test('should cleanup old data', async () => {
            mockDb.query.mockResolvedValue();

            await shadowwatch.cleanupOldData();

            expect(mockDb.query).toHaveBeenCalledTimes(3); // activity_logs, user_sessions, privacy_audit_log
        });

        test('should send offline nudges', async () => {
            mockDb.query.mockResolvedValue({
                rows: [
                    { user_id: 'user1' },
                    { user_id: 'user2' }
                ]
            });

            await shadowwatch.sendOfflineNudges();

            expect(mockDb.query).toHaveBeenCalledWith(
                expect.stringContaining('ended_at < $1'),
                expect.any(Array)
            );
        });
    });

    describe('Logging', () => {
        const originalConsole = global.console;

        beforeEach(() => {
            global.console = {
                log: jest.fn(),
                error: jest.fn(),
                warn: jest.fn(),
                info: jest.fn()
            };
        });

        afterEach(() => {
            global.console = originalConsole;
        });

        test('should log messages based on level', () => {
            shadowwatch.config.logLevel = 'info';

            shadowwatch.log('info', 'Test info message');
            shadowwatch.log('debug', 'Test debug message'); // Should not log
            shadowwatch.log('error', 'Test error message');

            expect(global.console.log).toHaveBeenCalledTimes(2);
            expect(global.console.log).toHaveBeenCalledWith(
                expect.stringContaining('[INFO]: Test info message')
            );
            expect(global.console.log).toHaveBeenCalledWith(
                expect.stringContaining('[ERROR]: Test error message')
            );
        });
    });

    describe('Shutdown', () => {
        test('should shutdown gracefully', async () => {
            // Setup connected users
            shadowwatch.connectedUsers.set('user1', {
                socket: mockSocket,
                heartbeatInterval: setInterval(() => {}, 1000)
            });

            mockDb.end.mockResolvedValue();
            mockRedis.disconnect.mockResolvedValue();

            await shadowwatch.shutdown();

            expect(mockDb.end).toHaveBeenCalled();
            expect(mockRedis.disconnect).toHaveBeenCalled();
            expect(shadowwatch.connectedUsers.size).toBe(0);
        });
    });
});

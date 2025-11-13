/**
 * ShadowWatch AI - Complete Game Engine & AI System
 * Full-featured MMO RPG with autonomous AI development
 */

import ShadowWatchAI from './core/shadowwatch.js';
import ShadowWatchGameEngine from './core/game-engine.js';
import AttackTrainer from './core/attack_trainer.js';
import TutorialSystem from './core/tutorial_system.js';

// Version information
const VERSION = '2.0.0';
const NAME = 'ShadowWatch AI - Complete Game Engine';

// Core exports
export { ShadowWatchAI, ShadowWatchGameEngine, AttackTrainer, TutorialSystem };

// Utility functions
export const createShadowWatchInstance = (config = {}) => {
    return new ShadowWatchAI(config);
};

export const createGameEngine = (config = {}) => {
    return new ShadowWatchGameEngine(config);
};

export const createAttackTrainer = (shadowwatchInstance) => {
    return new AttackTrainer(shadowwatchInstance);
};

export const createTutorialSystem = (shadowwatchInstance) => {
    return new TutorialSystem(shadowwatchInstance);
};

// Initialize complete game system
export const initializeCompleteGameSystem = async (config = {}) => {
    console.log('🚀 Initializing ShadowWatch AI Complete Game System...');

    // Create AI monitoring system
    const shadowwatch = new ShadowWatchAI(config);

    // Create complete game engine
    const gameEngine = new ShadowWatchGameEngine({
        ...config,
        autonomousMode: true,
        developmentMode: '9500h'
    });

    // Create training systems
    const attackTrainer = new AttackTrainer(shadowwatch);
    const tutorialSystem = new TutorialSystem(shadowwatch);

    // Start autonomous development
    console.log('🤖 Starting Autonomous Game Development (9500 Hours)...');

    return {
        shadowwatch,
        gameEngine,
        attackTrainer,
        tutorialSystem,
        version: VERSION,
        name: NAME,

        // Unified API
        getGameState: () => gameEngine.getGameState(),
        getPlayer: (id) => gameEngine.getPlayer(id),
        getAIStatus: () => shadowwatch.getAIStatus(),
        createPlayer: (data) => gameEngine.addPlayer(data),
        startCombat: (attacker, defender) => gameEngine.startCombat(attacker, defender),
        assignQuest: (player, quest) => gameEngine.assignQuest(player, quest),

        // Statistics
        getStatistics: () => ({
            ...gameEngine.getStatistics(),
            aiStatus: shadowwatch.getAIStatus(),
            developmentProgress: shadowwatch.getDevelopmentProgress()
        }),

        // Export complete game data
        exportGameData: () => ({
            ai: shadowwatch.exportGameData(),
            game: gameEngine.exportGameData(),
            timestamp: new Date(),
            version: VERSION
        })
    };
};

// Initialize legacy system (for backward compatibility)
export const initializeCompleteSystem = async (config = {}) => {
    return initializeCompleteGameSystem(config);
};

// Health check
export const healthCheck = () => {
    return {
        name: NAME,
        version: VERSION,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        modules: ['ShadowWatchAI', 'AttackTrainer', 'TutorialSystem']
    };
};

// Default export
export default {
    ShadowWatchAI,
    AttackTrainer,
    TutorialSystem,
    createShadowWatchInstance,
    createAttackTrainer,
    createTutorialSystem,
    initializeCompleteSystem,
    healthCheck,
    version: VERSION,
    name: NAME
};

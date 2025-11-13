/**
 * ShadowWatch AI - Main Entry Point
 * Exports all core modules for easy integration
 */

import ShadowWatchAI from './core/shadowwatch.js';
import AttackTrainer from './core/attack_trainer.js';
import TutorialSystem from './core/tutorial_system.js';

// Version information
const VERSION = '1.0.0';
const NAME = 'ShadowWatch AI';

// Core exports
export { ShadowWatchAI, AttackTrainer, TutorialSystem };

// Utility functions
export const createShadowWatchInstance = (config = {}) => {
    return new ShadowWatchAI(config);
};

export const createAttackTrainer = (shadowwatchInstance) => {
    return new AttackTrainer(shadowwatchInstance);
};

export const createTutorialSystem = (shadowwatchInstance) => {
    return new TutorialSystem(shadowwatchInstance);
};

// Initialize complete system
export const initializeCompleteSystem = async (config = {}) => {
    const shadowwatch = new ShadowWatchAI(config);
    const attackTrainer = new AttackTrainer(shadowwatch);
    const tutorialSystem = new TutorialSystem(shadowwatch);

    return {
        shadowwatch,
        attackTrainer,
        tutorialSystem,
        version: VERSION,
        name: NAME
    };
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

/**
 * ShadowWatch AI - Tutorial System
 * 25-step comprehensive interactive onboarding with progress tracking
 */

class TutorialSystem {
    constructor(shadowwatchInstance) {
        this.shadowwatch = shadowwatchInstance;
        this.activeTutorials = new Map(); // userId -> tutorial session
        this.tutorialProgress = new Map(); // userId -> progress data
        this.tutorialAnalytics = new Map(); // tutorialId -> completion stats

        // Tutorial configuration
        this.config = {
            autoStart: process.env.TUTORIAL_AUTO_START !== 'false',
            reminderInterval: parseInt(process.env.TUTORIAL_REMINDER_INTERVAL_MINUTES) || 15,
            voiceEnabled: true,
            skipEnabled: true,
            maxTutorialDuration: 45 * 60 * 1000, // 45 minutes
            warningThreshold: 3, // Show warnings after 3 failed attempts
            adaptiveDifficulty: true
        };

        // Initialize tutorial steps
        this.tutorialSteps = this.defineTutorialSteps();

        // Initialize system
        this.initializeTutorialSystem();
        this.shadowwatch.log('info', 'Tutorial System initialized');
    }

    // #region Initialization

    initializeTutorialSystem() {
        // Set up reminder system
        setInterval(() => {
            this.sendTutorialReminders();
        }, this.config.reminderInterval * 60 * 1000);

        // Clean up expired tutorials
        setInterval(() => {
            this.cleanupExpiredTutorials();
        }, 10 * 60 * 1000); // Every 10 minutes
    }

    defineTutorialSteps() {
        return [
            // Phase 1: Introduction (Steps 1-5)
            {
                id: 1,
                phase: 'introduction',
                title: 'Welcome to ShadowWatch AI',
                content: 'Hello! I\'m your ShadowWatch AI companion. I\'ll guide you through your gaming journey and help you become a better player.',
                type: 'dialog',
                voiceover: 'welcome_message',
                duration: 8000,
                interactive: false,
                requirements: [],
                rewards: { experience: 10 },
                warnings: []
            },
            {
                id: 2,
                phase: 'introduction',
                title: 'What I Can Do',
                content: 'I monitor your gameplay ethically, provide personalized tips, and help you improve your skills through safe training.',
                type: 'feature_showcase',
                voiceover: 'capabilities_overview',
                duration: 10000,
                interactive: false,
                requirements: [],
                rewards: { experience: 15 },
                warnings: []
            },
            {
                id: 3,
                phase: 'introduction',
                title: 'Privacy First',
                content: 'Your privacy is my top priority. All monitoring requires your explicit consent and data is encrypted.',
                type: 'privacy_notice',
                voiceover: 'privacy_commitment',
                duration: 12000,
                interactive: true,
                requirements: ['consent_acknowledged'],
                rewards: { experience: 20 },
                warnings: []
            },
            {
                id: 4,
                phase: 'introduction',
                title: 'Basic Controls',
                content: 'Let\'s learn the basic game controls. Try moving your character using WASD keys.',
                type: 'interactive_demo',
                voiceover: 'basic_controls',
                duration: 15000,
                interactive: true,
                requirements: ['movement_demonstrated'],
                rewards: { experience: 25 },
                warnings: ['don\'t_stand_still', 'don\'t_run_randomly']
            },
            {
                id: 5,
                phase: 'introduction',
                title: 'Your First Action',
                content: 'Now try performing a basic action. Click on a nearby object or use your primary ability.',
                type: 'interactive_demo',
                voiceover: 'first_action',
                duration: 18000,
                interactive: true,
                requirements: ['action_performed'],
                rewards: { experience: 30 },
                warnings: ['don\'t_spam_clicks', 'don\'t_use_wrong_ability']
            },

            // Phase 2: Combat Basics (Steps 6-12)
            {
                id: 6,
                phase: 'combat_basics',
                title: 'Combat Overview',
                content: 'Combat is a core part of this game. Let\'s learn the fundamentals of engaging enemies.',
                type: 'educational',
                voiceover: 'combat_introduction',
                duration: 12000,
                interactive: false,
                requirements: [],
                rewards: { experience: 35 },
                warnings: []
            },
            {
                id: 7,
                phase: 'combat_basics',
                title: 'Targeting System',
                content: 'Click on an enemy to target them. Notice how the UI highlights your target.',
                type: 'interactive_demo',
                voiceover: 'targeting_mechanics',
                duration: 15000,
                interactive: true,
                requirements: ['target_selected'],
                rewards: { experience: 40 },
                warnings: ['don\'t_target_friendlies', 'don\'t_switch_targets_randomly']
            },
            {
                id: 8,
                phase: 'combat_basics',
                title: 'Basic Attack',
                content: 'Target an enemy and use your basic attack. Watch for the damage numbers and enemy reactions.',
                type: 'interactive_demo',
                voiceover: 'basic_attack_demo',
                duration: 20000,
                interactive: true,
                requirements: ['attack_landed'],
                rewards: { experience: 50 },
                warnings: ['don\'t_attack_friendlies', 'don\'t_waste_attacks']
            },
            {
                id: 9,
                phase: 'combat_basics',
                title: 'Health Management',
                content: 'Keep an eye on your health bar. Use healing items or abilities when your health gets low.',
                type: 'interactive_demo',
                voiceover: 'health_management',
                duration: 18000,
                interactive: true,
                requirements: ['health_check_performed'],
                rewards: { experience: 45 },
                warnings: ['don\'t_ignore_low_health', 'don\'t_overheal']
            },
            {
                id: 10,
                phase: 'combat_basics',
                title: 'Positioning',
                content: 'Positioning is crucial in combat. Stay at optimal range and use terrain to your advantage.',
                type: 'strategic_demo',
                voiceover: 'combat_positioning',
                duration: 22000,
                interactive: true,
                requirements: ['positioning_demonstrated'],
                rewards: { experience: 55 },
                warnings: ['don\'t_stand_in_fire', 'don\'t_cluster_with_enemies']
            },
            {
                id: 11,
                phase: 'combat_basics',
                title: 'Multiple Enemies',
                content: 'When fighting multiple enemies, prioritize threats and manage your attention.',
                type: 'advanced_demo',
                voiceover: 'multi_enemy_combat',
                duration: 25000,
                interactive: true,
                requirements: ['multi_target_handled'],
                rewards: { experience: 60 },
                warnings: ['don\'t_focus_one_enemy', 'don\'t_run_from_groups']
            },
            {
                id: 12,
                phase: 'combat_basics',
                title: 'Combat Summary',
                content: 'Great job! You\'ve learned the combat basics. Remember to stay aware and adapt to situations.',
                type: 'checkpoint',
                voiceover: 'combat_basics_complete',
                duration: 15000,
                interactive: false,
                requirements: [],
                rewards: { experience: 75 },
                warnings: []
            },

            // Phase 3: Advanced Strategies (Steps 13-19)
            {
                id: 13,
                phase: 'advanced_strategies',
                title: 'Resource Management',
                content: 'Managing your resources (mana, stamina, cooldowns) is key to sustained performance.',
                type: 'educational',
                voiceover: 'resource_management',
                duration: 18000,
                interactive: false,
                requirements: [],
                rewards: { experience: 50 },
                warnings: []
            },
            {
                id: 14,
                phase: 'advanced_strategies',
                title: 'Ability Combinations',
                content: 'Learn to combine abilities effectively. Some abilities work better together.',
                type: 'interactive_demo',
                voiceover: 'ability_synergy',
                duration: 25000,
                interactive: true,
                requirements: ['combo_performed'],
                rewards: { experience: 70 },
                warnings: ['don\'t_waste_abilities', 'don\'t_use_wrong_combos']
            },
            {
                id: 15,
                phase: 'advanced_strategies',
                title: 'Environmental Awareness',
                content: 'Use the environment to your advantage. Objects, terrain, and hazards can help or hurt you.',
                type: 'strategic_demo',
                voiceover: 'environmental_tactics',
                duration: 20000,
                interactive: true,
                requirements: ['environment_utilized'],
                rewards: { experience: 65 },
                warnings: ['don\'t_ignore_hazards', 'don\'t_miss_opportunities']
            },
            {
                id: 16,
                phase: 'advanced_strategies',
                title: 'Team Coordination',
                content: 'When playing with others, coordinate your actions and communicate effectively.',
                type: 'social_demo',
                voiceover: 'team_coordination',
                duration: 22000,
                interactive: true,
                requirements: ['coordination_demonstrated'],
                rewards: { experience: 60 },
                warnings: ['don\'t_go_solo', 'don\'t_ignore_team']
            },
            {
                id: 17,
                phase: 'advanced_strategies',
                title: 'Decision Making',
                content: 'Learn to make quick, effective decisions in high-pressure situations.',
                type: 'scenario_demo',
                voiceover: 'decision_making',
                duration: 30000,
                interactive: true,
                requirements: ['decision_made'],
                rewards: { experience: 80 },
                warnings: ['don\'t_panic', 'don\'t_overthink']
            },
            {
                id: 18,
                phase: 'advanced_strategies',
                title: 'Adapting to Situations',
                content: 'Every situation is different. Learn to adapt your strategy based on changing circumstances.',
                type: 'adaptive_demo',
                voiceover: 'adaptive_strategies',
                duration: 28000,
                interactive: true,
                requirements: ['adaptation_demonstrated'],
                rewards: { experience: 75 },
                warnings: ['don\'t_use_same_tactic', 'don\'t_ignore_changes']
            },
            {
                id: 19,
                phase: 'advanced_strategies',
                title: 'Advanced Strategies Complete',
                content: 'Excellent progress! You\'re developing advanced gaming skills. Keep practicing!',
                type: 'checkpoint',
                voiceover: 'advanced_complete',
                duration: 15000,
                interactive: false,
                requirements: [],
                rewards: { experience: 100 },
                warnings: []
            },

            // Phase 4: ShadowWatch Features (Steps 20-25)
            {
                id: 20,
                phase: 'shadowwatch_features',
                title: 'ShadowWatch Training',
                content: 'I offer safe PvP training where you can practice combat without real consequences.',
                type: 'feature_intro',
                voiceover: 'training_introduction',
                duration: 18000,
                interactive: false,
                requirements: [],
                rewards: { experience: 40 },
                warnings: []
            },
            {
                id: 21,
                phase: 'shadowwatch_features',
                title: 'Requesting Training',
                content: 'You can request training sessions with other consenting players. Let\'s try requesting one.',
                type: 'interactive_demo',
                voiceover: 'training_request',
                duration: 20000,
                interactive: true,
                requirements: ['training_requested'],
                rewards: { experience: 50 },
                warnings: ['don\'t_spam_requests']
            },
            {
                id: 22,
                phase: 'shadowwatch_features',
                title: 'Personalized Guidance',
                content: 'I provide personalized tips based on your playing style and progress.',
                type: 'feature_demo',
                voiceover: 'personalized_guidance',
                duration: 15000,
                interactive: false,
                requirements: [],
                rewards: { experience: 45 },
                warnings: []
            },
            {
                id: 23,
                phase: 'shadowwatch_features',
                title: 'Progress Tracking',
                content: 'I track your progress and help you identify areas for improvement.',
                type: 'analytics_demo',
                voiceover: 'progress_tracking',
                duration: 17000,
                interactive: false,
                requirements: [],
                rewards: { experience: 50 },
                warnings: []
            },
            {
                id: 24,
                phase: 'shadowwatch_features',
                title: 'Community Features',
                content: 'Connect with other players through ShadowWatch features while maintaining privacy.',
                type: 'social_features',
                voiceover: 'community_features',
                duration: 19000,
                interactive: false,
                requirements: [],
                rewards: { experience: 55 },
                warnings: []
            },
            {
                id: 25,
                phase: 'shadowwatch_features',
                title: 'Tutorial Complete!',
                content: 'Congratulations! You\'ve completed the comprehensive tutorial. You\'re now ready to enjoy the game with ShadowWatch AI guidance.',
                type: 'completion',
                voiceover: 'tutorial_complete',
                duration: 25000,
                interactive: true,
                requirements: ['celebration_acknowledged'],
                rewards: { experience: 200, achievement: 'tutorial_master' },
                warnings: []
            }
        ];
    }

    // #endregion

    // #region Tutorial Session Management

    async startTutorial(userId, startStep = 1, options = {}) {
        try {
            // Check if tutorial already active
            if (this.activeTutorials.has(userId)) {
                return { success: false, error: 'Tutorial already active' };
            }

            // Get user progress
            const progress = this.getTutorialProgress(userId);

            // Determine starting step
            const actualStartStep = Math.max(startStep, progress.completedSteps.length + 1);

            if (actualStartStep > this.tutorialSteps.length) {
                return { success: false, error: 'Tutorial already completed' };
            }

            // Create tutorial session
            const session = {
                userId,
                currentStep: actualStartStep,
                startedAt: new Date(),
                lastActivity: new Date(),
                progress: progress,
                options: {
                    voiceEnabled: options.voiceEnabled ?? this.config.voiceEnabled,
                    skipEnabled: options.skipEnabled ?? this.config.skipEnabled,
                    adaptiveDifficulty: options.adaptiveDifficulty ?? this.config.adaptiveDifficulty,
                    ...options
                },
                stepAttempts: new Map(),
                warningsShown: new Set(),
                metrics: {
                    totalTime: 0,
                    stepsCompleted: 0,
                    hintsUsed: 0,
                    warningsTriggered: 0,
                    restarts: 0
                }
            };

            this.activeTutorials.set(userId, session);

            // Send first step
            await this.sendTutorialStep(session);

            // Log tutorial start
            await this.shadowwatch.logActivity(userId, 'tutorial_started', {
                startStep: actualStartStep,
                options: session.options
            });

            this.shadowwatch.log('info', 'Tutorial started', { userId, startStep: actualStartStep });

            return {
                success: true,
                sessionId: session.sessionId,
                currentStep: actualStartStep
            };

        } catch (error) {
            this.shadowwatch.log('error', 'Failed to start tutorial', { userId, error: error.message });
            return { success: false, error: 'Failed to start tutorial' };
        }
    }

    async progressTutorial(userId, action = 'next') {
        try {
            const session = this.activeTutorials.get(userId);
            if (!session) {
                return { success: false, error: 'No active tutorial session' };
            }

            const currentStep = this.tutorialSteps[session.currentStep - 1];
            if (!currentStep) {
                return { success: false, error: 'Invalid tutorial step' };
            }

            switch (action) {
                case 'next':
                    return await this.advanceTutorialStep(session);
                case 'previous':
                    return await this.goToPreviousStep(session);
                case 'skip':
                    return await this.skipTutorialStep(session);
                case 'restart':
                    return await this.restartTutorialStep(session);
                default:
                    return { success: false, error: 'Unknown action' };
            }

        } catch (error) {
            this.shadowwatch.log('error', 'Failed to progress tutorial', { userId, error: error.message });
            return { success: false, error: 'Failed to progress tutorial' };
        }
    }

    async advanceTutorialStep(session) {
        const currentStep = this.tutorialSteps[session.currentStep - 1];

        // Check if step requirements are met
        const requirementsMet = await this.checkStepRequirements(session.userId, currentStep);
        if (!requirementsMet) {
            // Show warning or hint
            await this.showStepWarning(session, currentStep);
            return { success: false, error: 'Step requirements not met' };
        }

        // Mark step as completed
        await this.completeTutorialStep(session, currentStep);

        // Move to next step
        session.currentStep++;
        session.lastActivity = new Date();

        if (session.currentStep > this.tutorialSteps.length) {
            // Tutorial completed
            return await this.completeTutorial(session);
        }

        // Send next step
        await this.sendTutorialStep(session);

        return {
            success: true,
            currentStep: session.currentStep,
            completedStep: currentStep.id
        };
    }

    async completeTutorial(session) {
        const userId = session.userId;
        const completionTime = Date.now() - session.startedAt.getTime();

        // Update progress
        const progress = this.getTutorialProgress(userId);
        progress.completed = true;
        progress.completedAt = new Date();
        progress.totalTime = (progress.totalTime || 0) + completionTime;
        progress.completions = (progress.completions || 0) + 1;

        this.tutorialProgress.set(userId, progress);

        // Calculate final metrics
        const finalMetrics = {
            totalTime: completionTime,
            stepsCompleted: session.currentStep - 1,
            hintsUsed: session.metrics.hintsUsed,
            warningsTriggered: session.metrics.warningsTriggered,
            restarts: session.metrics.restarts,
            averageTimePerStep: completionTime / (session.currentStep - 1),
            completionRate: ((session.currentStep - 1) / this.tutorialSteps.length) * 100
        };

        // Send completion message
        await this.sendTutorialCompletion(session, finalMetrics);

        // Update analytics
        this.updateTutorialAnalytics(session, finalMetrics);

        // Clean up session
        this.activeTutorials.delete(userId);

        // Log completion
        await this.shadowwatch.logActivity(userId, 'tutorial_completed', finalMetrics);

        this.shadowwatch.log('info', 'Tutorial completed', { userId, metrics: finalMetrics });

        return {
            success: true,
            completed: true,
            metrics: finalMetrics
        };
    }

    async pauseTutorial(userId) {
        const session = this.activeTutorials.get(userId);
        if (!session) return false;

        session.paused = true;
        session.pausedAt = new Date();

        await this.shadowwatch.logActivity(userId, 'tutorial_paused', {
            step: session.currentStep,
            totalTime: session.metrics.totalTime
        });

        return true;
    }

    async resumeTutorial(userId) {
        const session = this.activeTutorials.get(userId);
        if (!session || !session.paused) return false;

        session.paused = false;
        session.resumedAt = new Date();

        await this.sendTutorialStep(session);

        await this.shadowwatch.logActivity(userId, 'tutorial_resumed', {
            step: session.currentStep
        });

        return true;
    }

    async cancelTutorial(userId) {
        const session = this.activeTutorials.get(userId);
        if (!session) return false;

        const progress = this.getTutorialProgress(userId);
        progress.cancelledAt = new Date();
        progress.lastStepReached = session.currentStep;

        this.activeTutorials.delete(userId);

        await this.shadowwatch.logActivity(userId, 'tutorial_cancelled', {
            step: session.currentStep,
            totalTime: session.metrics.totalTime
        });

        this.shadowwatch.log('info', 'Tutorial cancelled', { userId, step: session.currentStep });

        return true;
    }

    // #endregion

    // #region Step Processing

    async sendTutorialStep(session) {
        const step = this.tutorialSteps[session.currentStep - 1];
        if (!step) return;

        const stepMessage = {
            type: 'tutorial_step',
            step: step,
            currentStep: session.currentStep,
            totalSteps: this.tutorialSteps.length,
            progress: this.calculateProgress(session),
            voiceover: session.options.voiceEnabled ? step.voiceover : null,
            interactive: step.interactive,
            requirements: step.requirements,
            warnings: this.getRelevantWarnings(session, step)
        };

        const userSession = this.shadowwatch.connectedUsers.get(session.userId);
        if (userSession) {
            userSession.socket.emit('tutorial_update', stepMessage);

            // Start step timer for duration tracking
            this.startStepTimer(session, step);
        }

        await this.shadowwatch.logActivity(session.userId, 'tutorial_step_shown', {
            stepId: step.id,
            stepTitle: step.title
        });
    }

    startStepTimer(session, step) {
        if (session.stepTimer) {
            clearTimeout(session.stepTimer);
        }

        session.stepTimer = setTimeout(async () => {
            // Step timed out - show hint or advance
            if (this.activeTutorials.has(session.userId)) {
                await this.handleStepTimeout(session, step);
            }
        }, step.duration);
    }

    async handleStepTimeout(session, step) {
        const attempts = session.stepAttempts.get(step.id) || 0;
        session.stepAttempts.set(step.id, attempts + 1);

        if (attempts < 2) {
            // Show hint
            await this.showStepHint(session, step);
            session.metrics.hintsUsed++;
        } else {
            // Force advance or show strong warning
            await this.showStepWarning(session, step, true);
        }
    }

    async checkStepRequirements(userId, step) {
        // This would integrate with game state checking
        // For now, we'll simulate based on step type
        const requirements = step.requirements;

        for (const requirement of requirements) {
            switch (requirement) {
                case 'consent_acknowledged':
                    // Check if user acknowledged privacy consent
                    const userSession = this.shadowwatch.connectedUsers.get(userId);
                    if (!userSession?.userData?.consentAcknowledged) {
                        return false;
                    }
                    break;
                case 'movement_demonstrated':
                case 'action_performed':
                case 'target_selected':
                case 'attack_landed':
                case 'health_check_performed':
                case 'positioning_demonstrated':
                case 'multi_target_handled':
                case 'combo_performed':
                case 'environment_utilized':
                case 'coordination_demonstrated':
                case 'decision_made':
                case 'adaptation_demonstrated':
                case 'training_requested':
                case 'celebration_acknowledged':
                    // These would be checked based on actual game actions
                    // For demo purposes, we'll assume they're met after some time
                    return true;
                default:
                    return true;
            }
        }

        return true;
    }

    async completeTutorialStep(session, step) {
        const userId = session.userId;

        // Update progress
        const progress = this.getTutorialProgress(userId);
        if (!progress.completedSteps.includes(step.id)) {
            progress.completedSteps.push(step.id);
            progress.lastCompletedStep = step.id;
            progress.lastCompletedAt = new Date();
        }

        // Award rewards
        await this.awardStepRewards(userId, step.rewards);

        // Update metrics
        session.metrics.stepsCompleted++;

        // Clear step timer
        if (session.stepTimer) {
            clearTimeout(session.stepTimer);
            session.stepTimer = null;
        }

        await this.shadowwatch.logActivity(userId, 'tutorial_step_completed', {
            stepId: step.id,
            stepTitle: step.title,
            rewards: step.rewards
        });
    }

    // #endregion

    // #region Warnings and Hints

    async showStepWarning(session, step, isStrong = false) {
        const warnings = this.getRelevantWarnings(session, step);
        if (warnings.length === 0) return;

        const warningMessage = {
            type: 'tutorial_warning',
            stepId: step.id,
            warnings: warnings,
            isStrong: isStrong,
            suggestion: isStrong ? 'Take a moment to review the step instructions.' : 'Try following the on-screen guidance.'
        };

        const userSession = this.shadowwatch.connectedUsers.get(session.userId);
        if (userSession) {
            userSession.socket.emit('tutorial_update', warningMessage);
        }

        session.metrics.warningsTriggered++;
        session.warningsShown.add(`${step.id}_${warnings[0]}`);

        await this.shadowwatch.logActivity(session.userId, 'tutorial_warning_shown', {
            stepId: step.id,
            warnings: warnings,
            isStrong: isStrong
        });
    }

    async showStepHint(session, step) {
        const hintMessage = {
            type: 'tutorial_hint',
            stepId: step.id,
            hint: this.generateStepHint(step),
            suggestion: 'Follow the highlighted areas on your screen.'
        };

        const userSession = this.shadowwatch.connectedUsers.get(session.userId);
        if (userSession) {
            userSession.socket.emit('tutorial_update', hintMessage);
        }

        await this.shadowwatch.logActivity(session.userId, 'tutorial_hint_shown', {
            stepId: step.id,
            hintType: 'progression'
        });
    }

    getRelevantWarnings(session, step) {
        const warnings = step.warnings || [];
        const attempts = session.stepAttempts.get(step.id) || 0;

        // Return warnings based on attempts and step type
        if (attempts >= this.config.warningThreshold) {
            return warnings;
        }

        return [];
    }

    generateStepHint(step) {
        const hints = {
            movement_demonstrated: 'Use WASD keys to move your character around the area.',
            action_performed: 'Click on objects or use your abilities to interact with the game world.',
            target_selected: 'Click directly on enemies to select them as targets.',
            attack_landed: 'Target an enemy first, then use your attack ability.',
            health_check_performed: 'Look at the health bar in the top left of your screen.',
            positioning_demonstrated: 'Move closer or farther from enemies to find optimal combat range.',
            multi_target_handled: 'Attack one enemy, then quickly switch to another.',
            combo_performed: 'Use two different abilities in sequence for bonus effects.',
            environment_utilized: 'Position behind cover or use terrain features during combat.',
            coordination_demonstrated: 'Time your actions to support group objectives.',
            decision_made: 'Choose the best action based on the current situation.',
            adaptation_demonstrated: 'Change your strategy when the situation changes.',
            training_requested: 'Look for the training button in the game menu.',
            celebration_acknowledged: 'Click the celebration button to complete the tutorial!'
        };

        return hints[step.requirements?.[0]] || 'Follow the on-screen instructions carefully.';
    }

    // #endregion

    // #region Progress and Analytics

    getTutorialProgress(userId) {
        return this.tutorialProgress.get(userId) || {
            userId,
            started: false,
            completed: false,
            completedSteps: [],
            lastCompletedStep: 0,
            totalTime: 0,
            completions: 0,
            startedAt: null,
            completedAt: null,
            cancelledAt: null,
            lastStepReached: 0,
            lastCompletedAt: null
        };
    }

    calculateProgress(session) {
        const completedSteps = session.progress.completedSteps.length;
        const totalSteps = this.tutorialSteps.length;

        return {
            completed: completedSteps,
            total: totalSteps,
            percentage: Math.round((completedSteps / totalSteps) * 100),
            currentPhase: this.getCurrentPhase(session.currentStep),
            estimatedTimeRemaining: this.estimateTimeRemaining(session)
        };
    }

    getCurrentPhase(stepNumber) {
        if (stepNumber <= 5) return 'introduction';
        if (stepNumber <= 12) return 'combat_basics';
        if (stepNumber <= 19) return 'advanced_strategies';
        return 'shadowwatch_features';
    }

    estimateTimeRemaining(session) {
        const remainingSteps = this.tutorialSteps.length - session.currentStep + 1;
        const avgStepTime = 20000; // 20 seconds average
        return remainingSteps * avgStepTime;
    }

    async awardStepRewards(userId, rewards) {
        if (!rewards) return;

        // This would integrate with the game's reward system
        // For now, we'll just log the rewards
        await this.shadowwatch.logActivity(userId, 'tutorial_rewards_awarded', { rewards });

        // Send reward notification
        const userSession = this.shadowwatch.connectedUsers.get(userId);
        if (userSession) {
            userSession.socket.emit('tutorial_update', {
                type: 'rewards_awarded',
                rewards: rewards
            });
        }
    }

    updateTutorialAnalytics(session, finalMetrics) {
        const tutorialId = 'main_tutorial';

        const currentAnalytics = this.tutorialAnalytics.get(tutorialId) || {
            completions: 0,
            totalTime: 0,
            avgCompletionTime: 0,
            avgStepsCompleted: 0,
            totalHintsUsed: 0,
            totalWarningsTriggered: 0,
            completionRate: 0
        };

        currentAnalytics.completions++;
        currentAnalytics.totalTime += finalMetrics.totalTime;
        currentAnalytics.avgCompletionTime = currentAnalytics.totalTime / currentAnalytics.completions;
        currentAnalytics.avgStepsCompleted = ((currentAnalytics.avgStepsCompleted * (currentAnalytics.completions - 1)) + finalMetrics.stepsCompleted) / currentAnalytics.completions;
        currentAnalytics.totalHintsUsed += finalMetrics.hintsUsed;
        currentAnalytics.totalWarningsTriggered += finalMetrics.warningsTriggered;
        currentAnalytics.completionRate = (currentAnalytics.completions / currentAnalytics.completions) * 100; // Could track starts vs completions

        this.tutorialAnalytics.set(tutorialId, currentAnalytics);
    }

    // #endregion

    // #region Utility Methods

    async sendTutorialReminders() {
        const now = new Date();

        for (const [userId, progress] of this.tutorialProgress) {
            if (progress.completed) continue;

            const userSession = this.shadowwatch.connectedUsers.get(userId);
            if (!userSession) continue;

            // Check if reminder is needed
            const timeSinceLastActivity = now.getTime() - (progress.lastCompletedAt?.getTime() || progress.startedAt?.getTime() || 0);
            const reminderThreshold = this.config.reminderInterval * 60 * 1000;

            if (timeSinceLastActivity > reminderThreshold) {
                userSession.socket.emit('tutorial_update', {
                    type: 'tutorial_reminder',
                    message: 'Ready to continue your tutorial? Your gaming skills are waiting!',
                    progress: {
                        completed: progress.completedSteps.length,
                        total: this.tutorialSteps.length,
                        lastCompletedStep: progress.lastCompletedStep
                    }
                });

                await this.shadowwatch.logActivity(userId, 'tutorial_reminder_sent', {
                    timeSinceLastActivity: Math.floor(timeSinceLastActivity / 1000 / 60) // minutes
                });
            }
        }
    }

    async sendTutorialCompletion(session, metrics) {
        const completionMessage = {
            type: 'tutorial_completed',
            metrics: metrics,
            achievements: [
                {
                    id: 'tutorial_master',
                    title: 'Tutorial Master',
                    description: 'Completed the comprehensive ShadowWatch tutorial',
                    icon: '🎓'
                }
            ],
            nextSteps: [
                'Try ShadowWatch training sessions',
                'Explore advanced game features',
                'Connect with other players'
            ]
        };

        const userSession = this.shadowwatch.connectedUsers.get(session.userId);
        if (userSession) {
            userSession.socket.emit('tutorial_update', completionMessage);
        }
    }

    cleanupExpiredTutorials() {
        const now = Date.now();
        const expiredSessions = [];

        for (const [userId, session] of this.activeTutorials) {
            const elapsed = now - session.startedAt.getTime();
            if (elapsed > this.config.maxTutorialDuration) {
                expiredSessions.push(userId);
            }
        }

        expiredSessions.forEach(userId => {
            this.cancelTutorial(userId);
        });

        if (expiredSessions.length > 0) {
            this.shadowwatch.log('info', 'Cleaned up expired tutorial sessions', { count: expiredSessions.length });
        }
    }

    // #endregion

    // #region Public API

    async handleTutorialProgress(userId, step, completed) {
        // Called by ShadowWatch when tutorial progress events occur
        const session = this.activeTutorials.get(userId);
        if (!session) return;

        if (completed && step === session.currentStep) {
            await this.progressTutorial(userId, 'next');
        }
    }

    async getTutorialStatus(userId) {
        const session = this.activeTutorials.get(userId);
        const progress = this.getTutorialProgress(userId);

        return {
            active: !!session,
            currentStep: session?.currentStep || 0,
            progress: this.calculateProgress(session || { currentStep: progress.completedSteps.length + 1, progress }),
            completed: progress.completed,
            canStart: !session && !progress.completed,
            canResume: !!session && session.paused,
            canRestart: progress.completedSteps.length > 0
        };
    }

    async skipToStep(userId, stepNumber) {
        const session = this.activeTutorials.get(userId);
        if (!session) return false;

        if (stepNumber < 1 || stepNumber > this.tutorialSteps.length) {
            return false;
        }

        session.currentStep = stepNumber;
        session.metrics.restarts++;

        await this.sendTutorialStep(session);

        await this.shadowwatch.logActivity(userId, 'tutorial_step_skipped', {
            fromStep: session.currentStep,
            toStep: stepNumber
        });

        return true;
    }

    getTutorialAnalytics() {
        return Object.fromEntries(this.tutorialAnalytics);
    }

    // #endregion
}

export default TutorialSystem;

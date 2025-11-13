/**
 * ShadowWatch AI - Attack Training System
 * Safe PvP practice environment with consent-based matching
 */

class AttackTrainer {
    constructor(shadowwatchInstance) {
        this.shadowwatch = shadowwatchInstance;
        this.activeTrainingSessions = new Map();
        this.trainingQueue = new Map(); // userId -> training preferences
        this.sessionHistory = new Map(); // sessionId -> training data
        this.skillMetrics = new Map(); // userId -> skill progression data

        // Training configuration
        this.config = {
            maxSessionDuration: 30 * 60 * 1000, // 30 minutes
            maxConcurrentSessions: parseInt(process.env.ATTACK_TRAINING_MAX_SESSIONS) || 100,
            consentRequired: process.env.ATTACK_TRAINING_CONSENT_REQUIRED !== 'false',
            damageMultiplier: 0.1, // 10% of real damage for training
            experienceMultiplier: 0.5, // 50% experience gain
            cooldownReduction: 0.8, // 20% faster cooldowns
            autoMatchmaking: true,
            skillAssessmentInterval: 5 * 60 * 1000 // Assess skills every 5 minutes
        };

        // Combat balance constants
        this.combatBalance = {
            healthRegenRate: 0.02, // 2% health regen per second in training
            staminaRegenRate: 0.05, // 5% stamina regen per second
            accuracyModifier: 0.9, // 90% accuracy for more skill-based combat
            criticalHitChance: 0.15, // 15% crit chance
            dodgeChance: 0.10 // 10% dodge chance
        };

        // Initialize training system
        this.initializeTrainingSystem();
        this.shadowwatch.log('info', 'Attack Trainer initialized');
    }

    // #region Initialization

    initializeTrainingSystem() {
        // Set up periodic skill assessment
        setInterval(() => {
            this.performSkillAssessment();
        }, this.config.skillAssessmentInterval);

        // Clean up expired sessions
        setInterval(() => {
            this.cleanupExpiredSessions();
        }, 60 * 1000); // Every minute
    }

    // #endregion

    // #region Training Session Management

    async requestTrainingSession(userId, preferences = {}) {
        try {
            // Check if user is already in training
            if (this.activeTrainingSessions.has(userId)) {
                return {
                    success: false,
                    error: 'User already in active training session'
                };
            }

            // Check consent if required
            if (this.config.consentRequired) {
                const hasConsent = await this.checkTrainingConsent(userId);
                if (!hasConsent) {
                    return {
                        success: false,
                        error: 'Training consent required',
                        action: 'request_consent'
                    };
                }
            }

            // Validate preferences
            const validatedPreferences = this.validateTrainingPreferences(preferences);

            // Add to training queue
            this.trainingQueue.set(userId, {
                userId,
                preferences: validatedPreferences,
                queuedAt: new Date(),
                skillLevel: await this.getUserSkillLevel(userId)
            });

            // Attempt immediate matchmaking
            const matchResult = await this.attemptMatchmaking(userId);

            if (matchResult.success) {
                return {
                    success: true,
                    sessionId: matchResult.sessionId,
                    opponent: matchResult.opponent,
                    trainingMode: validatedPreferences.mode
                };
            } else {
                return {
                    success: true,
                    status: 'queued',
                    estimatedWaitTime: this.calculateWaitTime(userId),
                    queuePosition: this.getQueuePosition(userId)
                };
            }

        } catch (error) {
            this.shadowwatch.log('error', 'Failed to request training session', { userId, error: error.message });
            return {
                success: false,
                error: 'Internal training system error'
            };
        }
    }

    async startTrainingSession(player1Id, player2Id, preferences = {}) {
        try {
            // Check session limits
            if (this.activeTrainingSessions.size >= this.config.maxConcurrentSessions) {
                return { success: false, error: 'Training system at capacity' };
            }

            const sessionId = `training_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Initialize combatants
            const combatants = await this.initializeCombatants(player1Id, player2Id, preferences);

            const session = {
                sessionId,
                players: [player1Id, player2Id],
                combatants,
                preferences,
                startedAt: new Date(),
                lastActivity: new Date(),
                status: 'active',
                rounds: [],
                winner: null,
                trainingMetrics: {
                    totalActions: 0,
                    avgResponseTime: 0,
                    skillDemonstrated: {},
                    learningOpportunities: []
                }
            };

            // Store session
            this.activeTrainingSessions.set(sessionId, session);
            this.activeTrainingSessions.set(player1Id, sessionId);
            this.activeTrainingSessions.set(player2Id, sessionId);

            // Notify players
            await this.notifySessionStart(session);

            // Start session timer
            this.startSessionTimer(sessionId);

            // Log training session start
            await this.shadowwatch.logActivity(player1Id, 'training_session_start', {
                sessionId,
                opponentId: player2Id,
                mode: preferences.mode
            });
            await this.shadowwatch.logActivity(player2Id, 'training_session_start', {
                sessionId,
                opponentId: player1Id,
                mode: preferences.mode
            });

            this.shadowwatch.log('info', 'Training session started', { sessionId, players: [player1Id, player2Id] });

            return {
                success: true,
                sessionId,
                session
            };

        } catch (error) {
            this.shadowwatch.log('error', 'Failed to start training session', { player1Id, player2Id, error: error.message });
            return { success: false, error: 'Failed to initialize training session' };
        }
    }

    async endTrainingSession(sessionId, winner = null, reason = 'completed') {
        try {
            const session = this.activeTrainingSessions.get(sessionId);
            if (!session) return;

            session.status = 'completed';
            session.endedAt = new Date();
            session.winner = winner;
            session.endReason = reason;

            // Calculate final metrics
            const finalMetrics = await this.calculateSessionMetrics(session);

            // Update skill levels
            await this.updateSkillLevels(session, finalMetrics);

            // Store session history
            this.sessionHistory.set(sessionId, {
                ...session,
                finalMetrics
            });

            // Notify players
            await this.notifySessionEnd(session, finalMetrics);

            // Clean up active sessions
            session.players.forEach(playerId => {
                this.activeTrainingSessions.delete(playerId);
            });
            this.activeTrainingSessions.delete(sessionId);

            // Remove from queues if applicable
            session.players.forEach(playerId => {
                this.trainingQueue.delete(playerId);
            });

            // Log completion
            await this.shadowwatch.logActivity(session.players[0], 'training_session_end', {
                sessionId,
                winner,
                reason,
                duration: session.endedAt - session.startedAt,
                metrics: finalMetrics
            });

            this.shadowwatch.log('info', 'Training session ended', { sessionId, winner, reason });

        } catch (error) {
            this.shadowwatch.log('error', 'Failed to end training session', { sessionId, error: error.message });
        }
    }

    // #endregion

    // #region Matchmaking

    async attemptMatchmaking(userId) {
        const userPrefs = this.trainingQueue.get(userId);
        if (!userPrefs) return { success: false };

        // Find suitable opponents
        const potentialOpponents = Array.from(this.trainingQueue.entries())
            .filter(([id, prefs]) => id !== userId && this.isCompatibleMatch(userPrefs, prefs))
            .sort((a, b) => this.calculateMatchScore(userPrefs, a[1]) - this.calculateMatchScore(userPrefs, b[1]));

        if (potentialOpponents.length === 0) {
            return { success: false };
        }

        // Try to match with best opponent
        const [opponentId, opponentPrefs] = potentialOpponents[0];

        // Start session with matched players
        const mergedPreferences = this.mergePreferences(userPrefs.preferences, opponentPrefs.preferences);
        const result = await this.startTrainingSession(userId, opponentId, mergedPreferences);

        if (result.success) {
            return {
                success: true,
                sessionId: result.sessionId,
                opponent: {
                    userId: opponentId,
                    skillLevel: opponentPrefs.skillLevel
                }
            };
        }

        return { success: false };
    }

    isCompatibleMatch(prefs1, prefs2) {
        // Check skill level compatibility (within 2 levels)
        const skillDiff = Math.abs(prefs1.skillLevel - prefs2.skillLevel);
        if (skillDiff > 2) return false;

        // Check mode compatibility
        if (prefs1.preferences.mode !== prefs2.preferences.mode) return false;

        // Check training type compatibility
        const types1 = new Set(prefs1.preferences.trainingTypes || []);
        const types2 = new Set(prefs2.preferences.trainingTypes || []);
        const commonTypes = [...types1].filter(type => types2.has(type));
        if (commonTypes.length === 0) return false;

        return true;
    }

    calculateMatchScore(userPrefs, opponentPrefs) {
        let score = 0;

        // Prefer similar skill levels
        score += Math.abs(userPrefs.skillLevel - opponentPrefs.skillLevel) * 10;

        // Prefer recent queue entries
        const timeDiff = Math.abs(userPrefs.queuedAt - opponentPrefs.queuedAt);
        score += timeDiff / 1000; // seconds difference

        return score;
    }

    calculateWaitTime(userId) {
        const queueLength = this.trainingQueue.size;
        const position = this.getQueuePosition(userId);

        // Estimate based on historical matchmaking success
        const avgWaitTime = Math.max(30, queueLength * 15); // 30 seconds minimum, 15s per queue member
        return Math.max(30, avgWaitTime - (position * 10));
    }

    getQueuePosition(userId) {
        const queueEntries = Array.from(this.trainingQueue.entries());
        const index = queueEntries.findIndex(([id]) => id === userId);
        return index + 1; // 1-based position
    }

    // #endregion

    // #region Combat Processing

    async processTrainingAction(userId, actionData) {
        try {
            const sessionId = this.activeTrainingSessions.get(userId);
            if (!sessionId || typeof sessionId !== 'string') return;

            const session = this.activeTrainingSessions.get(sessionId);
            if (!session || session.status !== 'active') return;

            // Validate action timing (prevent spamming)
            const now = Date.now();
            const lastAction = session.lastAction || 0;
            if (now - lastAction < 1000) { // 1 second cooldown
                return { success: false, error: 'Action too frequent' };
            }

            // Process the action
            const result = await this.executeCombatAction(session, userId, actionData);
            session.lastAction = now;
            session.lastActivity = new Date();

            // Check for session end conditions
            if (result.sessionEnd) {
                await this.endTrainingSession(sessionId, result.winner, result.endReason);
            }

            // Send results to both players
            await this.broadcastActionResults(session, result);

            // Update training metrics
            this.updateTrainingMetrics(session, userId, actionData, result);

            return { success: true, result };

        } catch (error) {
            this.shadowwatch.log('error', 'Failed to process training action', { userId, error: error.message });
            return { success: false, error: 'Action processing failed' };
        }
    }

    async executeCombatAction(session, userId, actionData) {
        const { actionType, targetId, parameters = {} } = actionData;

        // Get combatant data
        const attacker = session.combatants[userId];
        const target = session.combatants[targetId];

        if (!attacker || !target) {
            return { success: false, error: 'Invalid combatants' };
        }

        let result = { success: true, actionType, attacker: userId, target: targetId };

        switch (actionType) {
            case 'attack':
                result = await this.processAttack(session, attacker, target, parameters);
                break;
            case 'defend':
                result = await this.processDefense(session, attacker, parameters);
                break;
            case 'special_ability':
                result = await this.processSpecialAbility(session, attacker, target, parameters);
                break;
            case 'heal':
                result = await this.processHeal(session, attacker, parameters);
                break;
            default:
                result = { success: false, error: 'Unknown action type' };
        }

        // Record action in session
        session.rounds.push({
            timestamp: new Date(),
            action: result,
            roundNumber: session.rounds.length + 1
        });

        // Check win conditions
        const winCheck = this.checkWinConditions(session);
        if (winCheck.gameOver) {
            result.sessionEnd = true;
            result.winner = winCheck.winner;
            result.endReason = winCheck.reason;
        }

        return result;
    }

    async processAttack(session, attacker, target, parameters) {
        // Calculate hit chance
        const accuracy = this.calculateAccuracy(attacker, target, parameters);
        const hitRoll = Math.random();

        if (hitRoll > accuracy) {
            return {
                success: true,
                hit: false,
                damage: 0,
                message: 'Attack missed!'
            };
        }

        // Calculate damage
        const baseDamage = attacker.stats.attack * this.config.damageMultiplier;
        const damageMultiplier = this.calculateDamageMultiplier(attacker, target, parameters);
        const finalDamage = Math.round(baseDamage * damageMultiplier);

        // Apply damage
        const actualDamage = Math.min(finalDamage, target.currentHealth);
        target.currentHealth -= actualDamage;

        // Experience gain
        const expGain = Math.round(finalDamage * this.config.experienceMultiplier);
        attacker.experience += expGain;

        return {
            success: true,
            hit: true,
            damage: actualDamage,
            expGain,
            critical: damageMultiplier > 1.5,
            message: `Hit for ${actualDamage} damage!`
        };
    }

    async processDefense(session, defender, parameters) {
        // Apply defensive buffs
        defender.defenseBuff = (defender.defenseBuff || 0) + 0.2; // 20% defense increase
        defender.buffDuration = 3; // 3 rounds

        return {
            success: true,
            buffApplied: 'defense',
            duration: 3,
            message: 'Defense stance activated!'
        };
    }

    async processSpecialAbility(session, attacker, target, parameters) {
        const { abilityId } = parameters;
        const ability = this.getAbilityData(abilityId);

        if (!ability || !attacker.abilities.includes(abilityId)) {
            return { success: false, error: 'Ability not available' };
        }

        // Check cooldown
        if (attacker.abilityCooldowns?.[abilityId] > 0) {
            return { success: false, error: 'Ability on cooldown' };
        }

        // Execute ability
        const result = await ability.execute(attacker, target, session);

        // Set cooldown
        attacker.abilityCooldowns = attacker.abilityCooldowns || {};
        attacker.abilityCooldowns[abilityId] = ability.cooldown;

        return {
            success: true,
            ability: abilityId,
            ...result,
            message: `${ability.name} activated!`
        };
    }

    async processHeal(session, healer, parameters) {
        const healAmount = Math.round(healer.stats.maxHealth * 0.15); // 15% of max health
        const actualHeal = Math.min(healAmount, healer.stats.maxHealth - healer.currentHealth);

        healer.currentHealth += actualHeal;

        return {
            success: true,
            healAmount: actualHeal,
            message: `Healed for ${actualHeal} health!`
        };
    }

    // #endregion

    // #region Combat Calculations

    calculateAccuracy(attacker, target, parameters) {
        let accuracy = this.combatBalance.accuracyModifier;

        // Attacker bonuses
        accuracy += attacker.stats.accuracy / 100;

        // Target penalties
        accuracy -= target.stats.evasion / 200;

        // Action modifiers
        if (parameters.powerAttack) accuracy -= 0.1; // Less accurate but more damage
        if (parameters.quickAttack) accuracy += 0.05; // More accurate but less damage

        return Math.max(0.1, Math.min(0.95, accuracy)); // Clamp between 10% and 95%
    }

    calculateDamageMultiplier(attacker, target, parameters) {
        let multiplier = 1.0;

        // Critical hits
        if (Math.random() < this.combatBalance.criticalHitChance) {
            multiplier *= 2.0;
        }

        // Power attack bonus
        if (parameters.powerAttack) {
            multiplier *= 1.5;
        }

        // Quick attack penalty
        if (parameters.quickAttack) {
            multiplier *= 0.8;
        }

        // Defense buff reduction
        if (target.defenseBuff && target.defenseBuff > 0) {
            multiplier *= (1 - target.defenseBuff);
            target.defenseBuff = Math.max(0, target.defenseBuff - 0.1); // Reduce buff
        }

        return multiplier;
    }

    checkWinConditions(session) {
        const players = Object.values(session.combatants);
        const alivePlayers = players.filter(p => p.currentHealth > 0);

        if (alivePlayers.length <= 1) {
            return {
                gameOver: true,
                winner: alivePlayers[0]?.userId || null,
                reason: alivePlayers.length === 0 ? 'mutual_elimination' : 'elimination'
            };
        }

        // Check time limit
        const elapsed = Date.now() - session.startedAt.getTime();
        if (elapsed > this.config.maxSessionDuration) {
            // Determine winner by remaining health percentage
            const winner = players.reduce((best, current) => {
                const bestHealthPercent = best.currentHealth / best.stats.maxHealth;
                const currentHealthPercent = current.currentHealth / current.stats.maxHealth;
                return currentHealthPercent > bestHealthPercent ? current : best;
            });

            return {
                gameOver: true,
                winner: winner.userId,
                reason: 'time_limit'
            };
        }

        return { gameOver: false };
    }

    // #endregion

    // #region Session Management Helpers

    async initializeCombatants(player1Id, player2Id, preferences) {
        const [stats1, stats2] = await Promise.all([
            this.getPlayerCombatStats(player1Id),
            this.getPlayerCombatStats(player2Id)
        ]);

        return {
            [player1Id]: {
                userId: player1Id,
                currentHealth: stats1.maxHealth,
                stats: stats1,
                experience: 0,
                abilityCooldowns: {},
                buffs: {},
                position: { x: 0, y: 0 } // For positional combat if implemented
            },
            [player2Id]: {
                userId: player2Id,
                currentHealth: stats2.maxHealth,
                stats: stats2,
                experience: 0,
                abilityCooldowns: {},
                buffs: {},
                position: { x: 10, y: 0 }
            }
        };
    }

    async getPlayerCombatStats(userId) {
        // Get from ShadowWatch user data or default stats
        const session = this.shadowwatch.connectedUsers.get(userId);
        const userStats = session?.stats || {};

        return {
            maxHealth: userStats.maxHealth || 1000,
            attack: userStats.attack || 50,
            defense: userStats.defense || 30,
            accuracy: userStats.accuracy || 75,
            evasion: userStats.evasion || 10,
            speed: userStats.speed || 50,
            level: userStats.level || 1
        };
    }

    validateTrainingPreferences(preferences) {
        return {
            mode: preferences.mode || 'casual', // casual, ranked, practice
            trainingTypes: preferences.trainingTypes || ['combat_basics'],
            difficulty: preferences.difficulty || 'normal',
            duration: Math.min(preferences.duration || 30, 60), // Max 60 minutes
            allowAbilities: preferences.allowAbilities !== false,
            allowHealing: preferences.allowHealing !== false
        };
    }

    mergePreferences(prefs1, prefs2) {
        return {
            mode: prefs1.mode === prefs2.mode ? prefs1.mode : 'casual',
            trainingTypes: [...new Set([...(prefs1.trainingTypes || []), ...(prefs2.trainingTypes || [])])],
            difficulty: prefs1.difficulty === prefs2.difficulty ? prefs1.difficulty : 'normal',
            allowAbilities: prefs1.allowAbilities && prefs2.allowAbilities,
            allowHealing: prefs1.allowHealing && prefs2.allowHealing
        };
    }

    startSessionTimer(sessionId) {
        const session = this.activeTrainingSessions.get(sessionId);
        if (!session) return;

        session.timer = setTimeout(async () => {
            if (this.activeTrainingSessions.has(sessionId)) {
                await this.endTrainingSession(sessionId, null, 'time_limit');
            }
        }, this.config.maxSessionDuration);
    }

    // #endregion

    // #region Notifications

    async notifySessionStart(session) {
        const startMessage = {
            type: 'training_session_start',
            sessionId: session.sessionId,
            opponent: session.players.find(id => id !== 'temp'), // Exclude temp players
            preferences: session.preferences,
            combatants: session.combatants
        };

        for (const playerId of session.players) {
            const playerSession = this.shadowwatch.connectedUsers.get(playerId);
            if (playerSession) {
                playerSession.socket.emit('training_update', startMessage);
            }
        }
    }

    async notifySessionEnd(session, finalMetrics) {
        const endMessage = {
            type: 'training_session_end',
            sessionId: session.sessionId,
            winner: session.winner,
            reason: session.endReason,
            metrics: finalMetrics,
            duration: session.endedAt - session.startedAt
        };

        for (const playerId of session.players) {
            const playerSession = this.shadowwatch.connectedUsers.get(playerId);
            if (playerSession) {
                playerSession.socket.emit('training_update', endMessage);
            }
        }
    }

    async broadcastActionResults(session, result) {
        const actionMessage = {
            type: 'training_action_result',
            ...result,
            timestamp: new Date(),
            combatants: session.combatants
        };

        for (const playerId of session.players) {
            const playerSession = this.shadowwatch.connectedUsers.get(playerId);
            if (playerSession) {
                playerSession.socket.emit('training_update', actionMessage);
            }
        }
    }

    // #endregion

    // #region Analytics & Metrics

    updateTrainingMetrics(session, userId, actionData, result) {
        const metrics = session.trainingMetrics;

        metrics.totalActions++;

        // Track response times (would need action timestamps)
        // Track skill demonstrations
        if (result.hit !== undefined) {
            metrics.skillDemonstrated.accuracy = (metrics.skillDemonstrated.accuracy || 0) + (result.hit ? 1 : 0);
            metrics.skillDemonstrated.attacks = (metrics.skillDemonstrated.attacks || 0) + 1;
        }

        // Track learning opportunities
        if (!result.hit && result.damage === 0) {
            metrics.learningOpportunities.push({
                type: 'miss_opportunity',
                timestamp: new Date(),
                suggestion: 'Consider improving accuracy or using different attack type'
            });
        }
    }

    async calculateSessionMetrics(session) {
        const metrics = session.trainingMetrics;
        const duration = (session.endedAt - session.startedAt) / 1000; // seconds

        return {
            duration,
            totalActions: metrics.totalActions,
            actionsPerMinute: metrics.totalActions / (duration / 60),
            accuracy: metrics.skillDemonstrated.accuracy / metrics.skillDemonstrated.attacks,
            learningOpportunities: metrics.learningOpportunities.length,
            experienceGained: Object.values(session.combatants).reduce((sum, c) => sum + c.experience, 0),
            winner: session.winner,
            endReason: session.endReason
        };
    }

    async updateSkillLevels(session, finalMetrics) {
        for (const playerId of session.players) {
            const currentSkills = this.skillMetrics.get(playerId) || {
                overall: 0,
                accuracy: 0,
                timing: 0,
                strategy: 0,
                sessionsPlayed: 0
            };

            // Update skills based on performance
            const accuracy = finalMetrics.accuracy || 0;
            currentSkills.accuracy = (currentSkills.accuracy + accuracy) / 2; // Running average

            const actionsPerMinute = finalMetrics.actionsPerMinute || 0;
            currentSkills.timing = Math.min(1, currentSkills.timing + (actionsPerMinute / 100));

            currentSkills.sessionsPlayed++;

            // Overall skill is weighted average
            currentSkills.overall = (
                currentSkills.accuracy * 0.4 +
                currentSkills.timing * 0.3 +
                currentSkills.strategy * 0.3
            );

            this.skillMetrics.set(playerId, currentSkills);

            // Log skill update
            await this.shadowwatch.logActivity(playerId, 'skill_level_update', {
                newSkills: currentSkills,
                sessionId: session.sessionId
            });
        }
    }

    async getUserSkillLevel(userId) {
        const skills = this.skillMetrics.get(userId);
        return skills ? Math.floor(skills.overall * 10) + 1 : 1; // 1-10 scale
    }

    performSkillAssessment() {
        // Periodic skill reassessment based on recent performance
        // This could involve analyzing recent sessions and adjusting skill ratings
        this.shadowwatch.log('debug', 'Performing skill assessment for active users');
    }

    // #endregion

    // #region Utility Methods

    async checkTrainingConsent(userId) {
        // Check if user has consented to training
        // This would typically check a database field
        const session = this.shadowwatch.connectedUsers.get(userId);
        return session?.userData?.trainingConsent || false;
    }

    getAbilityData(abilityId) {
        // Define available abilities
        const abilities = {
            fireball: {
                id: 'fireball',
                name: 'Fireball',
                cooldown: 5, // rounds
                execute: async (attacker, target, session) => {
                    const damage = Math.round(attacker.stats.attack * 1.5 * this.config.damageMultiplier);
                    target.currentHealth -= damage;
                    return { damage, effect: 'burn' };
                }
            },
            heal: {
                id: 'heal',
                name: 'Heal',
                cooldown: 3,
                execute: async (attacker, target, session) => {
                    const healAmount = Math.round(attacker.stats.maxHealth * 0.2);
                    attacker.currentHealth = Math.min(attacker.stats.maxHealth, attacker.currentHealth + healAmount);
                    return { healAmount };
                }
            }
        };

        return abilities[abilityId];
    }

    cleanupExpiredSessions() {
        const now = Date.now();
        const expiredSessions = [];

        for (const [sessionId, session] of this.activeTrainingSessions) {
            if (typeof session === 'object' && session.startedAt) {
                const elapsed = now - session.startedAt.getTime();
                if (elapsed > this.config.maxSessionDuration + 60000) { // 1 minute grace period
                    expiredSessions.push(sessionId);
                }
            }
        }

        expiredSessions.forEach(sessionId => {
            this.endTrainingSession(sessionId, null, 'expired');
        });

        if (expiredSessions.length > 0) {
            this.shadowwatch.log('info', 'Cleaned up expired training sessions', { count: expiredSessions.length });
        }
    }

    // #endregion

    // #region Public API

    async getTrainingStats(userId) {
        const skillLevel = await this.getUserSkillLevel(userId);
        const recentSessions = Array.from(this.sessionHistory.values())
            .filter(session => session.players.includes(userId))
            .slice(-10); // Last 10 sessions

        const stats = {
            skillLevel,
            sessionsPlayed: recentSessions.length,
            recentPerformance: recentSessions.map(session => ({
                sessionId: session.sessionId,
                winner: session.winner === userId,
                duration: session.endedAt - session.startedAt,
                metrics: session.finalMetrics
            })),
            currentQueuePosition: this.getQueuePosition(userId),
            isInActiveSession: this.activeTrainingSessions.has(userId)
        };

        return stats;
    }

    async cancelTrainingRequest(userId) {
        const wasInQueue = this.trainingQueue.delete(userId);
        if (wasInQueue) {
            this.shadowwatch.log('info', 'User cancelled training request', { userId });
            return { success: true };
        }
        return { success: false, error: 'User not in training queue' };
    }

    // #endregion
}

export default AttackTrainer;

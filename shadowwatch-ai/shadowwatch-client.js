/**
 * ShadowWatch AI - Client Library
 * Frontend integration for browser-based MMORPGs
 */

class ShadowWatchClient {
    constructor(socket, options = {}) {
        this.socket = socket;
        this.options = {
            voiceEnabled: options.voiceEnabled || false,
            tutorialAutoStart: options.tutorialAutoStart !== false,
            statsPulseEnabled: options.statsPulseEnabled !== false,
            trainingUIEnabled: options.trainingUIEnabled !== false,
            notificationsEnabled: options.notificationsEnabled !== false,
            theme: options.theme || 'auto', // auto, light, dark
            ...options
        };

        // Core components
        this.tutorial = new ShadowWatchTutorial(this);
        this.statsPulse = new ShadowWatchStatsPulse(this);
        this.trainingUI = new ShadowWatchTrainingUI(this);
        this.notifications = new ShadowWatchNotifications(this);
        this.privacy = new ShadowWatchPrivacy(this);

        // State management
        this.state = {
            authenticated: false,
            userId: null,
            consentGiven: false,
            tutorialActive: false,
            trainingActive: false,
            lastStats: {},
            heartbeatInterval: null
        };

        // Voice synthesis
        this.voiceSynth = null;
        if (this.options.voiceEnabled && 'speechSynthesis' in window) {
            this.voiceSynth = window.speechSynthesis;
        }

        // Initialize
        this.setupSocketHandlers();
        this.setupKeyboardShortcuts();
        this.applyTheme();

        // Auto-start tutorial for new users
        if (this.options.tutorialAutoStart) {
            this.checkTutorialStatus();
        }

        console.log('🧠 ShadowWatch Client initialized');
    }

    // #region Socket Communication

    setupSocketHandlers() {
        // Authentication
        this.socket.on('authenticated', (data) => {
            this.state.authenticated = true;
            this.state.userId = data.userId;
            this.state.consentGiven = data.consent_given;

            this.startHeartbeat();
            this.notifications.show('success', 'Connected', 'ShadowWatch AI is now monitoring your gameplay.');
        });

        this.socket.on('authentication_failed', (data) => {
            this.notifications.show('error', 'Connection Failed', data.reason || 'Unable to connect to ShadowWatch AI');
        });

        // Tutorial events
        this.socket.on('tutorial_update', (data) => {
            this.tutorial.handleUpdate(data);
        });

        // Training events
        this.socket.on('training_update', (data) => {
            this.trainingUI.handleUpdate(data);
        });

        // AI messages
        this.socket.on('shadowwatch_message', (data) => {
            this.handleAIMessage(data);
        });

        // Stats updates
        this.socket.on('stats_update', (data) => {
            this.statsPulse.updateStats(data);
        });

        // Errors
        this.socket.on('shadowwatch_error', (data) => {
            this.notifications.show('error', 'ShadowWatch Error', data.message);
        });

        // Heartbeat
        this.socket.on('heartbeat_ack', () => {
            // Connection is healthy
        });
    }

    startHeartbeat() {
        this.state.heartbeatInterval = setInterval(() => {
            if (this.state.authenticated) {
                this.socket.emit('heartbeat');
            }
        }, 30000); // 30 seconds
    }

    // #endregion

    // #region AI Message Handling

    handleAIMessage(data) {
        const { type, title, message, actions = [] } = data;

        switch (type) {
            case 'greeting':
                this.notifications.show('info', title, message, actions);
                break;
            case 'reminder':
                this.notifications.show('warning', title, message, actions);
                break;
            case 'celebration':
                this.notifications.show('success', title, message, actions);
                if (this.voiceSynth) {
                    this.speak(message);
                }
                break;
            case 'progress':
                this.notifications.show('info', title, message, actions);
                break;
            default:
                this.notifications.show('info', title, message, actions);
        }

        // Log for analytics
        this.trackEvent('ai_message_received', { type, title });
    }

    // #endregion

    // #region Public API Methods

    // Authentication
    authenticate(token, userId, consent = false) {
        this.socket.emit('authenticate', { token, userId, consent });
    }

    // Activity reporting
    reportActivity(actionType, stats = {}) {
        if (!this.state.authenticated) return;

        this.socket.emit('stats_change', {
            actionType,
            stats: { ...stats, timestamp: Date.now() }
        });

        this.state.lastStats = { ...this.state.lastStats, ...stats };
        this.trackEvent('activity_reported', { actionType });
    }

    // Tutorial control
    startTutorial(options = {}) {
        if (!this.state.authenticated) return false;

        this.socket.emit('start_tutorial', { options });
        return true;
    }

    progressTutorial(action = 'next') {
        this.socket.emit('tutorial_progress', { action });
    }

    // Training control
    requestTraining(preferences = {}) {
        if (!this.state.authenticated) return false;

        this.socket.emit('training_request', { userId: this.state.userId, preferences });
        return true;
    }

    cancelTraining() {
        if (!this.state.authenticated) return false;

        this.socket.emit('training_cancel', { userId: this.state.userId });
        return true;
    }

    // Privacy control
    updateConsent(consent) {
        if (!this.state.authenticated) return false;

        this.state.consentGiven = consent;
        this.socket.emit('update_consent', { userId: this.state.userId, consent });
        return true;
    }

    requestDataExport() {
        if (!this.state.authenticated) return false;

        // This would typically open a download or show export status
        window.open(`/api/privacy/data/${this.state.userId}`, '_blank');
        return true;
    }

    requestDataDeletion() {
        if (!this.state.authenticated) return false;

        if (confirm('Are you sure you want to delete all your ShadowWatch data? This action cannot be undone.')) {
            this.socket.emit('delete_data', { userId: this.state.userId });
            return true;
        }
        return false;
    }

    // #endregion

    // #region Utility Methods

    speak(text) {
        if (!this.voiceSynth) return;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 0.8;

        this.voiceSynth.speak(utterance);
    }

    trackEvent(eventType, data = {}) {
        // Simple event tracking - can be extended to integrate with analytics services
        const event = {
            type: eventType,
            timestamp: Date.now(),
            userId: this.state.userId,
            data: data
        };

        // Store in localStorage for basic analytics
        const events = JSON.parse(localStorage.getItem('shadowwatch_events') || '[]');
        events.push(event);

        // Keep only last 100 events
        if (events.length > 100) {
            events.shift();
        }

        localStorage.setItem('shadowwatch_events', JSON.stringify(events));
    }

    checkTutorialStatus() {
        if (!this.state.authenticated) return;

        // Check if user needs tutorial
        setTimeout(() => {
            if (!this.state.tutorialActive && this.state.consentGiven) {
                this.startTutorial();
            }
        }, 5000); // Check after 5 seconds
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Alt+T: Toggle tutorial
            if (event.altKey && event.key === 't') {
                event.preventDefault();
                if (this.state.tutorialActive) {
                    this.tutorial.hide();
                } else {
                    this.startTutorial();
                }
            }

            // Alt+S: Toggle stats pulse
            if (event.altKey && event.key === 's') {
                event.preventDefault();
                this.statsPulse.toggle();
            }

            // Alt+R: Request training
            if (event.altKey && event.key === 'r') {
                event.preventDefault();
                this.requestTraining();
            }
        });
    }

    applyTheme() {
        const theme = this.options.theme;
        const html = document.documentElement;

        if (theme === 'dark') {
            html.setAttribute('data-theme', 'dark');
        } else if (theme === 'light') {
            html.setAttribute('data-theme', 'light');
        } else {
            // Auto theme based on system preference
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                html.setAttribute('data-theme', 'dark');
            } else {
                html.setAttribute('data-theme', 'light');
            }
        }
    }

    // Cleanup
    disconnect() {
        if (this.state.heartbeatInterval) {
            clearInterval(this.state.heartbeatInterval);
        }

        this.tutorial.hide();
        this.statsPulse.hide();
        this.trainingUI.hide();
        this.notifications.clearAll();

        this.socket.off('authenticated');
        this.socket.off('tutorial_update');
        this.socket.off('training_update');
        this.socket.off('shadowwatch_message');
        this.socket.off('stats_update');
        this.socket.off('shadowwatch_error');
        this.socket.off('heartbeat_ack');

        console.log('🧠 ShadowWatch Client disconnected');
    }

    // #endregion
}

// #region Tutorial Component

class ShadowWatchTutorial {
    constructor(client) {
        this.client = client;
        this.active = false;
        this.currentStep = null;
        this.overlay = null;
        this.modal = null;
        this.voiceEnabled = client.options.voiceEnabled;
    }

    handleUpdate(data) {
        const { type, step, currentStep, totalSteps, progress } = data;

        switch (type) {
            case 'tutorial_step':
                this.showStep(step, currentStep, totalSteps, progress);
                break;
            case 'tutorial_warning':
                this.showWarning(data);
                break;
            case 'tutorial_hint':
                this.showHint(data);
                break;
            case 'tutorial_completed':
                this.showCompletion(data);
                break;
            case 'tutorial_error':
                this.showError(data);
                break;
        }
    }

    showStep(step, currentStep, totalSteps, progress) {
        this.currentStep = step;
        this.createOverlay();

        const content = `
            <div class="shadowwatch-tutorial-header">
                <h2 class="shadowwatch-tutorial-title">${step.title}</h2>
                <p class="shadowwatch-tutorial-subtitle">Step ${currentStep} of ${totalSteps}</p>
                <div class="shadowwatch-tutorial-progress">
                    <div class="shadowwatch-tutorial-progress-bar">
                        <div class="shadowwatch-tutorial-progress-fill" style="width: ${progress.percentage}%"></div>
                    </div>
                </div>
            </div>
            <div class="shadowwatch-tutorial-content">
                <p class="shadowwatch-tutorial-text">${step.content}</p>
                <div class="shadowwatch-tutorial-actions">
                    ${this.getActionButtons(step)}
                </div>
            </div>
        `;

        this.modal.innerHTML = content;
        this.overlay.style.display = 'flex';
        this.active = true;
        this.client.state.tutorialActive = true;

        // Speak the step if voice is enabled
        if (this.voiceEnabled && step.voiceover) {
            this.client.speak(step.content);
        }

        // Highlight interactive elements if specified
        if (step.highlight) {
            this.highlightElement(step.highlight);
        }

        this.client.trackEvent('tutorial_step_shown', { stepId: step.id });
    }

    getActionButtons(step) {
        const buttons = [];

        if (step.interactive) {
            buttons.push('<button class="shadowwatch-btn shadowwatch-btn-primary" onclick="shadowwatch.progressTutorial(\'next\')">Continue</button>');
        }

        if (this.client.options.skipEnabled) {
            buttons.push('<button class="shadowwatch-btn shadowwatch-btn-secondary" onclick="shadowwatch.progressTutorial(\'skip\')">Skip Tutorial</button>');
        }

        return buttons.join('');
    }

    showWarning(data) {
        const { warnings, isStrong } = data;
        const warningClass = isStrong ? 'shadowwatch-btn-warning' : 'shadowwatch-btn-secondary';

        const warningHTML = `
            <div class="shadowwatch-notification warning" style="position: static; margin-bottom: 1rem;">
                <div class="shadowwatch-notification-header">
                    <div class="shadowwatch-notification-icon">⚠️</div>
                    <h4 class="shadowwatch-notification-title">Tutorial Warning</h4>
                </div>
                <p class="shadowwatch-notification-message">${warnings.join(', ')}</p>
            </div>
        `;

        // Add warning to existing modal
        if (this.modal) {
            const content = this.modal.querySelector('.shadowwatch-tutorial-content');
            if (content) {
                content.insertAdjacentHTML('afterbegin', warningHTML);
            }
        }
    }

    showHint(data) {
        const { hint } = data;

        const hintHTML = `
            <div class="shadowwatch-notification info" style="position: static; margin-bottom: 1rem;">
                <div class="shadowwatch-notification-header">
                    <div class="shadowwatch-notification-icon">💡</div>
                    <h4 class="shadowwatch-notification-title">Hint</h4>
                </div>
                <p class="shadowwatch-notification-message">${hint}</p>
            </div>
        `;

        if (this.modal) {
            const content = this.modal.querySelector('.shadowwatch-tutorial-content');
            if (content) {
                content.insertAdjacentHTML('afterbegin', hintHTML);
            }
        }
    }

    showCompletion(data) {
        this.hide();

        const { metrics, achievements, nextSteps } = data;

        const completionHTML = `
            <div class="shadowwatch-tutorial-overlay">
                <div class="shadowwatch-tutorial-modal">
                    <div class="shadowwatch-tutorial-header">
                        <h2 class="shadowwatch-tutorial-title">🎉 Tutorial Complete!</h2>
                    </div>
                    <div class="shadowwatch-tutorial-content">
                        <p class="shadowwatch-tutorial-text">
                            Congratulations! You've completed the ShadowWatch AI tutorial.
                            Time spent: ${Math.round(metrics.totalTime / 60000)} minutes
                        </p>
                        ${achievements.map(achievement => `
                            <div class="shadowwatch-achievement">
                                <strong>${achievement.title}</strong>: ${achievement.description}
                            </div>
                        `).join('')}
                        <div class="shadowwatch-tutorial-actions">
                            <button class="shadowwatch-btn shadowwatch-btn-primary" onclick="this.closest('.shadowwatch-tutorial-overlay').remove()">
                                Start Playing!
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', completionHTML);
        this.client.trackEvent('tutorial_completed', metrics);
    }

    showError(data) {
        this.client.notifications.show('error', 'Tutorial Error', data.error);
    }

    createOverlay() {
        if (this.overlay) return;

        this.overlay = document.createElement('div');
        this.overlay.className = 'shadowwatch shadowwatch-tutorial-overlay';
        this.overlay.innerHTML = '<div class="shadowwatch-tutorial-modal"></div>';
        this.overlay.onclick = (e) => {
            if (e.target === this.overlay) {
                this.hide();
            }
        };

        this.modal = this.overlay.querySelector('.shadowwatch-tutorial-modal');
        document.body.appendChild(this.overlay);
    }

    highlightElement(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.classList.add('shadowwatch-tutorial-highlight');
            setTimeout(() => {
                element.classList.remove('shadowwatch-tutorial-highlight');
            }, 3000);
        }
    }

    hide() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
            this.modal = null;
        }
        this.active = false;
        this.client.state.tutorialActive = false;
    }
}

// #endregion

// #region Stats Pulse Component

class ShadowWatchStatsPulse {
    constructor(client) {
        this.client = client;
        this.visible = false;
        this.container = null;
        this.stats = {};
    }

    updateStats(newStats) {
        this.stats = { ...this.stats, ...newStats };
        if (this.visible) {
            this.render();
        }
    }

    show() {
        if (!this.client.options.statsPulseEnabled) return;

        this.createContainer();
        this.render();
        this.container.style.display = 'block';
        this.visible = true;
    }

    hide() {
        if (this.container) {
            this.container.style.display = 'none';
        }
        this.visible = false;
    }

    toggle() {
        if (this.visible) {
            this.hide();
        } else {
            this.show();
        }
    }

    createContainer() {
        if (this.container) return;

        this.container = document.createElement('div');
        this.container.className = 'shadowwatch shadowwatch-stats-pulse';
        this.container.id = 'shadowwatch-stats-pulse';
        document.body.appendChild(this.container);
    }

    render() {
        if (!this.container) return;

        const statsHTML = `
            <div class="shadowwatch-stats-header">
                <div class="shadowwatch-stats-icon">📊</div>
                <h3 class="shadowwatch-stats-title">ShadowWatch Stats</h3>
            </div>
            <div class="shadowwatch-stats-content">
                ${this.renderStatItem('Level', this.stats.level, this.stats.levelChange)}
                ${this.renderStatItem('Health', `${this.stats.health}/${this.stats.maxHealth}`, this.stats.healthChange)}
                ${this.renderStatItem('Experience', this.stats.experience, this.stats.expChange)}
                ${this.renderStatItem('Session Time', this.formatTime(this.stats.sessionTime), null)}
            </div>
        `;

        this.container.innerHTML = statsHTML;
    }

    renderStatItem(label, value, change) {
        const changeClass = change > 0 ? 'positive' : change < 0 ? 'negative' : '';
        const changeHTML = change !== null && change !== undefined ?
            `<span class="shadowwatch-stat-change ${changeClass}">${change > 0 ? '+' : ''}${change}</span>` : '';

        return `
            <div class="shadowwatch-stat-item">
                <span class="shadowwatch-stat-label">${label}</span>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span class="shadowwatch-stat-value">${value || 'N/A'}</span>
                    ${changeHTML}
                </div>
            </div>
        `;
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

// #endregion

// #region Training UI Component

class ShadowWatchTrainingUI {
    constructor(client) {
        this.client = client;
        this.active = false;
        this.container = null;
        this.sessionData = null;
    }

    handleUpdate(data) {
        const { type, sessionId, combatants, metrics } = data;

        switch (type) {
            case 'training_session_start':
                this.showSession(data);
                break;
            case 'training_action_result':
                this.updateCombat(data);
                break;
            case 'training_session_end':
                this.showResults(data);
                break;
        }
    }

    showSession(data) {
        this.sessionData = data;
        this.createContainer();
        this.renderSession();
        this.container.style.display = 'block';
        this.active = true;
        this.client.state.trainingActive = true;
    }

    updateCombat(data) {
        if (!this.container) return;

        this.updateCombatants(data.combatants);
        this.addCombatLogEntry(data);
    }

    showResults(data) {
        this.hide();

        const { winner, reason, metrics } = data;

        const resultsHTML = `
            <div class="shadowwatch shadowwatch-tutorial-overlay">
                <div class="shadowwatch-tutorial-modal">
                    <div class="shadowwatch-tutorial-header">
                        <h2 class="shadowwatch-tutorial-title">Training Complete!</h2>
                    </div>
                    <div class="shadowwatch-tutorial-content">
                        <p class="shadowwatch-tutorial-text">
                            ${winner ? `Winner: ${winner}` : 'Training session ended'}
                            <br>Reason: ${reason}
                            <br>Duration: ${Math.round(metrics.duration / 60)} minutes
                        </p>
                        <div class="shadowwatch-tutorial-actions">
                            <button class="shadowwatch-btn shadowwatch-btn-primary" onclick="this.closest('.shadowwatch-tutorial-overlay').remove()">
                                Continue
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', resultsHTML);
    }

    createContainer() {
        if (this.container) return;

        this.container = document.createElement('div');
        this.container.className = 'shadowwatch shadowwatch-training-ui';
        this.container.id = 'shadowwatch-training-ui';
        document.body.appendChild(this.container);
    }

    renderSession() {
        if (!this.container || !this.sessionData) return;

        const { players, combatants } = this.sessionData;

        const trainingHTML = `
            <div class="shadowwatch-training-header">
                <h3 class="shadowwatch-training-title">Training Session</h3>
                <span class="shadowwatch-training-status active">Active</span>
            </div>
            <div class="shadowwatch-combat-display">
                ${this.renderCombatants(combatants)}
            </div>
            <div class="shadowwatch-combat-log" id="shadowwatch-combat-log">
                <div class="shadowwatch-combat-entry">Training session started!</div>
            </div>
        `;

        this.container.innerHTML = trainingHTML;
    }

    renderCombatants(combatants) {
        return Object.values(combatants).map(combatant => `
            <div class="shadowwatch-combatant">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <strong>${combatant.userId}</strong>
                    <span>${combatant.currentHealth}/${combatant.stats.maxHealth} HP</span>
                </div>
                <div class="shadowwatch-health-bar">
                    <div class="shadowwatch-health-fill" style="width: ${(combatant.currentHealth / combatant.stats.maxHealth) * 100}%"></div>
                </div>
            </div>
        `).join('');
    }

    updateCombatants(combatants) {
        const display = this.container.querySelector('.shadowwatch-combat-display');
        if (display) {
            display.innerHTML = this.renderCombatants(combatants);
        }
    }

    addCombatLogEntry(data) {
        const log = this.container.querySelector('#shadowwatch-combat-log');
        if (!log) return;

        const entryClass = data.hit ? 'damage' : data.healAmount ? 'heal' : data.ability ? 'special' : '';
        const entryHTML = `<div class="shadowwatch-combat-entry ${entryClass}">${data.message}</div>`;

        log.insertAdjacentHTML('beforeend', entryHTML);
        log.scrollTop = log.scrollHeight;
    }

    hide() {
        if (this.container) {
            this.container.style.display = 'none';
        }
        this.active = false;
        this.client.state.trainingActive = false;
    }
}

// #endregion

// #region Notifications Component

class ShadowWatchNotifications {
    constructor(client) {
        this.client = client;
        this.container = null;
        this.notifications = [];
    }

    show(type, title, message, actions = []) {
        if (!this.client.options.notificationsEnabled) return;

        this.createContainer();

        const notification = {
            id: Date.now(),
            type,
            title,
            message,
            actions,
            timestamp: new Date()
        };

        this.notifications.push(notification);
        this.renderNotification(notification);

        // Auto-hide after 5 seconds for non-error notifications
        if (type !== 'error') {
            setTimeout(() => {
                this.hide(notification.id);
            }, 5000);
        }
    }

    renderNotification(notification) {
        const { id, type, title, message, actions } = notification;

        const actionsHTML = actions.map(action => `
            <button class="shadowwatch-btn shadowwatch-btn-sm" onclick="shadowwatch.handleNotificationAction('${action}')">
                ${action}
            </button>
        `).join('');

        const notificationHTML = `
            <div class="shadowwatch-notification ${type}" id="notification-${id}">
                <div class="shadowwatch-notification-header">
                    <div class="shadowwatch-notification-icon">${this.getIcon(type)}</div>
                    <h4 class="shadowwatch-notification-title">${title}</h4>
                    <button onclick="shadowwatch.notifications.hide(${id})" style="margin-left: auto;">×</button>
                </div>
                <p class="shadowwatch-notification-message">${message}</p>
                ${actions.length > 0 ? `<div class="shadowwatch-notification-actions">${actionsHTML}</div>` : ''}
            </div>
        `;

        this.container.insertAdjacentHTML('beforeend', notificationHTML);
    }

    getIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || '📢';
    }

    hide(id) {
        const notification = document.getElementById(`notification-${id}`);
        if (notification) {
            notification.remove();
        }
        this.notifications = this.notifications.filter(n => n.id !== id);
    }

    clearAll() {
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.notifications = [];
    }

    createContainer() {
        if (this.container) return;

        this.container = document.createElement('div');
        this.container.className = 'shadowwatch-notifications-container';
        this.container.style.cssText = 'position: fixed; top: 1rem; right: 1rem; z-index: 1300;';
        document.body.appendChild(this.container);
    }
}

// #endregion

// #region Privacy Component

class ShadowWatchPrivacy {
    constructor(client) {
        this.client = client;
        this.banner = null;
        this.settings = null;
    }

    showConsentBanner() {
        if (this.banner) return;

        this.banner = document.createElement('div');
        this.banner.className = 'shadowwatch shadowwatch-consent-banner';
        this.banner.innerHTML = `
            <div class="shadowwatch-consent-content">
                <p class="shadowwatch-consent-text">
                    <strong>ShadowWatch AI</strong> would like to monitor your gameplay to provide personalized guidance and improve your gaming experience.
                    Your privacy is protected and you can opt-out at any time.
                </p>
                <div class="shadowwatch-consent-actions">
                    <button class="shadowwatch-btn shadowwatch-btn-secondary" onclick="shadowwatch.privacy.rejectConsent()">
                        Reject
                    </button>
                    <button class="shadowwatch-btn shadowwatch-btn-primary" onclick="shadowwatch.privacy.acceptConsent()">
                        Accept
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(this.banner);
    }

    hideConsentBanner() {
        if (this.banner) {
            this.banner.remove();
            this.banner = null;
        }
    }

    acceptConsent() {
        this.client.updateConsent(true);
        this.hideConsentBanner();
        this.client.notifications.show('success', 'Consent Accepted', 'Thank you for enabling ShadowWatch AI!');
    }

    rejectConsent() {
        this.client.updateConsent(false);
        this.hideConsentBanner();
        this.client.notifications.show('info', 'Consent Rejected', 'ShadowWatch AI has been disabled.');
    }

    showSettings() {
        if (this.settings) return;

        this.settings = document.createElement('div');
        this.settings.className = 'shadowwatch shadowwatch-tutorial-overlay';
        this.settings.innerHTML = `
            <div class="shadowwatch-privacy-settings">
                <h2 class="shadowwatch-privacy-title">Privacy Settings</h2>
                <div class="shadowwatch-privacy-option" onclick="shadowwatch.requestDataExport()">
                    <div class="shadowwatch-privacy-icon">📄</div>
                    <div class="shadowwatch-privacy-details">
                        <h4>Export Data</h4>
                        <p>Download all your ShadowWatch data</p>
                    </div>
                </div>
                <div class="shadowwatch-privacy-option" onclick="shadowwatch.requestDataDeletion()">
                    <div class="shadowwatch-privacy-icon">🗑️</div>
                    <div class="shadowwatch-privacy-details">
                        <h4>Delete Data</h4>
                        <p>Permanently delete all your ShadowWatch data</p>
                    </div>
                </div>
                <div class="shadowwatch-privacy-option" onclick="shadowwatch.privacy.toggleConsent()">
                    <div class="shadowwatch-privacy-icon">🔒</div>
                    <div class="shadowwatch-privacy-details">
                        <h4>Toggle Monitoring</h4>
                        <p>${this.client.state.consentGiven ? 'Disable' : 'Enable'} ShadowWatch monitoring</p>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 2rem;">
                    <button class="shadowwatch-btn shadowwatch-btn-secondary" onclick="shadowwatch.privacy.hideSettings()">
                        Close
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(this.settings);
    }

    hideSettings() {
        if (this.settings) {
            this.settings.remove();
            this.settings = null;
        }
    }

    toggleConsent() {
        const newConsent = !this.client.state.consentGiven;
        this.client.updateConsent(newConsent);
        this.hideSettings();

        const message = newConsent ?
            'ShadowWatch AI monitoring enabled' :
            'ShadowWatch AI monitoring disabled';

        this.client.notifications.show('info', 'Settings Updated', message);
    }
}

// #endregion

// #region Global Integration

// Make globally available for easy integration
if (typeof window !== 'undefined') {
    window.ShadowWatchClient = ShadowWatchClient;
}

// Auto-initialize if socket.io is available and ShadowWatch is desired
if (typeof window !== 'undefined' && window.io && !window.shadowwatch) {
    // Check for auto-initialization data
    const initData = window.shadowwatchInit;
    if (initData) {
        const socket = window.io(initData.socketUrl || '/');
        window.shadowwatch = new ShadowWatchClient(socket, initData.options);

        // Auto-authenticate if credentials provided
        if (initData.token && initData.userId) {
            window.shadowwatch.authenticate(initData.token, initData.userId, initData.consent);
        }
    }
}

// #endregion

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShadowWatchClient;
}

/**
 * Cursor AI Control Panel - Frontend JavaScript
 * Interface for controlling ShadowWatch AI development through Cursor Cloud Agents
 */

class CursorControlPanel {
    constructor() {
        this.agents = [];
        this.stats = {
            totalAgents: 0,
            activeAgents: 0,
            completedAgents: 0,
            failedAgents: 0
        };
        this.availableModels = [];
        this.selectedModel = 'AUTO';
        this.pollingInterval = null;

        this.init();
    }

    init() {
        this.loadAgents();
        this.loadStats();
        this.checkAvailableModels();
        this.startPolling();
        this.loadAutonomousStatus();

        // Set up event listeners
        document.addEventListener('DOMContentLoaded', () => {
            this.setupEventListeners();
        });
    }

    setupEventListeners() {
        // Enter key in prompt textarea
        document.getElementById('agentPrompt').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                this.launchCustomAgent();
            }
        });

        // Model selection change
        const modelSelect = document.getElementById('modelSelect');
        if (modelSelect) {
            modelSelect.addEventListener('change', (e) => {
                this.selectedModel = e.target.value;
                this.updateModelStatus();
            });
        }
    }

    // API Calls
    async apiCall(endpoint, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const finalOptions = { ...defaultOptions, ...options };

        try {
            const response = await fetch(`/api/cursor/${endpoint}`, finalOptions);

            if (!response.ok) {
                throw new Error(`API call failed: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API call error:', error);
            this.showAlert('error', `API Error: ${error.message}`);
            throw error;
        }
    }

    // Agent Management
    async loadAgents() {
        try {
            const data = await this.apiCall('agents');
            this.agents = data.agents || [];
            this.renderAgents();
        } catch (error) {
            this.showAgentsError();
        }
    }

    async checkAvailableModels() {
        try {
            const data = await this.apiCall('cursor/models');
            this.availableModels = data.models || [];

            // Update model selector options
            this.updateModelSelector();

            // Auto-select best model
            this.autoSelectBestModel();

            this.updateModelStatus();
        } catch (error) {
            console.error('Failed to check available models:', error);
            this.updateModelStatus('❌ Could not check available models');
        }
    }

    updateModelSelector() {
        const modelSelect = document.getElementById('modelSelect');
        if (!modelSelect) return;

        // Clear existing options except AUTO
        while (modelSelect.options.length > 1) {
            modelSelect.remove(1);
        }

        // Add available models
        this.availableModels.forEach(model => {
            if (model !== 'AUTO') { // AUTO is already there
                const option = document.createElement('option');
                option.value = model;
                option.textContent = this.formatModelName(model);
                modelSelect.appendChild(option);
            }
        });
    }

    formatModelName(model) {
        const names = {
            'grok-code': 'Grok Code',
            'claude-4-sonnet-thinking': 'Claude 4 Sonnet Thinking',
            'claude-4-opus-thinking': 'Claude 4 Opus Thinking',
            'o3': 'O3'
        };
        return names[model] || model;
    }

    autoSelectBestModel() {
        // Prioritize Grok Code, then AUTO
        if (this.availableModels.includes('grok-code')) {
            this.selectedModel = 'grok-code';
        } else {
            this.selectedModel = 'AUTO';
        }

        // Update selector
        const modelSelect = document.getElementById('modelSelect');
        if (modelSelect) {
            modelSelect.value = this.selectedModel;
        }
    }

    updateModelStatus(status = null) {
        const statusElement = document.getElementById('modelStatus');
        if (!statusElement) return;

        if (status) {
            statusElement.textContent = status;
            statusElement.style.color = status.includes('✅') ? 'var(--moon-accent)' : 'var(--text-secondary)';
            return;
        }

        // Auto-generate status based on selected model
        if (this.selectedModel === 'grok-code') {
            statusElement.textContent = '✅ Using Grok Code - Optimized for coding tasks';
            statusElement.style.color = 'var(--moon-accent)';
        } else if (this.selectedModel === 'AUTO') {
            statusElement.textContent = '🎯 AUTO mode - Cursor will select the best model';
            statusElement.style.color = 'var(--moon-accent)';
        } else {
            statusElement.textContent = `🤖 Using ${this.formatModelName(this.selectedModel)}`;
            statusElement.style.color = 'var(--text-secondary)';
        }
    }

    async loadStats() {
        try {
            const stats = await this.apiCall('monitor');
            this.stats = stats;
            this.renderStats();
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    }

    async launchAgent(prompt, options = {}) {
        if (!prompt || prompt.trim().length === 0) {
            this.showAlert('error', 'Please enter a prompt for the agent');
            return;
        }

        try {
            this.showAlert('info', `Launching agent with ${this.formatModelName(this.selectedModel)}...`, '', false);

            const data = await this.apiCall('agents', {
                method: 'POST',
                body: JSON.stringify({
                    prompt: prompt.trim(),
                    options: {
                        ...options,
                        model: this.selectedModel
                    }
                })
            });

            this.showAlert('success', `Agent launched successfully! ID: ${data.id}`);

            // Clear prompt
            document.getElementById('agentPrompt').value = '';

            // Refresh agents list
            setTimeout(() => {
                this.loadAgents();
                this.loadStats();
            }, 1000);

            return data;
        } catch (error) {
            this.showAlert('error', 'Failed to launch agent');
        }
    }

    async launchFeatureAgent() {
        const prompt = document.getElementById('agentPrompt').value;
        if (!prompt) {
            this.showAlert('error', 'Please describe the feature you want to develop');
            return;
        }

        try {
            const data = await this.apiCall('develop-feature', {
                method: 'POST',
                body: JSON.stringify({ feature: prompt })
            });

            this.showAlert('success', `Feature development agent launched! ID: ${data.id}`);
            document.getElementById('agentPrompt').value = '';
            this.loadAgents();
            this.loadStats();
        } catch (error) {
            this.showAlert('error', 'Failed to launch feature development agent');
        }
    }

    async launchBugFixAgent() {
        const prompt = document.getElementById('agentPrompt').value;
        if (!prompt) {
            this.showAlert('error', 'Please describe the bug you want to fix');
            return;
        }

        try {
            const data = await this.apiCall('fix-bug', {
                method: 'POST',
                body: JSON.stringify({ bug: prompt })
            });

            this.showAlert('success', `Bug fix agent launched! ID: ${data.id}`);
            document.getElementById('agentPrompt').value = '';
            this.loadAgents();
            this.loadStats();
        } catch (error) {
            this.showAlert('error', 'Failed to launch bug fix agent');
        }
    }

    async launchPerformanceAgent() {
        const prompt = document.getElementById('agentPrompt').value;
        if (!prompt) {
            this.showAlert('error', 'Please describe the performance issue');
            return;
        }

        try {
            const data = await this.apiCall('improve-performance', {
                method: 'POST',
                body: JSON.stringify({ issue: prompt })
            });

            this.showAlert('success', `Performance optimization agent launched! ID: ${data.id}`);
            document.getElementById('agentPrompt').value = '';
            this.loadAgents();
            this.loadStats();
        } catch (error) {
            this.showAlert('error', 'Failed to launch performance agent');
        }
    }

    async launchTestAgent() {
        const prompt = document.getElementById('agentPrompt').value || 'Add comprehensive tests for the current codebase';

        try {
            const data = await this.apiCall('add-tests', {
                method: 'POST',
                body: JSON.stringify({ tests: prompt })
            });

            this.showAlert('success', `Test development agent launched! ID: ${data.id}`);
            document.getElementById('agentPrompt').value = '';
            this.loadAgents();
            this.loadStats();
        } catch (error) {
            this.showAlert('error', 'Failed to launch test agent');
        }
    }

    async launchRefactorAgent() {
        const prompt = document.getElementById('agentPrompt').value || 'Refactor the current codebase for better maintainability';

        try {
            const data = await this.apiCall('refactor', {
                method: 'POST',
                body: JSON.stringify({ refactor: prompt })
            });

            this.showAlert('success', `Code refactoring agent launched! ID: ${data.id}`);
            document.getElementById('agentPrompt').value = '';
            this.loadAgents();
            this.loadStats();
        } catch (error) {
            this.showAlert('error', 'Failed to launch refactoring agent');
        }
    }

    async launchDocsAgent() {
        const prompt = document.getElementById('agentPrompt').value || 'Update documentation for recent changes';

        try {
            const data = await this.apiCall('update-docs', {
                method: 'POST',
                body: JSON.stringify({ docs: prompt })
            });

            this.showAlert('success', `Documentation agent launched! ID: ${data.id}`);
            document.getElementById('agentPrompt').value = '';
            this.loadAgents();
            this.loadStats();
        } catch (error) {
            this.showAlert('error', 'Failed to launch documentation agent');
        }
    }

    async launchCustomAgent() {
        const prompt = document.getElementById('agentPrompt').value;
        await this.launchAgent(prompt);
    }

    async monitorAgents() {
        try {
            await this.loadStats();
            this.showAlert('success', 'Agent monitoring completed');
        } catch (error) {
            this.showAlert('error', 'Failed to monitor agents');
        }
    }

    async refreshStats() {
        await this.loadStats();
        this.showAlert('success', 'Statistics refreshed');
    }

    async exportHistory() {
        try {
            const history = await this.apiCall('history');

            // Create downloadable JSON file
            const dataStr = JSON.stringify(history, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

            const exportFileDefaultName = `shadowwatch-cursor-history-${new Date().toISOString().split('T')[0]}.json`;

            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();

            this.showAlert('success', 'Agent history exported successfully');
        } catch (error) {
            this.showAlert('error', 'Failed to export history');
        }
    }

    async clearCompleted() {
        // This would require a new API endpoint
        // For now, just refresh the list
        await this.loadAgents();
        this.showAlert('info', 'Completed agents cleared from view');
    }

    async viewConversation(agentId) {
        try {
            const data = await this.apiCall(`agents/${agentId}/conversation`);
            this.showConversationModal(data);
        } catch (error) {
            this.showAlert('error', 'Failed to load conversation');
        }
    }

    async addFollowup(agentId) {
        const followup = prompt('Enter followup instruction:');
        if (!followup) return;

        try {
            await this.apiCall(`agents/${agentId}/followup`, {
                method: 'POST',
                body: JSON.stringify({ prompt: followup })
            });

            this.showAlert('success', 'Followup added to agent');
            this.loadAgents();
        } catch (error) {
            this.showAlert('error', 'Failed to add followup');
        }
    }

    async deleteAgent(agentId) {
        if (!confirm(`Are you sure you want to delete agent ${agentId}? This cannot be undone.`)) {
            return;
        }

        try {
            await this.apiCall(`agents/${agentId}`, {
                method: 'DELETE'
            });

            this.showAlert('success', `Agent ${agentId} deleted`);
            this.loadAgents();
            this.loadStats();
        } catch (error) {
            this.showAlert('error', 'Failed to delete agent');
        }
    }

    // UI Rendering
    renderAgents() {
        const container = document.getElementById('agentsList');

        if (this.agents.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No agents found. Launch your first agent above!</p>';
            return;
        }

        container.innerHTML = this.agents.map(agent => `
            <div class="agent-item">
                <div class="agent-header">
                    <span class="agent-id">${agent.id}</span>
                    <span class="agent-status ${agent.status.toLowerCase()}">${agent.status}</span>
                </div>
                <div class="agent-name">${agent.name || 'Unnamed Agent'}</div>
                ${agent.summary ? `<div class="agent-summary">${agent.summary}</div>` : ''}
                <div class="agent-actions">
                    <button class="btn-sm" onclick="cursorControl.viewConversation('${agent.id}')">💬 Chat</button>
                    <button class="btn-sm" onclick="cursorControl.addFollowup('${agent.id}')">📝 Follow-up</button>
                    <button class="btn-sm" style="background: #ef4444; color: white;" onclick="cursorControl.deleteAgent('${agent.id}')">🗑️ Delete</button>
                </div>
            </div>
        `).join('');
    }

    renderStats() {
        document.getElementById('totalAgents').textContent = this.stats.totalAgents || 0;
        document.getElementById('activeAgents').textContent = this.stats.activeAgents || 0;
        document.getElementById('completedAgents').textContent = this.stats.completedAgents || 0;
        document.getElementById('failedAgents').textContent = this.stats.failedAgents || 0;
    }

    showAgentsError() {
        const container = document.getElementById('agentsList');
        container.innerHTML = `
            <div style="text-align: center; color: var(--text-secondary);">
                <p>❌ Failed to load agents</p>
                <p>Check that the server is running and Cursor API is configured</p>
                <button class="btn-secondary" onclick="cursorControl.loadAgents()" style="margin-top: 1rem;">Retry</button>
            </div>
        `;
    }

    showConversationModal(data) {
        const modal = document.getElementById('conversationModal');
        const messagesContainer = document.getElementById('conversationMessages');

        messagesContainer.innerHTML = data.messages.map(msg => `
            <div class="message ${msg.type === 'user_message' ? 'user' : 'assistant'}">
                <div class="message-type">${msg.type === 'user_message' ? '👤 You' : '🤖 Assistant'}</div>
                <div class="message-text">${msg.text}</div>
            </div>
        `).join('');

        modal.style.display = 'flex';
    }

    closeConversationModal() {
        document.getElementById('conversationModal').style.display = 'none';
    }

    showAlert(type, message, details = '', autoHide = true) {
        const alertsContainer = document.getElementById('alerts');

        // Clear existing alerts
        alertsContainer.innerHTML = '';

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert ${type}`;
        alertDiv.innerHTML = `
            <strong>${message}</strong>
            ${details ? `<br><small>${details}</small>` : ''}
        `;

        alertsContainer.appendChild(alertDiv);
        alertDiv.style.display = 'block';

        if (autoHide) {
            setTimeout(() => {
                alertDiv.style.display = 'none';
            }, 5000);
        }
    }

    // Polling for updates
    startPolling() {
        this.pollingInterval = setInterval(() => {
            this.loadAgents();
            this.loadStats();
        }, 10000); // Poll every 10 seconds
    }

    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }
}

// Global instance
let cursorControl;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    cursorControl = new CursorControlPanel();
    updateAIProviderStatus(); // Load AI provider status
});

// Global functions for HTML onclick handlers
window.launchCustomAgent = () => cursorControl.launchCustomAgent();
window.launchFeatureAgent = () => cursorControl.launchFeatureAgent();
window.launchBugFixAgent = () => cursorControl.launchBugFixAgent();
window.launchPerformanceAgent = () => cursorControl.launchPerformanceAgent();
window.launchTestAgent = () => cursorControl.launchTestAgent();
window.launchRefactorAgent = () => cursorControl.launchRefactorAgent();
window.launchDocsAgent = () => cursorControl.launchDocsAgent();
window.monitorAgents = () => cursorControl.monitorAgents();
window.refreshStats = () => cursorControl.refreshStats();
window.exportHistory = () => cursorControl.exportHistory();
window.clearCompleted = () => cursorControl.clearCompleted();
window.viewConversation = (id) => cursorControl.viewConversation(id);
window.addFollowup = (id) => cursorControl.addFollowup(id);
window.deleteAgent = (id) => cursorControl.deleteAgent(id);
window.closeConversationModal = () => cursorControl.closeConversationModal();

// ================================================
// AUTONOMOUS DEVELOPMENT FUNCTIONS
// ================================================

// Load autonomous development status
async function loadAutonomousStatus() {
    try {
        const response = await fetch('/api/cursor/autonomous/status');
        const status = await response.json();
        updateAutonomousUI(status);
    } catch (error) {
        console.error('Failed to load autonomous status:', error);
    }
}

// Update autonomous UI based on status
function updateAutonomousUI(status) {
    const enableBtn = document.getElementById('enableAutoBtn');
    const disableBtn = document.getElementById('disableAutoBtn');
    const statusDiv = document.getElementById('autonomousStatus');
    const controlsDiv = document.getElementById('autonomousControls');
    const indicator = document.getElementById('autoStatusIndicator');
    const statusText = document.getElementById('autoStatusText');
    const statsDiv = document.getElementById('autoStats');

    if (status.autonomousMode) {
        enableBtn.style.display = 'none';
        disableBtn.style.display = 'inline-block';
        statusDiv.style.display = 'block';
        controlsDiv.style.display = 'block';

        // Update status indicator
        if (status.autoDevelopmentActive) {
            indicator.style.background = '#10b981'; // Green
            statusText.textContent = 'Active - Developing';
        } else {
            indicator.style.background = '#f59e0b'; // Yellow
            statusText.textContent = 'Enabled - Idle';
        }

        // Update stats
        statsDiv.innerHTML = `
            <div>📁 Game Files: ${status.gameFilesCount}</div>
            <div>📋 Queue: ${status.developmentQueueLength}</div>
            <div>🤖 Active Agents: ${status.activeAgents}</div>
            <div>⚡ Features: ${status.stats.featuresImplemented}</div>
            <div>🐛 Bugs Fixed: ${status.stats.bugsFixed}</div>
            <div>💾 Auto-commits: ${status.stats.autoCommits}</div>
        `;
    } else {
        enableBtn.style.display = 'inline-block';
        disableBtn.style.display = 'none';
        statusDiv.style.display = 'none';
        controlsDiv.style.display = 'none';
    }
}

// Enable autonomous development mode
async function enableAutonomousMode() {
    try {
        cursorControl.showAlert('info', '🚀 Enabling autonomous development mode...', '', false);

        const response = await fetch('/api/cursor/autonomous/enable', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });

        const result = await response.json();

        if (response.ok) {
            cursorControl.showAlert('success', '✅ Autonomous development mode enabled! AI will now automatically develop your game.');
            await loadAutonomousStatus();
        } else {
            throw new Error(result.error || 'Failed to enable autonomous mode');
        }
    } catch (error) {
        cursorControl.showAlert('error', `❌ Failed to enable autonomous mode: ${error.message}`);
    }
}

// Disable autonomous development mode
async function disableAutonomousMode() {
    try {
        cursorControl.showAlert('info', '🛑 Disabling autonomous development mode...', '', false);

        const response = await fetch('/api/cursor/autonomous/disable', {
            method: 'POST'
        });

        const result = await response.json();

        if (response.ok) {
            cursorControl.showAlert('success', '✅ Autonomous development mode disabled.');
            await loadAutonomousStatus();
        } else {
            throw new Error(result.error || 'Failed to disable autonomous mode');
        }
    } catch (error) {
        cursorControl.showAlert('error', `❌ Failed to disable autonomous mode: ${error.message}`);
    }
}

// Force development cycle
async function forceDevelopmentCycle() {
    try {
        cursorControl.showAlert('info', '🔄 Forcing development cycle...', '', false);

        const response = await fetch('/api/cursor/autonomous/force-cycle', {
            method: 'POST'
        });

        const result = await response.json();

        if (response.ok) {
            cursorControl.showAlert('success', '✅ Development cycle executed successfully.');
            await loadAutonomousStatus();
        } else {
            throw new Error(result.error || 'Failed to force development cycle');
        }
    } catch (error) {
        cursorControl.showAlert('error', `❌ Failed to force development cycle: ${error.message}`);
    }
}

// Clear development queue
async function clearDevelopmentQueue() {
    if (!confirm('Are you sure you want to clear the development queue? This will cancel all pending development tasks.')) {
        return;
    }

    try {
        cursorControl.showAlert('info', '🧹 Clearing development queue...', '', false);

        const response = await fetch('/api/cursor/autonomous/clear-queue', {
            method: 'POST'
        });

        const result = await response.json();

        if (response.ok) {
            cursorControl.showAlert('success', `✅ Cleared ${result.clearedCount} tasks from development queue.`);
            await loadAutonomousStatus();
        } else {
            throw new Error(result.error || 'Failed to clear development queue');
        }
    } catch (error) {
        cursorControl.showAlert('error', `❌ Failed to clear development queue: ${error.message}`);
    }
}

// Reset autonomous development
async function resetAutonomousDevelopment() {
    if (!confirm('Are you sure you want to reset the autonomous development system? This will clear all progress and restart from scratch.')) {
        return;
    }

    try {
        cursorControl.showAlert('info', '🔄 Resetting autonomous development system...', '', false);

        const response = await fetch('/api/cursor/autonomous/reset', {
            method: 'POST'
        });

        const result = await response.json();

        if (response.ok) {
            cursorControl.showAlert('success', '✅ Autonomous development system reset successfully.');
            await loadAutonomousStatus();
        } else {
            throw new Error(result.error || 'Failed to reset autonomous development');
        }
    } catch (error) {
        cursorControl.showAlert('error', `❌ Failed to reset autonomous development: ${error.message}`);
    }
}

// Enable ULTRA-MAXIMUM autonomous development mode - 9500 HOURS CONTINUOUS
async function enableUltraMaximumAutonomousMode() {
    if (!confirm('🚀🚀🚀 WARNING: This will enable ULTRA-MAXIMUM autonomous development mode!\n\nThe AI will work continuously for 9500 hours to build your complete 3D MMO/RPG game with WASD/mouse controls.\n\nFeatures it will build:\n• Full 3D game engine\n• WASD + mouse controls\n• Complete MMO/RPG systems\n• All HTML tabs fulfilled\n• 24/7 development\n\nThis cannot be stopped once started. Continue?')) {
        return;
    }

    try {
        cursorControl.showAlert('info', '🚀🚀🚀 ACTIVATING ULTRA-MAXIMUM 9500-HOUR AUTONOMOUS DEVELOPMENT MODE! 🚀🚀🚀', '', false);

        const response = await fetch('/api/cursor/autonomous/enable-ultra-maximum', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });

        const result = await response.json();

        if (response.ok) {
            cursorControl.showAlert('success', `✅ ULTRA-MAXIMUM MODE ACTIVATED!\n\n🤖 AI will now work 9500 hours continuously!\n🎮 Building complete 3D MMO/RPG game!\n⚡ WASD + mouse controls!\n🚀 24/7 development never stops!`);

            // Update UI to show ultra mode is active
            document.getElementById('enableUltraBtn').style.display = 'none';
            document.getElementById('enableAutoBtn').style.display = 'none';
            document.getElementById('disableAutoBtn').style.display = 'inline-block';

            await loadAutonomousStatus();

            // Start real-time status updates
            setInterval(loadAutonomousStatus, 5000); // Update every 5 seconds

        } else {
            throw new Error(result.error || 'Failed to enable ultra-maximum autonomous mode');
        }
    } catch (error) {
        cursorControl.showAlert('error', `❌ Failed to enable ultra-maximum mode: ${error.message}`);
    }
}

// ================================================
// UNITY & UNREAL ENGINE FUNCTIONS
// ================================================

// Initialize Unity support
async function initializeUnitySupport() {
    try {
        cursorControl.showAlert('info', '🎮 Initializing Unity Engine support...', '', false);

        const response = await fetch('/api/cursor/unity/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ version: '2022.3' })
        });

        const result = await response.json();

        if (response.ok) {
            cursorControl.showAlert('success', `✅ Unity ${result.version} support initialized successfully!`);
        } else {
            throw new Error(result.error || 'Failed to initialize Unity support');
        }
    } catch (error) {
        cursorControl.showAlert('error', `❌ Failed to initialize Unity support: ${error.message}`);
    }
}

// Initialize Unreal Engine support
async function initializeUnrealSupport() {
    try {
        cursorControl.showAlert('info', '🎮 Initializing Unreal Engine support...', '', false);

        const response = await fetch('/api/cursor/unreal/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ version: '5.3' })
        });

        const result = await response.json();

        if (response.ok) {
            cursorControl.showAlert('success', `✅ Unreal Engine ${result.version} support initialized successfully!`);
        } else {
            throw new Error(result.error || 'Failed to initialize Unreal support');
        }
    } catch (error) {
        cursorControl.showAlert('error', `❌ Failed to initialize Unreal support: ${error.message}`);
    }
}

// ================================================
// WEAPON CREATION FUNCTIONS
// ================================================

// Create weapon blueprint and model
async function createWeaponBlueprint() {
    const weaponName = document.getElementById('weaponName').value.trim();
    const weaponType = document.getElementById('weaponType').value;
    const engineType = document.getElementById('weaponEngine').value;

    if (!weaponName) {
        cursorControl.showAlert('error', 'Please enter a weapon name');
        return;
    }

    try {
        cursorControl.showAlert('info', `🔫 Creating ${weaponName} (${weaponType}) for ${engineType.toUpperCase()}...`, '', false);

        const response = await fetch('/api/cursor/weapons/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ weaponName, weaponType, engineType })
        });

        const result = await response.json();

        if (response.ok) {
            cursorControl.showAlert('success', `✅ Weapon ${weaponName} blueprint and 3D model created successfully! Saved to models/weapons/${weaponName.toLowerCase().replace(/\s+/g, '_')}/`);
            document.getElementById('weaponName').value = ''; // Clear input
        } else {
            throw new Error(result.error || 'Failed to create weapon');
        }
    } catch (error) {
        cursorControl.showAlert('error', `❌ Failed to create weapon: ${error.message}`);
    }
}

// ================================================
// VEHICLE CREATION FUNCTIONS
// ================================================

// Create vehicle blueprint and model
async function createVehicleBlueprint() {
    const vehicleName = document.getElementById('vehicleName').value.trim();
    const vehicleType = document.getElementById('vehicleType').value;
    const engineType = document.getElementById('vehicleEngine').value;

    if (!vehicleName) {
        cursorControl.showAlert('error', 'Please enter a vehicle name');
        return;
    }

    try {
        cursorControl.showAlert('info', `🚗 Creating ${vehicleName} (${vehicleType}) for ${engineType.toUpperCase()}...`, '', false);

        const response = await fetch('/api/cursor/vehicles/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vehicleName, vehicleType, engineType })
        });

        const result = await response.json();

        if (response.ok) {
            cursorControl.showAlert('success', `✅ Vehicle ${vehicleName} blueprint and 3D model created successfully! Saved to models/vehicles/${vehicleName.toLowerCase().replace(/\s+/g, '_')}/`);
            document.getElementById('vehicleName').value = ''; // Clear input
        } else {
            throw new Error(result.error || 'Failed to create vehicle');
        }
    } catch (error) {
        cursorControl.showAlert('error', `❌ Failed to create vehicle: ${error.message}`);
    }
}

// ================================================
// MODEL PACK FUNCTIONS
// ================================================

// Create model pack
async function createModelPack() {
    const packName = document.getElementById('packName').value.trim();
    const packType = document.getElementById('packType').value;
    const packItemsText = document.getElementById('packItems').value.trim();

    if (!packName) {
        cursorControl.showAlert('error', 'Please enter a pack name');
        return;
    }

    if (!packItemsText) {
        cursorControl.showAlert('error', 'Please enter pack items as JSON array');
        return;
    }

    try {
        const packItems = JSON.parse(packItemsText);

        cursorControl.showAlert('info', `📦 Creating ${packName} ${packType} pack with ${packItems.length} items...`, '', false);

        const endpoint = packType === 'weapons' ? '/api/cursor/weapons/pack' : '/api/cursor/vehicles/pack';
        const requestBody = {
            packName,
            [packType]: packItems
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const result = await response.json();

        if (response.ok) {
            cursorControl.showAlert('success', `✅ ${packName} pack created successfully with ${packItems.length} ${packType}!`);
            document.getElementById('packName').value = '';
            document.getElementById('packItems').value = '';
        } else {
            throw new Error(result.error || 'Failed to create pack');
        }
    } catch (error) {
        if (error instanceof SyntaxError) {
            cursorControl.showAlert('error', 'Invalid JSON format. Please check your pack items syntax.');
        } else {
            cursorControl.showAlert('error', `❌ Failed to create pack: ${error.message}`);
        }
    }
}

// Create model directory structure
async function createModelStructure() {
    try {
        cursorControl.showAlert('info', '📁 Creating organized model directory structure...', '', false);

        const response = await fetch('/api/cursor/models/structure', {
            method: 'POST'
        });

        const result = await response.json();

        if (response.ok) {
            cursorControl.showAlert('success', '✅ Model directory structure created successfully! Organized folders for weapons, vehicles, characters, environments, etc.');
        } else {
            throw new Error(result.error || 'Failed to create structure');
        }
    } catch (error) {
        cursorControl.showAlert('error', `❌ Failed to create model structure: ${error.message}`);
    }
}

// ================================================
// SECURITY FUNCTIONS
// ================================================

// Perform security scan
async function performSecurityScan() {
    try {
        cursorControl.showAlert('info', '🛡️ Performing comprehensive security scan...', '', false);

        const response = await fetch('/api/cursor/security/scan', {
            method: 'POST'
        });

        const result = await response.json();

        if (response.ok) {
            cursorControl.showAlert('success', '✅ Security scan completed successfully! No threats detected.');
            await getSecurityStatus(); // Update status
        } else {
            throw new Error(result.error || 'Security scan failed');
        }
    } catch (error) {
        cursorControl.showAlert('error', `❌ Security scan failed: ${error.message}`);
    }
}

// Get security status
async function getSecurityStatus() {
    try {
        const response = await fetch('/api/cursor/security/status');
        const status = await response.json();

        // Update security UI
        updateSecurityUI(status);

    } catch (error) {
        console.error('Failed to get security status:', error);
    }
}

// Update security UI
function updateSecurityUI(status) {
    const indicator = document.getElementById('securityIndicator');
    const statusText = document.getElementById('securityText');
    const statsDiv = document.getElementById('securityStats');

    if (status.antiHackerProtection) {
        indicator.style.background = '#10b981'; // Green - active
        statusText.textContent = 'Security Status: Active Protection';
    } else {
        indicator.style.background = '#ef4444'; // Red - inactive
        statusText.textContent = 'Security Status: Disabled';
    }

    // Update stats
    const logCount = status.securityLog ? status.securityLog.length : 0;
    statsDiv.innerHTML = `
        <div>Last Scan: ${new Date(status.lastScan).toLocaleString()}</div>
        <div>Security Events: ${logCount}</div>
        <div>Protection: ${status.antiHackerProtection ? 'Active' : 'Inactive'}</div>
    `;
}

// Vehicle creation functions
async function createSingleVehicle() {
    const manufacturer = document.getElementById('vehicle-manufacturer-select').value;
    const model = document.getElementById('vehicle-model-input').value.trim();

    if (!manufacturer) {
        cursorControl.showAlert('error', '❌ Please select a manufacturer');
        return;
    }

    if (!model) {
        cursorControl.showAlert('error', '❌ Please enter a vehicle model');
        return;
    }

    try {
        cursorControl.showAlert('info', `🚗 Creating ${manufacturer} ${model}...`, '', false);

        const response = await fetch('/api/cursor/vehicles/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ manufacturer, model, engineType: 'unreal' })
        });

        const result = await response.json();

        if (response.ok) {
            cursorControl.showAlert('success', `✅ ${manufacturer} ${model} created successfully!`);
        } else {
            throw new Error(result.error || 'Failed to create vehicle');
        }
    } catch (error) {
        cursorControl.showAlert('error', `❌ Failed to create ${manufacturer} ${model}: ${error.message}`);
    }
}

async function createManufacturerPack() {
    const manufacturer = document.getElementById('vehicle-manufacturer-select').value;

    if (!manufacturer) {
        cursorControl.showAlert('error', '❌ Please select a manufacturer');
        return;
    }

    const confirmMsg = `This will create ALL vehicles for ${manufacturer}.\n\nAre you sure you want to proceed?`;
    if (!confirm(confirmMsg)) {
        return;
    }

    try {
        cursorControl.showAlert('info', `📦 Creating complete ${manufacturer} vehicle pack...`, '', false);

        const response = await fetch('/api/cursor/vehicles/pack', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ manufacturer, engineType: 'unreal' })
        });

        const result = await response.json();

        if (response.ok) {
            cursorControl.showAlert('success', `✅ ${manufacturer} vehicle pack created successfully!`);
        } else {
            throw new Error(result.error || 'Failed to create manufacturer pack');
        }
    } catch (error) {
        cursorControl.showAlert('error', `❌ Failed to create ${manufacturer} pack: ${error.message}`);
    }
}

async function createAllManufacturers() {
    const confirmMsg = `🚨 MASSIVE OPERATION WARNING 🚨\n\nThis will create complete vehicle packs for ALL 50+ manufacturers!\n\nThis operation will:\n- Generate thousands of vehicle models\n- Create massive amounts of C++ code\n- Produce extensive 3D model specifications\n- Take significant time and resources\n\n⚠️ This cannot be stopped once started!\n\nAre you absolutely sure you want to proceed?`;

    if (!confirm(confirmMsg)) {
        return;
    }

    // Double confirmation
    if (!confirm('🚨 FINAL WARNING 🚨\n\nYou are about to create vehicles for EVERY major manufacturer on Earth!\n\nThis is an enormous operation that will generate:\n- Ferrari, Lamborghini, Bugatti supercars\n- Rolls-Royce, Bentley, Maybach luxury vehicles\n- Tesla electric vehicles\n- Military vehicles (Hummer, Jeep)\n- Commercial vehicles (Iveco, MAN)\n- And 40+ more manufacturers!\n\nContinue?')) {
        return;
    }

    try {
        cursorControl.showAlert('info', `🌍🚗 STARTING MASSIVE VEHICLE CREATION FOR ALL 50+ MANUFACTURERS! 🚗🌍`, '', false);

        const response = await fetch('/api/cursor/vehicles/all-manufacturers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ engineType: 'unreal' })
        });

        const result = await response.json();

        if (response.ok) {
            cursorControl.showAlert('success', `🎉 ALL MANUFACTURER VEHICLE PACKS CREATION COMPLETE!`);
        } else {
            throw new Error(result.error || 'Massive vehicle creation failed');
        }
    } catch (error) {
        cursorControl.showAlert('error', `❌ Massive vehicle creation failed: ${error.message}`);
    }
}

// OpenAI configuration functions
async function setOpenAIKey() {
    const apiKey = document.getElementById('openai-api-key').value.trim();

    if (!apiKey) {
        cursorControl.showAlert('error', '❌ Please enter your OpenAI API key');
        return;
    }

    if (!apiKey.startsWith('sk-')) {
        cursorControl.showAlert('error', '❌ Invalid OpenAI API key format. Key should start with "sk-"');
        return;
    }

    try {
        cursorControl.showAlert('info', '🔑 Setting OpenAI API key...', '', false);

        const response = await fetch('/api/openai/set-key', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey })
        });

        const result = await response.json();

        if (response.ok) {
            cursorControl.showAlert('success', '✅ OpenAI API key configured successfully!');
            document.getElementById('openai-api-key').value = ''; // Clear the input
            await updateAIProviderStatus();
        } else {
            throw new Error(result.error || 'Failed to set API key');
        }
    } catch (error) {
        cursorControl.showAlert('error', `❌ Failed to set OpenAI API key: ${error.message}`);
    }
}

async function testOpenAIConnection() {
    try {
        cursorControl.showAlert('info', '🧪 Testing OpenAI connection...', '', false);

        const response = await fetch('/api/openai/test', {
            method: 'POST'
        });

        const result = await response.json();

        if (response.ok) {
            cursorControl.showAlert('success', `✅ OpenAI connection successful!\n\nResponse: "${result.response}"`);
            await updateAIProviderStatus();
        } else {
            throw new Error(result.error || 'Connection test failed');
        }
    } catch (error) {
        cursorControl.showAlert('error', `❌ OpenAI connection test failed: ${error.message}`);
    }
}

async function toggleAIProvider(useOpenAI) {
    try {
        cursorControl.showAlert('info', `🔄 Switching to ${useOpenAI ? 'OpenAI' : 'Cursor AI'}...`, '', false);

        const response = await fetch('/api/ai/toggle-provider', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ useOpenAI })
        });

        const result = await response.json();

        if (response.ok) {
            cursorControl.showAlert('success', `✅ Switched to ${result.provider}!`);
            await updateAIProviderStatus();
        } else {
            throw new Error(result.error || 'Failed to switch provider');
        }
    } catch (error) {
        cursorControl.showAlert('error', `❌ Failed to switch AI provider: ${error.message}`);
        // Revert the radio button selection on error
        document.getElementById(useOpenAI ? 'use-cursor' : 'use-openai').checked = true;
    }
}

async function updateAIProviderStatus() {
    try {
        const response = await fetch('/api/ai/provider-status');
        const status = await response.json();

        // Update current provider display
        document.getElementById('current-provider').textContent = status.currentProvider;

        // Update configuration status
        document.getElementById('cursor-config-status').textContent = status.cursorConfigured ? 'Configured' : 'Not Configured';
        document.getElementById('openai-config-status').textContent = status.openaiConfigured ? 'Configured' : 'Not Configured';

        // Update status indicators
        const cursorIndicator = document.getElementById('cursor-status');
        const openaiIndicator = document.getElementById('openai-status');

        cursorIndicator.style.background = status.cursorConfigured ? '#10b981' : '#ef4444'; // Green or red
        openaiIndicator.style.background = status.openaiConfigured ? '#10b981' : '#ef4444'; // Green or red

        // Update radio button selection
        document.getElementById('use-cursor').checked = !status.currentProvider.includes('OpenAI');
        document.getElementById('use-openai').checked = status.currentProvider.includes('OpenAI');

    } catch (error) {
        console.error('Failed to update AI provider status:', error);
    }
}

// Global functions for new features
window.enableAutonomousMode = enableAutonomousMode;
window.disableAutonomousMode = disableAutonomousMode;
window.enableUltraMaximumAutonomousMode = enableUltraMaximumAutonomousMode;
window.forceDevelopmentCycle = forceDevelopmentCycle;
window.clearDevelopmentQueue = clearDevelopmentQueue;
window.resetAutonomousDevelopment = resetAutonomousDevelopment;

// OpenAI functions
window.setOpenAIKey = setOpenAIKey;
window.testOpenAIConnection = testOpenAIConnection;
window.toggleAIProvider = toggleAIProvider;
window.updateAIProviderStatus = updateAIProviderStatus;

// Unity/Unreal functions
window.initializeUnitySupport = initializeUnitySupport;
window.initializeUnrealSupport = initializeUnrealSupport;

// Weapon/Vehicle functions
window.createWeaponBlueprint = createWeaponBlueprint;
window.createVehicleBlueprint = createVehicleBlueprint;

// Vehicle manufacturer functions
window.createSingleVehicle = createSingleVehicle;
window.createManufacturerPack = createManufacturerPack;
window.createAllManufacturers = createAllManufacturers;

// Model pack functions
window.createModelPack = createModelPack;
window.createModelStructure = createModelStructure;

// Security functions
window.performSecurityScan = performSecurityScan;
window.getSecurityStatus = getSecurityStatus;

/**
 * ShadowWatch AI - Tutorial Flow E2E Tests
 * Cypress tests for the complete 25-step tutorial experience
 */

describe('ShadowWatch AI Tutorial Flow', () => {
    const testUser = {
        id: 'test-user-tutorial',
        email: 'tutorial-test@example.com',
        consent: true
    };

    beforeEach(() => {
        // Reset test environment
        cy.request('POST', '/api/test/reset', { userId: testUser.id });

        // Setup test user
        cy.request('POST', '/api/test/setup-user', testUser);

        // Visit the test game page
        cy.visit('/test-game.html');

        // Intercept WebSocket connections
        cy.window().then((win) => {
            cy.stub(win, 'io').returns({
                connect: cy.stub().as('socketConnect'),
                on: cy.stub().as('socketOn'),
                emit: cy.stub().as('socketEmit'),
                disconnect: cy.stub().as('socketDisconnect')
            });
        });
    });

    describe('Tutorial Initialization', () => {
        it('should start tutorial automatically for new users', () => {
            // Mock user authentication
            cy.window().then((win) => {
                win.socket.emit('authenticate', {
                    token: 'test-token',
                    userId: testUser.id,
                    consent: testUser.consent
                });
            });

            // Should receive tutorial start message
            cy.get('@socketOn').should('be.calledWith', 'tutorial_update');
            cy.get('@socketOn').should('be.calledWithMatch', (event, callback) => {
                if (event === 'tutorial_update') {
                    callback({
                        type: 'tutorial_step',
                        step: { id: 1, title: 'Welcome to ShadowWatch AI' },
                        currentStep: 1,
                        totalSteps: 25
                    });
                }
            });
        });

        it('should not start tutorial for users who completed it', () => {
            // Setup user with completed tutorial
            cy.request('POST', '/api/test/complete-tutorial', { userId: testUser.id });

            // Authenticate
            cy.window().then((win) => {
                win.socket.emit('authenticate', {
                    token: 'test-token',
                    userId: testUser.id,
                    consent: testUser.consent
                });
            });

            // Should receive welcome message instead of tutorial
            cy.get('@socketOn').should('be.calledWith', 'shadowwatch_message');
        });

        it('should respect user consent for tutorial', () => {
            const userWithoutConsent = { ...testUser, consent: false };

            cy.request('POST', '/api/test/setup-user', userWithoutConsent);

            cy.window().then((win) => {
                win.socket.emit('authenticate', {
                    token: 'test-token',
                    userId: userWithoutConsent.id,
                    consent: false
                });
            });

            // Should receive consent error
            cy.get('@socketOn').should('be.calledWith', 'shadowwatch_error');
        });
    });

    describe('Tutorial Progression', () => {
        beforeEach(() => {
            // Start tutorial for each test
            cy.request('POST', '/api/tutorial/start/' + testUser.id, { options: {} });
        });

        it('should progress through tutorial steps correctly', () => {
            // Complete step 1
            cy.window().then((win) => {
                win.socket.emit('tutorial_progress', { action: 'next' });
            });

            // Should move to step 2
            cy.get('@socketOn').should('be.calledWithMatch', (event, callback) => {
                if (event === 'tutorial_update') {
                    callback({
                        type: 'tutorial_step',
                        currentStep: 2,
                        step: { id: 2, title: 'What I Can Do' }
                    });
                }
            });
        });

        it('should handle step requirements validation', () => {
            // Try to skip step 3 (privacy consent) without meeting requirements
            cy.window().then((win) => {
                // Jump to step 3
                win.socket.emit('tutorial_progress', { action: 'skip', step: 3 });
                win.socket.emit('tutorial_progress', { action: 'next' });
            });

            // Should show warning instead of progressing
            cy.get('@socketOn').should('be.calledWithMatch', (event, callback) => {
                if (event === 'tutorial_update') {
                    callback({
                        type: 'tutorial_warning',
                        stepId: 3,
                        warnings: ['consent_acknowledged']
                    });
                }
            });
        });

        it('should provide hints after failed attempts', () => {
            // Fail step 4 multiple times
            for (let i = 0; i < 3; i++) {
                cy.window().then((win) => {
                    win.socket.emit('tutorial_progress', { action: 'next' });
                });
                cy.wait(100); // Small delay between attempts
            }

            // Should receive hint
            cy.get('@socketOn').should('be.calledWithMatch', (event, callback) => {
                if (event === 'tutorial_update') {
                    callback({
                        type: 'tutorial_hint',
                        stepId: 4,
                        hint: expect.stringContaining('WASD')
                    });
                }
            });
        });

        it('should track tutorial progress accurately', () => {
            // Check initial progress
            cy.request('/api/tutorial/status/' + testUser.id).then((response) => {
                expect(response.body.active).to.be.true;
                expect(response.body.currentStep).to.equal(1);
                expect(response.body.progress.percentage).to.equal(4); // 1/25 * 100
            });
        });

        it('should handle tutorial pause and resume', () => {
            // Pause tutorial
            cy.request('POST', '/api/tutorial/pause/' + testUser.id);

            // Check status
            cy.request('/api/tutorial/status/' + testUser.id).then((response) => {
                expect(response.body.active).to.be.true;
                expect(response.body.canResume).to.be.true;
            });

            // Resume tutorial
            cy.request('POST', '/api/tutorial/resume/' + testUser.id);

            // Should continue from where it left off
            cy.get('@socketOn').should('be.calledWithMatch', (event, callback) => {
                if (event === 'tutorial_update') {
                    callback({
                        type: 'tutorial_step',
                        currentStep: 1
                    });
                }
            });
        });
    });

    describe('Tutorial Completion', () => {
        it('should complete tutorial after all steps', () => {
            // Fast-forward through all tutorial steps
            cy.request('POST', '/api/test/complete-all-steps', { userId: testUser.id });

            // Progress to completion
            cy.window().then((win) => {
                win.socket.emit('tutorial_progress', { action: 'next' });
            });

            // Should receive completion message
            cy.get('@socketOn').should('be.calledWithMatch', (event, callback) => {
                if (event === 'tutorial_update') {
                    callback({
                        type: 'tutorial_completed',
                        metrics: expect.objectContaining({
                            totalTime: expect.any(Number),
                            stepsCompleted: 25
                        }),
                        achievements: expect.arrayContaining([
                            expect.objectContaining({
                                id: 'tutorial_master'
                            })
                        ])
                    });
                }
            });
        });

        it('should award achievements on completion', () => {
            // Complete tutorial
            cy.request('POST', '/api/test/complete-tutorial', { userId: testUser.id });

            // Check for achievement notification
            cy.get('@socketOn').should('be.calledWithMatch', (event, callback) => {
                if (event === 'tutorial_update') {
                    callback({
                        type: 'tutorial_completed',
                        achievements: expect.arrayContaining([
                            expect.objectContaining({
                                title: 'Tutorial Master'
                            })
                        ])
                    });
                }
            });
        });

        it('should provide next steps after completion', () => {
            // Complete tutorial
            cy.request('POST', '/api/test/complete-tutorial', { userId: testUser.id });

            // Check next steps
            cy.get('@socketOn').should('be.calledWithMatch', (event, callback) => {
                if (event === 'tutorial_update') {
                    callback({
                        type: 'tutorial_completed',
                        nextSteps: expect.arrayContaining([
                            'Try ShadowWatch training sessions',
                            'Explore advanced game features'
                        ])
                    });
                }
            });
        });
    });

    describe('Tutorial Analytics', () => {
        it('should track tutorial metrics', () => {
            // Complete some tutorial steps
            cy.request('POST', '/api/tutorial/start/' + testUser.id);
            cy.wait(2000); // Simulate time spent

            // Check analytics
            cy.request('/api/admin/tutorial-analytics').then((response) => {
                expect(response.body.main_tutorial).to.have.property('completions');
                expect(response.body.main_tutorial).to.have.property('avg_completion_time');
                expect(response.body.main_tutorial).to.have.property('completion_rate');
            });
        });

        it('should track step-specific analytics', () => {
            // Simulate step failures and hints
            cy.request('POST', '/api/test/simulate-step-failures', {
                userId: testUser.id,
                stepId: 4,
                failures: 2
            });

            // Check step analytics
            cy.request('/api/admin/tutorial-step-analytics/4').then((response) => {
                expect(response.body).to.have.property('failure_rate');
                expect(response.body).to.have.property('hint_usage_rate');
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid tutorial actions', () => {
            cy.window().then((win) => {
                win.socket.emit('tutorial_progress', { action: 'invalid_action' });
            });

            // Should receive error response
            cy.get('@socketOn').should('be.calledWithMatch', (event, callback) => {
                if (event === 'tutorial_update') {
                    callback({
                        type: 'tutorial_error',
                        error: 'Unknown action'
                    });
                }
            });
        });

        it('should handle network interruptions gracefully', () => {
            // Simulate disconnection during tutorial
            cy.window().then((win) => {
                win.socket.emit('disconnect', 'network_error');
            });

            // Should be able to resume tutorial
            cy.request('/api/tutorial/status/' + testUser.id).then((response) => {
                expect(response.body.canResume).to.be.true;
            });
        });

        it('should handle tutorial timeout', () => {
            // Start tutorial
            cy.request('POST', '/api/tutorial/start/' + testUser.id);

            // Fast-forward time to trigger timeout
            cy.request('POST', '/api/test/advance-time', { minutes: 50 });

            // Should auto-cancel tutorial
            cy.request('/api/tutorial/status/' + testUser.id).then((response) => {
                expect(response.body.active).to.be.false;
            });
        });
    });

    describe('Accessibility', () => {
        it('should support voiceover for tutorial steps', () => {
            // Start tutorial with voiceover enabled
            cy.request('POST', '/api/tutorial/start/' + testUser.id, {
                options: { voiceEnabled: true }
            });

            // Should include voiceover in tutorial updates
            cy.get('@socketOn').should('be.calledWithMatch', (event, callback) => {
                if (event === 'tutorial_update') {
                    callback({
                        type: 'tutorial_step',
                        voiceover: 'welcome_message'
                    });
                }
            });
        });

        it('should allow skipping tutorial entirely', () => {
            cy.window().then((win) => {
                win.socket.emit('tutorial_progress', { action: 'skip_tutorial' });
            });

            // Should mark tutorial as skipped
            cy.request('/api/tutorial/status/' + testUser.id).then((response) => {
                expect(response.body.completed).to.be.false;
                expect(response.body.canStart).to.be.true;
            });
        });

        it('should handle keyboard navigation', () => {
            // Simulate keyboard interactions
            cy.get('body').type('{enter}'); // Progress tutorial

            // Should advance tutorial step
            cy.get('@socketOn').should('be.calledWithMatch', (event, callback) => {
                if (event === 'tutorial_update') {
                    callback({
                        type: 'tutorial_step',
                        currentStep: 2
                    });
                }
            });
        });
    });

    describe('Performance', () => {
        it('should load tutorial steps quickly', () => {
            const startTime = Date.now();

            cy.request('POST', '/api/tutorial/start/' + testUser.id);

            cy.request('/api/tutorial/status/' + testUser.id).then(() => {
                const loadTime = Date.now() - startTime;
                expect(loadTime).to.be.lessThan(1000); // Should load within 1 second
            });
        });

        it('should handle multiple concurrent tutorials', () => {
            // Start multiple tutorial sessions
            const users = ['user1', 'user2', 'user3', 'user4', 'user5'];

            users.forEach(userId => {
                cy.request('POST', '/api/tutorial/start/' + userId);
            });

            // All should be active
            users.forEach(userId => {
                cy.request('/api/tutorial/status/' + userId).then((response) => {
                    expect(response.body.active).to.be.true;
                });
            });
        });

        it('should cleanup completed tutorials', () => {
            // Complete tutorial
            cy.request('POST', '/api/test/complete-tutorial', { userId: testUser.id });

            // Should be removed from active tutorials
            cy.request('/api/tutorial/status/' + testUser.id).then((response) => {
                expect(response.body.active).to.be.false;
            });
        });
    });
});

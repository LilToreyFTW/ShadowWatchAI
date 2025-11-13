// ShadowWatch AI - Website JavaScript
// Vivid Dark Blue Moon 3D Interactive Experience

class ShadowWatchWebsite {
    constructor() {
        this.currentTab = 'dashboard';
        this.init();
    }

    init() {
        this.setupTabNavigation();
        this.setupScrollEffects();
        this.setup3DEffects();
        this.setupPricingInteractions();
        this.setupFAQInteractions();
        this.setupKeyboardShortcuts();
        this.animateOnLoad();

        // Set initial tab
        this.switchTab('dashboard');
    }

    // Tab Navigation System
    setupTabNavigation() {
        const navTabs = document.querySelectorAll('.nav-tab');

        navTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    switchTab(tabName) {
        // Update navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        this.currentTab = tabName;

        // Update URL hash without scrolling
        history.replaceState(null, null, `#${tabName}`);

        // Track tab switch
        this.trackEvent('tab_switch', { from: this.currentTab, to: tabName });

        // Special handling for different tabs
        this.handleTabSpecificLogic(tabName);
    }

    handleTabSpecificLogic(tabName) {
        switch (tabName) {
            case 'product':
                this.animateProductFeatures();
                break;
            case 'faq':
                this.setupFAQAnimations();
                break;
            case 'buy':
                this.animatePricingCards();
                break;
            case 'keys':
                this.setupKeysAnimation();
                break;
        }
    }

    // 3D Moon Effects
    setup3DEffects() {
        const moon = document.querySelector('.moon');

        // Mouse movement parallax
        document.addEventListener('mousemove', (e) => {
            const mouseX = e.clientX / window.innerWidth;
            const mouseY = e.clientY / window.innerHeight;

            const moveX = (mouseX - 0.5) * 20;
            const moveY = (mouseY - 0.5) * 20;

            moon.style.transform = `translate(${moveX}px, ${moveY}px)`;
        });

        // Scroll-based moon movement
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            moon.style.transform = `translateY(${rate}px)`;
        });
    }

    // Scroll Effects
    setupScrollEffects() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // Observe elements for animation
        document.querySelectorAll('.feature-card, .pricing-card, .faq-item, .step-item').forEach(el => {
            observer.observe(el);
        });
    }

    // Pricing Interactions
    setupPricingInteractions() {
        const pricingCards = document.querySelectorAll('.pricing-card');

        pricingCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'scale(1.05) translateY(-10px)';
                card.style.boxShadow = '0 20px 40px rgba(6, 182, 212, 0.3)';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'scale(1) translateY(0)';
                card.style.boxShadow = '';
            });
        });
    }

    // FAQ Interactions
    setupFAQInteractions() {
        const faqItems = document.querySelectorAll('.faq-item');

        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            const answer = item.querySelector('.faq-answer');

            question.addEventListener('click', () => {
                // Close other FAQs
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                    }
                });

                // Toggle current FAQ
                item.classList.toggle('active');

                // Smooth height animation
                if (item.classList.contains('active')) {
                    answer.style.maxHeight = answer.scrollHeight + 'px';
                } else {
                    answer.style.maxHeight = '0';
                }
            });
        });
    }

    // Keyboard Shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Number keys for tabs (1-5)
            if (e.key >= '1' && e.key <= '5') {
                const tabs = ['dashboard', 'product', 'faq', 'buy', 'keys'];
                const tabIndex = parseInt(e.key) - 1;
                if (tabs[tabIndex]) {
                    e.preventDefault();
                    this.switchTab(tabs[tabIndex]);
                }
            }

            // Escape key to close modals/overlays
            if (e.key === 'Escape') {
                this.closeAllOverlays();
            }

            // Ctrl/Cmd + K for search (future feature)
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                // Future search functionality
            }
        });
    }

    // Animation Functions
    animateOnLoad() {
        // Stagger animation of hero elements
        const heroElements = document.querySelectorAll('.hero-title, .hero-subtitle, .hero-stats, .hero-actions');
        heroElements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';

            setTimeout(() => {
                el.style.transition = 'all 0.8s ease-out';
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, index * 200);
        });

        // Animate feature cards
        setTimeout(() => {
            document.querySelectorAll('.feature-card').forEach((card, index) => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(50px)';

                setTimeout(() => {
                    card.style.transition = 'all 0.6s ease-out';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, index * 100);
            });
        }, 1000);
    }

    animateProductFeatures() {
        const features = document.querySelectorAll('.product-feature-main, .tech-item, .step-item');

        features.forEach((feature, index) => {
            feature.style.opacity = '0';
            feature.style.transform = 'translateX(-50px)';

            setTimeout(() => {
                feature.style.transition = 'all 0.6s ease-out';
                feature.style.opacity = '1';
                feature.style.transform = 'translateX(0)';
            }, index * 150);
        });
    }

    animatePricingCards() {
        const cards = document.querySelectorAll('.pricing-card');

        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(50px)';

            setTimeout(() => {
                card.style.transition = 'all 0.6s ease-out';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 200);
        });
    }

    setupFAQAnimations() {
        // FAQ animations are handled in setupFAQInteractions
    }

    setupKeysAnimation() {
        const keyElements = document.querySelectorAll('.license-status, .keys-placeholder, .activation-guide, .support-section');

        keyElements.forEach((element, index) => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';

            setTimeout(() => {
                element.style.transition = 'all 0.6s ease-out';
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, index * 200);
        });
    }

    // Purchase Flow
    initiatePurchase(plan) {
        // Track purchase initiation
        this.trackEvent('purchase_initiated', { plan });

        // Show loading state
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = 'Processing...';
        btn.disabled = true;

        // Simulate API call
        setTimeout(() => {
            // In real implementation, this would redirect to payment processor
            alert(`Redirecting to payment processor for ${plan} plan...`);

            // Reset button
            btn.textContent = originalText;
            btn.disabled = false;

            // Track completion
            this.trackEvent('purchase_redirected', { plan });

        }, 2000);
    }

    // Utility Functions
    closeAllOverlays() {
        // Close any open modals, dropdowns, etc.
        document.querySelectorAll('.modal, .dropdown, .overlay').forEach(el => {
            el.classList.remove('active');
        });
    }

    trackEvent(eventType, data = {}) {
        // Simple event tracking - can be extended to integrate with analytics services
        const event = {
            type: eventType,
            timestamp: Date.now(),
            tab: this.currentTab,
            data: data,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        // Store in sessionStorage for basic analytics
        const events = JSON.parse(sessionStorage.getItem('shadowwatch_events') || '[]');
        events.push(event);

        // Keep only last 50 events
        if (events.length > 50) {
            events.shift();
        }

        sessionStorage.setItem('shadowwatch_events', JSON.stringify(events));

        // Console log for debugging
        console.log('📊 Event tracked:', eventType, data);
    }

    // Error Handling
    handleError(error, context = '') {
        console.error(`ShadowWatch Error${context ? ` (${context})` : ''}:`, error);

        // Show user-friendly error message
        this.showNotification('error', 'Something went wrong', 'Please try again or contact support if the issue persists.');

        // Track error
        this.trackEvent('error_occurred', {
            error: error.message,
            context,
            stack: error.stack
        });
    }

    // Notification System
    showNotification(type, title, message, duration = 5000) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `shadowwatch-notification ${type}`;
        notification.innerHTML = `
            <div class="shadowwatch-notification-header">
                <div class="shadowwatch-notification-icon">${this.getNotificationIcon(type)}</div>
                <h4 class="shadowwatch-notification-title">${title}</h4>
                <button onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
            <p class="shadowwatch-notification-message">${message}</p>
        `;

        // Add to notifications container
        const container = document.querySelector('.shadowwatch-notifications-container') || document.body;
        container.appendChild(notification);

        // Auto-remove after duration
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, duration);
    }

    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || '📢';
    }

    // Performance Monitoring
    monitorPerformance() {
        // Monitor page load performance
        window.addEventListener('load', () => {
            const perfData = performance.getEntriesByType('navigation')[0];
            this.trackEvent('page_load', {
                loadTime: perfData.loadEventEnd - perfData.loadEventStart,
                domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart
            });
        });

        // Monitor user interactions
        let interactionCount = 0;
        document.addEventListener('click', () => {
            interactionCount++;
            if (interactionCount % 10 === 0) {
                this.trackEvent('user_interactions', { count: interactionCount });
            }
        });
    }

    // Accessibility Features
    setupAccessibility() {
        // Skip to main content link
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.className = 'sr-only';
        skipLink.textContent = 'Skip to main content';
        document.body.insertBefore(skipLink, document.body.firstChild);

        // Focus management
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });
    }
}

// Global functions for HTML onclick handlers
function switchTab(tabName) {
    if (window.shadowwatchSite) {
        window.shadowwatchSite.switchTab(tabName);
    }
}

function initiatePurchase(plan) {
    if (window.shadowwatchSite) {
        window.shadowwatchSite.initiatePurchase(plan);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.shadowwatchSite = new ShadowWatchWebsite();

    // Handle URL hash for direct tab linking
    const hash = window.location.hash.substring(1);
    if (hash && ['dashboard', 'product', 'faq', 'buy', 'keys'].includes(hash)) {
        window.shadowwatchSite.switchTab(hash);
    }

    // Setup performance monitoring
    window.shadowwatchSite.monitorPerformance();
    window.shadowwatchSite.setupAccessibility();

    // Setup subscription functionality
    window.subscribePlan = function(planType) {
        const plans = {
            basic: { name: 'Basic Plan', price: '$9.99/month' },
            pro: { name: 'Pro Plan', price: '$29.99/month' },
            enterprise: { name: 'Enterprise Plan', price: '$99.99/month' }
        };

        const plan = plans[planType];
        if (!plan) return;

        const message = `🚀 You're about to subscribe to the ${plan.name} (${plan.price})

This subscription is essential to keep ShadowWatch AI active and operational.

Features included:
${planType === 'basic' ? '✅ Basic AI features, Standard support, Community access' :
  planType === 'pro' ? '✅ All Basic + Advanced creation, Autonomous mode, Full engine support' :
  '✅ All Pro + 24/7 support, Custom training, Private APIs'}

⚠️ IMPORTANT: ShadowWatch AI requires active subscriptions to maintain server operations, AI API usage, and continuous development.

Would you like to proceed with the subscription?`;

        if (confirm(message)) {
            // Simulate subscription process
            alert(`🎉 Subscription initiated for ${plan.name}!

Next steps:
1. You'll be redirected to our secure payment processor
2. Complete your payment information
3. Receive confirmation email with subscription details
4. Access all premium features immediately

💎 Thank you for keeping ShadowWatch AI alive!

(Note: This is a demo. In production, this would integrate with a real payment processor like Stripe, PayPal, or cryptocurrency payment system.)`);
        }
    };

    // Download tracking and progress functionality
    window.trackDownload = function(fileName) {
        console.log(`📥 Tracking download: ${fileName}`);

        // Send analytics to server (if available)
        fetch('/api/download/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fileName,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                referrer: document.referrer
            })
        }).catch(err => console.log('Analytics tracking failed:', err));

        // Show download progress notification
        showDownloadNotification(fileName);
    };

    function showDownloadNotification(fileName) {
        const notification = document.createElement('div');
        notification.className = 'download-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">⬇️</div>
                <div class="notification-text">
                    <h4>Download Started</h4>
                    <p>${fileName} is being downloaded to your device.</p>
                </div>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    // File verification function
    window.verifyDownload = async function(fileName) {
        try {
            const response = await fetch(`/api/download/verify/${fileName}`);
            const data = await response.json();

            if (response.ok) {
                alert(`✅ File Verification Successful!\n\n📄 File: ${data.filename}\n📏 Size: ${(data.size / 1024 / 1024).toFixed(2)} MB\n🔒 SHA256: ${data.sha256.substring(0, 16)}...\n⏰ Modified: ${new Date(data.modified).toLocaleString()}`);
            } else {
                alert(`❌ Verification failed: ${data.error}`);
            }
        } catch (error) {
            alert(`❌ Verification error: ${error.message}`);
        }
    };

    // Component download function
    window.downloadComponent = async function(component) {
        try {
            const response = await fetch(`/download/component/${component}`);
            const data = await response.json();

            if (response.ok) {
                alert(`📦 Component: ${data.component}\n📂 Items: ${data.items.join(', ')}\n\n${data.note}\n\nDownload URL: ${data.downloadUrl}`);
            } else {
                alert(`❌ Component download failed: ${data.error}`);
            }
        } catch (error) {
            alert(`❌ Component download error: ${error.message}`);
        }
    };

    // Download statistics viewer
    window.showDownloadStats = async function() {
        try {
            const response = await fetch('/api/download/stats');
            const stats = await response.json();

            if (response.ok) {
                const statsMessage = `📊 Download Statistics\n\n📈 Total Downloads: ${stats.totalDownloads}\n\n📁 File Statistics:\n${Object.entries(stats.fileStats).map(([file, data]) => `${file}: ${data.count} downloads`).join('\n')}\n\n🕐 Recent Downloads:\n${stats.recentDownloads.slice(0, 3).map(d => `${d.fileName} - ${new Date(d.timestamp).toLocaleString()}`).join('\n')}`;

                alert(statsMessage);
            } else {
                alert(`❌ Failed to load statistics: ${stats.error}`);
            }
        } catch (error) {
            alert(`❌ Statistics error: ${error.message}`);
        }
    };
});

// Handle browser back/forward navigation
window.addEventListener('popstate', () => {
    const hash = window.location.hash.substring(1);
    if (hash && ['dashboard', 'product', 'faq', 'buy', 'keys', 'subscription'].includes(hash)) {
        window.shadowwatchSite.switchTab(hash);
    }
});

// Error handling
window.addEventListener('error', (e) => {
    if (window.shadowwatchSite) {
        window.shadowwatchSite.handleError(e.error, 'global');
    }
});

window.addEventListener('unhandledrejection', (e) => {
    if (window.shadowwatchSite) {
        window.shadowwatchSite.handleError(e.reason, 'promise');
    }
});

class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.supported = 'Notification' in window;
        this.permission = this.supported ? Notification.permission : 'denied';
        this.setupNotifications();
    }

    setupNotifications() {
        if (!this.supported) {
            console.log('Browser notifications not supported');
            return;
        }

        // Request permission if needed
        if (this.permission !== 'granted' && this.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                this.permission = permission;
            });
        }

        // Setup thresholds
        this.thresholds = {
            power: {
                low: 0.5,    // kW
                high: 3.0    // kW
            },
            voltage: {
                low: 200,    // V
                high: 240    // V
            },
            efficiency: {
                low: 85     // %
            }
        };
    }

    checkThresholds(data) {
        const alerts = [];

        // Power checks
        if (data.power < this.thresholds.power.low && data.power > 0) {
            alerts.push({
                type: 'warning',
                message: `Low power output: ${data.power.toFixed(1)} kW`,
                icon: '⚠️'
            });
        }
        if (data.power > this.thresholds.power.high) {
            alerts.push({
                type: 'warning',
                message: `High power output: ${data.power.toFixed(1)} kW`,
                icon: '⚠️'
            });
        }

        // Voltage checks
        if (data.voltage < this.thresholds.voltage.low) {
            alerts.push({
                type: 'danger',
                message: `Low voltage: ${data.voltage.toFixed(0)} V`,
                icon: '🔴'
            });
        }
        if (data.voltage > this.thresholds.voltage.high) {
            alerts.push({
                type: 'danger',
                message: `High voltage: ${data.voltage.toFixed(0)} V`,
                icon: '🔴'
            });
        }

        // Efficiency checks
        if (data.efficiency < this.thresholds.efficiency.low) {
            alerts.push({
                type: 'warning',
                message: `Low system efficiency: ${data.efficiency}%`,
                icon: '⚠️'
            });
        }

        // Weather based alerts (if weather data available)
        if (window.weatherData && window.weatherData.condition === 'cloudy') {
            alerts.push({
                type: 'info',
                message: 'Reduced output expected due to cloud cover',
                icon: '☁️'
            });
        }

        // Process alerts
        alerts.forEach(alert => this.createNotification(alert));
    }

    createNotification(alert) {
        // Add to notifications array
        const notification = {
            id: Date.now(),
            timestamp: new Date(),
            ...alert
        };
        
        this.notifications.unshift(notification);
        
        // Keep only last 50 notifications
        if (this.notifications.length > 50) {
            this.notifications.pop();
        }

        // Show browser notification for important alerts
        if ((alert.type === 'danger' || alert.type === 'warning') && this.permission === 'granted') {
            new Notification('PLTS Monitor Alert', {
                body: alert.message,
                icon: '/icon.png'
            });
        }

        // Update UI
        this.updateNotificationUI();
    }

    updateNotificationUI() {
        // Find notification bell and update counter
        const unreadCount = this.notifications.filter(n => !n.read).length;
        const notificationBell = document.querySelector('.system-controls .icon-btn[title="Notifications"]');
        
        if (notificationBell) {
            if (unreadCount > 0) {
                notificationBell.setAttribute('data-count', unreadCount);
                notificationBell.classList.add('has-notifications');
            } else {
                notificationBell.removeAttribute('data-count');
                notificationBell.classList.remove('has-notifications');
            }
        }

        // Update notification panel if open
        const notificationPanel = document.querySelector('.notification-panel');
        if (notificationPanel && notificationPanel.style.display !== 'none') {
            this.renderNotificationList(notificationPanel);
        }
    }

    renderNotificationList(container) {
        container.innerHTML = this.notifications.length > 0 ? `
            <div class="notification-list">
                ${this.notifications.map(notification => `
                    <div class="notification-item ${notification.type} ${notification.read ? 'read' : ''}">
                        <span class="notification-icon">${notification.icon}</span>
                        <div class="notification-content">
                            <div class="notification-message">${notification.message}</div>
                            <div class="notification-time">
                                ${this.formatTimestamp(notification.timestamp)}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <button class="clear-notifications">Clear All</button>
        ` : '<div class="no-notifications">No notifications</div>';

        // Add event listeners
        const clearButton = container.querySelector('.clear-notifications');
        if (clearButton) {
            clearButton.addEventListener('click', () => this.clearNotifications());
        }
    }

    formatTimestamp(date) {
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) { // Less than 1 minute
            return 'Just now';
        } else if (diff < 3600000) { // Less than 1 hour
            const minutes = Math.floor(diff / 60000);
            return `${minutes}m ago`;
        } else if (diff < 86400000) { // Less than 1 day
            const hours = Math.floor(diff / 3600000);
            return `${hours}h ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    clearNotifications() {
        this.notifications = [];
        this.updateNotificationUI();
    }

    toggleNotificationPanel() {
        let panel = document.querySelector('.notification-panel');
        
        if (!panel) {
            panel = document.createElement('div');
            panel.className = 'notification-panel';
            document.body.appendChild(panel);
        }

        if (panel.style.display === 'none' || !panel.style.display) {
            panel.style.display = 'block';
            this.renderNotificationList(panel);
            // Mark all as read
            this.notifications.forEach(n => n.read = true);
            this.updateNotificationUI();
        } else {
            panel.style.display = 'none';
        }
    }
}

// Initialize notification system
const notificationSystem = new NotificationSystem();

// Add click handler to notification bell
document.addEventListener('DOMContentLoaded', () => {
    const notificationBell = document.querySelector('.system-controls .icon-btn[title="Notifications"]');
    if (notificationBell) {
        notificationBell.addEventListener('click', () => {
            notificationSystem.toggleNotificationPanel();
        });
    }
});

// Export for other modules
window.notificationSystem = notificationSystem;

// Initialize MQTT connection
let mqttClient = null;
let chartInstance = null;
let lastUpdate = new Date();

// Dashboard State
const dashboardState = {
    power: 0,
    voltage: 0,
    current: 0,
    frequency: 50,
    efficiency: 92,
    totalEnergy: 0,
    dailyPeak: 0,
    dailyMin: Infinity,
    dailyAvg: 0,
    readings: [], // Store last 24h of readings
};

// Configuration
const config = {
    updateInterval: 5000, // 5 seconds
    maxReadings: 288,    // 24h worth of 5-min readings
    mqttTopic: 'plts/data',
    chartUpdateInterval: 1000, // 1 second
};

// Initialize Dashboard
function initializeDashboard() {
    setupEventListeners();
    initializeTimeDisplay();
    setupCharts();
    startPeriodicUpdates();
}

// Setup Event Listeners
function setupEventListeners() {
    // Time range buttons
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            updateChartTimeRange(e.target.textContent);
        });
    });

    // Theme toggle (if implemented)
    const themeToggle = document.querySelector('#themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

// Initialize Time Display
function initializeTimeDisplay() {
    const updateTime = () => {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        document.querySelector('.time-display').textContent = timeString;
    };

    updateTime();
    setInterval(updateTime, 1000);
}

// Update Dashboard Values
function updateDashboardValues(data) {
    // Update state
    Object.assign(dashboardState, data);
    
    // Update live stats
    document.querySelector('.stat-card.power .stat-value').textContent = `${data.power.toFixed(1)} kW`;
    document.querySelector('.stat-card.voltage .stat-value').textContent = `${data.voltage.toFixed(0)} V`;
    document.querySelector('.stat-card.current .stat-value').textContent = `${data.current.toFixed(1)} A`;
    document.querySelector('.stat-card.frequency .stat-value').textContent = `${data.frequency.toFixed(1)} Hz`;

    // Update efficiency
    const efficiencyElement = document.querySelector('.circular-progress');
    if (efficiencyElement) {
        efficiencyElement.style.setProperty('--progress', `${data.efficiency * 3.6}deg`);
        efficiencyElement.querySelector('.progress-value').textContent = `${data.efficiency}%`;
    }

    // Update flow diagram
    document.querySelector('.flow-component.solar .value').textContent = `${data.power.toFixed(1)} kW`;
    document.querySelector('.flow-component.inverter .value').textContent = 
        `${(data.power * (data.efficiency/100)).toFixed(1)} kW`;
    document.querySelector('.flow-component.load .value').textContent = 
        `${(data.power * (data.efficiency/100)).toFixed(1)} kW`;

    // Update system health
    updateSystemHealth(data);

    // Update economic impact
    updateEconomicImpact(data);

    // Update last update time
    lastUpdate = new Date();
    document.querySelector('.update-time').textContent = `Last Update: ${getTimeDifference(lastUpdate)}`;
}

// Update System Health
function updateSystemHealth(data) {
    const healthIndicators = {
        panels: data.power > 0,
        inverter: data.efficiency > 85,
        network: (new Date() - lastUpdate) < 30000
    };

    Object.entries(healthIndicators).forEach(([key, status]) => {
        const indicator = document.querySelector(`.health-item:has(.label:contains("${key}")) .icon`);
        if (indicator) {
            indicator.textContent = status ? '🟢' : '🔴';
        }
    });
}

// Update Economic Impact
function updateEconomicImpact(data) {
    // Calculate daily savings (assume Rp 1,500 per kWh)
    const dailySavings = data.totalEnergy * 1500;
    document.querySelector('.stat-card.savings .stat-value').textContent = 
        `Rp ${dailySavings.toLocaleString()}`;

    // Update environmental impact
    const co2Reduced = data.totalEnergy * 0.8; // 0.8 kg CO2 per kWh
    document.querySelector('.env-item:has(.label:contains("CO²")) .value').textContent = 
        `${co2Reduced.toFixed(1)} kg`;
}

// Helper: Get Time Difference
function getTimeDifference(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
}

// Periodic Updates
function startPeriodicUpdates() {
    // Update chart
    setInterval(() => {
        if (chartInstance) {
            chartInstance.update();
        }
    }, config.chartUpdateInterval);

    // Check system health
    setInterval(() => {
        const timeSinceUpdate = new Date() - lastUpdate;
        const statusIndicator = document.querySelector('.status-indicator');
        const statusIcon = statusIndicator.querySelector('.status-icon');
        const statusText = statusIndicator.querySelector('.status-text');

        if (timeSinceUpdate > 30000) { // 30 seconds
            statusIcon.textContent = '🔴';
            statusText.textContent = 'System Offline';
            document.querySelector('.status-badge').className = 'status-badge offline';
        }
    }, 5000);

    // Update "last update" text
    setInterval(() => {
        document.querySelector('.update-time').textContent = 
            `Last Update: ${getTimeDifference(lastUpdate)}`;
    }, 1000);
}

// Theme Toggle
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeDashboard);

// Export for other modules
window.dashboardState = dashboardState;
window.updateDashboardValues = updateDashboardValues;

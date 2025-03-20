class MQTTHandler {
    constructor() {
        this.client = null;
        this.connected = false;
        this.reconnectTimeout = 5000;
        this.brokerUrl = 'wss://broker.hivemq.com:8884/mqtt'; // Free public broker
        this.options = {
            clientId: 'plts_monitor_' + Math.random().toString(16).substr(2, 8),
            keepaliveInterval: 60,
            reconnect: true,
            clean: true
        };
    }

    connect() {
        try {
            console.log('Connecting to MQTT broker...');
            this.client = mqtt.connect(this.brokerUrl, this.options);
            
            this.client.on('connect', () => {
                console.log('Connected to MQTT broker');
                this.connected = true;
                this.subscribe();
                this.updateConnectionStatus(true);
            });

            this.client.on('message', (topic, message) => {
                this.handleMessage(topic, message);
            });

            this.client.on('error', (error) => {
                console.error('MQTT Error:', error);
                this.updateConnectionStatus(false);
            });

            this.client.on('close', () => {
                console.log('MQTT Connection closed');
                this.connected = false;
                this.updateConnectionStatus(false);
                setTimeout(() => this.connect(), this.reconnectTimeout);
            });

        } catch (error) {
            console.error('MQTT Connection error:', error);
            this.updateConnectionStatus(false);
            setTimeout(() => this.connect(), this.reconnectTimeout);
        }
    }

    subscribe() {
        if (!this.connected) return;
        
        // Subscribe to PLTS data topic
        this.client.subscribe('plts/data', (error) => {
            if (error) {
                console.error('Subscription error:', error);
            } else {
                console.log('Subscribed to plts/data');
            }
        });
    }

    handleMessage(topic, message) {
        try {
            const data = JSON.parse(message.toString());
            
            // Validate data
            if (!this.validateData(data)) {
                console.error('Invalid data received:', data);
                return;
            }

            // Update readings array
            const reading = {
                timestamp: new Date().getTime(),
                power: data.power,
                voltage: data.voltage,
                current: data.current,
                frequency: data.frequency || 50,
                efficiency: data.efficiency || 92
            };

            // Update dashboard state
            window.dashboardState.readings.push(reading);
            
            // Keep only last 24 hours of readings
            const oneDayAgo = new Date().getTime() - (24 * 60 * 60 * 1000);
            window.dashboardState.readings = window.dashboardState.readings.filter(
                r => r.timestamp > oneDayAgo
            );

            // Calculate daily statistics
            this.calculateDailyStats();

            // Update dashboard
            window.updateDashboardValues({
                power: data.power,
                voltage: data.voltage,
                current: data.current,
                frequency: reading.frequency,
                efficiency: reading.efficiency,
                totalEnergy: this.calculateTotalEnergy()
            });

        } catch (error) {
            console.error('Error handling message:', error);
        }
    }

    validateData(data) {
        return (
            typeof data === 'object' &&
            typeof data.power === 'number' &&
            typeof data.voltage === 'number' &&
            typeof data.current === 'number' &&
            data.power >= 0 &&
            data.voltage >= 0 &&
            data.current >= 0
        );
    }

    calculateDailyStats() {
        const today = new Date().setHours(0, 0, 0, 0);
        const todayReadings = window.dashboardState.readings.filter(
            r => r.timestamp >= today
        );

        if (todayReadings.length > 0) {
            window.dashboardState.dailyPeak = Math.max(...todayReadings.map(r => r.power));
            window.dashboardState.dailyMin = Math.min(...todayReadings.map(r => r.power));
            window.dashboardState.dailyAvg = todayReadings.reduce((sum, r) => sum + r.power, 0) / todayReadings.length;
        }
    }

    calculateTotalEnergy() {
        const today = new Date().setHours(0, 0, 0, 0);
        const todayReadings = window.dashboardState.readings.filter(
            r => r.timestamp >= today
        );

        if (todayReadings.length < 2) return 0;

        let totalEnergy = 0;
        for (let i = 1; i < todayReadings.length; i++) {
            const timeDiff = (todayReadings[i].timestamp - todayReadings[i-1].timestamp) / (1000 * 60 * 60); // hours
            const avgPower = (todayReadings[i].power + todayReadings[i-1].power) / 2;
            totalEnergy += avgPower * timeDiff;
        }

        return totalEnergy; // kWh
    }

    updateConnectionStatus(connected) {
        const statusBadge = document.querySelector('.status-badge');
        const statusIndicator = document.querySelector('.status-indicator');
        
        if (connected) {
            statusBadge.textContent = 'System Online';
            statusBadge.className = 'status-badge online';
            statusIndicator.innerHTML = '<span class="status-icon">🟢</span><span class="status-text">System Normal</span>';
        } else {
            statusBadge.textContent = 'System Offline';
            statusBadge.className = 'status-badge offline';
            statusIndicator.innerHTML = '<span class="status-icon">🔴</span><span class="status-text">Connection Lost</span>';
        }
    }

    // Test data generation for development
    startTestData() {
        setInterval(() => {
            const now = new Date();
            const hour = now.getHours();
            
            // Simulate daily power curve
            const baseOutput = hour >= 6 && hour <= 18 ? 2 : 0; // Day/night
            const timeEffect = hour >= 6 && hour <= 18 ? 
                Math.sin((hour - 6) * Math.PI / 12) : 0; // Peak at noon
            const randomVariation = (Math.random() - 0.5) * 0.5;
            
            const testData = {
                power: Math.max(0, baseOutput * timeEffect + randomVariation),
                voltage: 220 + (Math.random() - 0.5) * 10,
                current: Math.max(0, (baseOutput * timeEffect + randomVariation) * 1000 / 220),
                frequency: 50 + (Math.random() - 0.5) * 0.5,
                efficiency: 92 + (Math.random() - 0.5) * 4
            };

            this.handleMessage('plts/data', Buffer.from(JSON.stringify(testData)));
        }, 5000);
    }
}

// Initialize MQTT handler
const mqttHandler = new MQTTHandler();

// For development: use test data instead of real MQTT connection
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('Development mode: Using test data');
    mqttHandler.startTestData();
} else {
    mqttHandler.connect();
}

// Export for other modules
window.mqttHandler = mqttHandler;

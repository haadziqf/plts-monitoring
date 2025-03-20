class WeatherSystem {
    constructor() {
        this.weatherData = null;
        this.location = null;
        this.updateInterval = 30 * 60 * 1000; // 30 minutes
        this.apiKey = 'YOUR_API_KEY'; // Replace with actual API key
        this.setupWeatherUpdates();
    }

    async setupWeatherUpdates() {
        // Get user's location
        try {
            await this.getLocation();
            await this.updateWeather();
            
            // Setup periodic updates
            setInterval(() => this.updateWeather(), this.updateInterval);
        } catch (error) {
            console.error('Weather setup error:', error);
        }
    }

    async getLocation() {
        return new Promise((resolve, reject) => {
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    position => {
                        this.location = {
                            lat: position.coords.latitude,
                            lon: position.coords.longitude
                        };
                        resolve(this.location);
                    },
                    error => {
                        console.warn('Location access denied, using default location');
                        // Default to a fixed location if geolocation is denied
                        this.location = {
                            lat: -6.2088,  // Jakarta coordinates
                            lon: 106.8456
                        };
                        resolve(this.location);
                    }
                );
            } else {
                reject(new Error('Geolocation not supported'));
            }
        });
    }

    async updateWeather() {
        if (!this.location) return;

        try {
            // For development/demo, generate mock weather data
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                this.weatherData = this.generateMockWeatherData();
            } else {
                // In production, fetch from actual weather API
                const response = await fetch(
                    `https://api.openweathermap.org/data/2.5/weather?lat=${this.location.lat}&lon=${this.location.lon}&appid=${this.apiKey}&units=metric`
                );
                const data = await response.json();
                this.weatherData = this.formatWeatherData(data);
            }

            this.updateWeatherUI();
            this.predictPerformance();
        } catch (error) {
            console.error('Weather update error:', error);
        }
    }

    formatWeatherData(data) {
        return {
            temperature: Math.round(data.main.temp),
            condition: data.weather[0].main.toLowerCase(),
            cloudCover: data.clouds.all,
            sunrise: new Date(data.sys.sunrise * 1000),
            sunset: new Date(data.sys.sunset * 1000),
            timestamp: new Date()
        };
    }

    generateMockWeatherData() {
        const now = new Date();
        const hour = now.getHours();
        
        // Simulate different weather conditions based on time
        let condition = 'clear';
        if (hour < 6 || hour > 18) condition = 'night';
        else if (hour > 12 && hour < 15) condition = 'cloudy';
        
        return {
            temperature: 25 + Math.round((Math.random() - 0.5) * 10),
            condition: condition,
            cloudCover: Math.round(Math.random() * 100),
            sunrise: new Date(now.setHours(6, 0, 0, 0)),
            sunset: new Date(now.setHours(18, 0, 0, 0)),
            timestamp: now
        };
    }

    updateWeatherUI() {
        if (!this.weatherData) return;

        // Update weather widget
        const weatherWidget = document.querySelector('.weather-widget');
        if (weatherWidget) {
            const { temperature, condition } = this.weatherData;
            
            // Update temperature
            const tempSpan = weatherWidget.querySelector('.temperature');
            if (tempSpan) {
                tempSpan.textContent = `${temperature}°C`;
            }

            // Update weather icon
            const iconSpan = weatherWidget.querySelector('.weather-icon');
            if (iconSpan) {
                iconSpan.textContent = this.getWeatherIcon(condition);
            }
        }
    }

    getWeatherIcon(condition) {
        const icons = {
            clear: '☀️',
            clouds: '☁️',
            rain: '🌧️',
            thunderstorm: '⛈️',
            snow: '❄️',
            mist: '🌫️',
            night: '🌙',
            cloudy: '⛅'
        };
        return icons[condition] || '🌤️';
    }

    predictPerformance() {
        if (!this.weatherData) return;

        const { condition, cloudCover, temperature } = this.weatherData;
        let efficiency = 100;
        let predictedChange = 0;

        // Adjust for cloud cover
        if (cloudCover > 0) {
            efficiency -= (cloudCover * 0.5); // 50% reduction at 100% cloud cover
        }

        // Adjust for temperature
        if (temperature > 25) {
            efficiency -= (temperature - 25) * 0.5; // 0.5% reduction per degree above 25°C
        }

        // Calculate predicted change
        predictedChange = ((efficiency - 100) * -1);

        // Update prediction card
        const predictionCard = document.querySelector('.prediction-card');
        if (predictionCard) {
            const predictionValue = predictionCard.querySelector('.prediction-value');
            const predictionDetail = predictionCard.querySelector('.prediction-detail');
            
            if (predictionValue) {
                predictionValue.textContent = `${predictedChange > 0 ? '+' : ''}${predictedChange.toFixed(1)}%`;
                predictionValue.style.color = predictedChange >= 0 ? 'var(--success)' : 'var(--warning)';
            }
            
            if (predictionDetail) {
                let message = 'Optimal conditions';
                if (cloudCover > 70) message = 'Heavy cloud cover expected';
                else if (temperature > 30) message = 'High temperature impact';
                else if (cloudCover > 30) message = 'Partial cloud cover';
                
                predictionDetail.textContent = message;
            }
        }

        // Notify if significant changes expected
        if (Math.abs(predictedChange) > 20) {
            window.notificationSystem?.createNotification({
                type: 'info',
                message: `Weather impact: ${predictedChange.toFixed(1)}% ${predictedChange > 0 ? 'increase' : 'decrease'} expected`,
                icon: this.getWeatherIcon(condition)
            });
        }
    }
}

// Initialize weather system
const weatherSystem = new WeatherSystem();

// Export for other modules
window.weatherSystem = weatherSystem;

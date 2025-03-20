// Chart Configuration
const chartConfig = {
    padding: 20,
    gridLines: 6,
    pointRadius: 4,
    lineWidth: 2,
    animationDuration: 300,
};

// Initialize Main Power Chart
function setupCharts() {
    const canvas = document.getElementById('powerChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    chartInstance = new PowerChart(ctx);
    
    // Initial render
    chartInstance.render();
}

// Power Chart Class
class PowerChart {
    constructor(ctx) {
        this.ctx = ctx;
        this.canvas = ctx.canvas;
        this.data = window.dashboardState.readings;
        this.timeRange = '24h';
        this.tooltip = this.createTooltip();
        
        // Setup canvas
        this.setupCanvas();
        
        // Bind events
        this.bindEvents();
    }

    setupCanvas() {
        // Set canvas size
        this.resize();

        // Setup high-DPI canvas
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = `${rect.width}px`;
        this.canvas.style.height = `${rect.height}px`;
    }

    createTooltip() {
        const tooltip = document.createElement('div');
        tooltip.className = 'chart-tooltip';
        tooltip.style.display = 'none';
        document.body.appendChild(tooltip);
        return tooltip;
    }

    bindEvents() {
        // Resize handling
        window.addEventListener('resize', () => {
            this.resize();
            this.render();
        });

        // Mouse interactions
        let hoveredPoint = null;

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Find closest point
            hoveredPoint = this.findClosestPoint(x, y);

            if (hoveredPoint) {
                this.showTooltip(hoveredPoint, e.clientX, e.clientY);
            } else {
                this.hideTooltip();
            }

            this.render();
        });

        this.canvas.addEventListener('mouseleave', () => {
            hoveredPoint = null;
            this.hideTooltip();
            this.render();
        });
    }

    resize() {
        const parent = this.canvas.parentElement;
        this.canvas.width = parent.clientWidth;
        this.canvas.height = parent.clientHeight;
    }

    findClosestPoint(x, y) {
        const points = this.calculatePoints();
        let closest = null;
        let minDistance = Infinity;

        points.forEach(point => {
            const distance = Math.sqrt(
                Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2)
            );

            if (distance < minDistance && distance < 20) {
                minDistance = distance;
                closest = point;
            }
        });

        return closest;
    }

    showTooltip(point, clientX, clientY) {
        const date = new Date(point.timestamp);
        this.tooltip.innerHTML = `
            <div class="chart-tooltip-header">
                ${date.toLocaleTimeString()}
            </div>
            <div class="chart-tooltip-value">
                ${point.value.toFixed(2)} kW
            </div>
        `;

        this.tooltip.style.display = 'block';
        this.tooltip.style.left = `${clientX + 10}px`;
        this.tooltip.style.top = `${clientY + 10}px`;
    }

    hideTooltip() {
        this.tooltip.style.display = 'none';
    }

    calculatePoints() {
        const width = this.canvas.width - (chartConfig.padding * 2);
        const height = this.canvas.height - (chartConfig.padding * 2);
        const points = [];

        if (this.data.length < 2) return points;

        const maxValue = Math.max(...this.data.map(d => d.power)) * 1.1;
        const minValue = 0;

        this.data.forEach((reading, i) => {
            const x = chartConfig.padding + (i * (width / (this.data.length - 1)));
            const y = height - (((reading.power - minValue) / (maxValue - minValue)) * height) + chartConfig.padding;
            points.push({
                x,
                y,
                value: reading.power,
                timestamp: reading.timestamp
            });
        });

        return points;
    }

    drawGrid() {
        const { ctx, canvas } = this;
        const { width, height } = canvas;

        ctx.beginPath();
        ctx.strokeStyle = getComputedStyle(document.documentElement)
            .getPropertyValue('--chart-grid')
            .trim();
        ctx.lineWidth = 1;

        // Vertical grid lines
        for (let i = 0; i <= chartConfig.gridLines; i++) {
            const x = chartConfig.padding + ((width - (chartConfig.padding * 2)) * (i / chartConfig.gridLines));
            ctx.moveTo(x, chartConfig.padding);
            ctx.lineTo(x, height - chartConfig.padding);
        }

        // Horizontal grid lines
        for (let i = 0; i <= chartConfig.gridLines; i++) {
            const y = chartConfig.padding + ((height - (chartConfig.padding * 2)) * (i / chartConfig.gridLines));
            ctx.moveTo(chartConfig.padding, y);
            ctx.lineTo(width - chartConfig.padding, y);
        }

        ctx.stroke();
    }

    drawChart() {
        const points = this.calculatePoints();
        if (points.length < 2) return;

        const { ctx } = this;

        // Draw line
        ctx.beginPath();
        ctx.strokeStyle = getComputedStyle(document.documentElement)
            .getPropertyValue('--chart-line')
            .trim();
        ctx.lineWidth = chartConfig.lineWidth;
        ctx.lineJoin = 'round';

        points.forEach((point, i) => {
            if (i === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });
        ctx.stroke();

        // Draw gradient area
        const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, 'rgba(37,99,235,0.2)');
        gradient.addColorStop(1, 'rgba(37,99,235,0)');

        ctx.beginPath();
        ctx.fillStyle = gradient;
        points.forEach((point, i) => {
            if (i === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });
        ctx.lineTo(points[points.length - 1].x, this.canvas.height - chartConfig.padding);
        ctx.lineTo(points[0].x, this.canvas.height - chartConfig.padding);
        ctx.closePath();
        ctx.fill();

        // Draw points
        points.forEach(point => {
            ctx.beginPath();
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = getComputedStyle(document.documentElement)
                .getPropertyValue('--chart-line')
                .trim();
            ctx.lineWidth = 2;
            ctx.arc(point.x, point.y, chartConfig.pointRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });
    }

    render() {
        const { ctx, canvas } = this;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw components
        this.drawGrid();
        this.drawChart();
    }

    update() {
        this.data = window.dashboardState.readings;
        this.render();
    }

    updateTimeRange(range) {
        this.timeRange = range;
        // Implement time range filtering
        this.render();
    }
}

// Export for other modules
window.setupCharts = setupCharts;

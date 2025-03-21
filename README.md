# PLTS Monitoring Dashboard - Local Testing

## Setup Instructions

1. Make sure you have Python installed on your system (Python 3.6 or higher)

2. Open a terminal/command prompt in this directory

3. Start the local server by running:
   ```bash
   python start_local_server.py
   ```

4. Open your web browser and navigate to:
   ```
   http://localhost:8000
   ```

## What to Expect

- The dashboard will start in development mode with simulated data
- You'll see power values fluctuate based on time of day (simulated solar pattern)
- Weather data will be randomly generated
- All features will be functional:
  - Real-time power monitoring
  - System health indicators
  - Weather predictions
  - Economic impact calculations
  - Notifications system

## Testing Different Features

1. Chart Interactions:
   - Hover over the power chart to see detailed values
   - Use the time range buttons (24h, Week, Month) to change the view
   - Watch real-time updates every 5 seconds

2. System Health:
   - Watch the efficiency meter update
   - System health indicators will reflect current status
   - Status badge will show online/offline state

3. Weather Integration:
   - Weather data updates every 30 minutes
   - Performance predictions based on weather conditions
   - Weather-based notifications for significant changes

4. Notifications:
   - Click the bell icon to see notifications
   - System will generate alerts for:
     - Unusual power values
     - Low efficiency
     - Weather impacts
     - System status changes

5. Economic Impact:
   - Watch daily savings accumulate
   - ROI calculations update based on energy production
   - Environmental impact metrics

6. Theme Testing:
   - System supports multiple themes:
     - Light (default)
     - Dark
     - High Contrast
     - Ocean
     - Forest

## Troubleshooting

If you encounter any issues:

1. Browser Console:
   - Open browser developer tools (F12)
   - Check console for any error messages

2. Common Issues:
   - If chart doesn't load: Refresh the page
   - If data stops updating: Check if Python server is still running
   - If notifications don't work: Check browser permissions

3. Data Simulation:
   - Power values simulate a daily solar pattern
   - Higher values during midday (6:00 - 18:00)
   - Lower/zero values during night hours
   - Random variations to simulate cloud cover and other factors

## Notes

- This is a development/testing setup using simulated data
- Real deployment would require:
  - Proper MQTT broker setup
  - Configured Wemos device
  - Weather API key
  - Domain and hosting setup

For any questions or issues, please refer to the documentation or contact support.
#   p l t s - m o n i t o r i n g  
 
#include <ESP8266WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// MQTT Broker Configuration
const char* mqttServer = "broker.hivemq.com";
const int mqttPort = 8884;
const char* mqttTopic = "plts/data";

// Sensor pins
const int VOLTAGE_PIN = A0;    // Voltage sensor on A0
const int CURRENT_PIN = D1;    // Current sensor on D1

// Calibration values
const float VOLTAGE_FACTOR = 0.0048828125;  // 5V/1024 for 10-bit ADC
const float CURRENT_FACTOR = 0.1;           // Adjust based on your sensor
const float SYSTEM_VOLTAGE = 220.0;         // System voltage

// Sample interval
const long INTERVAL = 5000;  // Send data every 5 seconds
unsigned long lastSendTime = 0;

WebSocketsClient webSocket;

void setup() {
    Serial.begin(115200);
    pinMode(VOLTAGE_PIN, INPUT);
    pinMode(CURRENT_PIN, INPUT);
    
    // Connect to WiFi
    WiFi.begin(ssid, password);
    Serial.print("Connecting to WiFi");
    
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    
    Serial.println("\nConnected to WiFi");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());

    // Initialize WebSocket connection
    setupWebSocket();
}

void setupWebSocket() {
    // Connect to WebSocket server
    webSocket.begin("your-domain.com", 81, "/");
    
    // Event handlers
    webSocket.onEvent(webSocketEvent);
    
    // Try every 5000ms if connection has failed
    webSocket.setReconnectInterval(5000);
    
    // Heartbeat interval for ping/pong
    webSocket.enableHeartbeat(15000, 3000, 2);
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
    switch(type) {
        case WStype_DISCONNECTED:
            Serial.println("[WebSocket] Disconnected!");
            break;
        case WStype_CONNECTED:
            Serial.println("[WebSocket] Connected!");
            break;
        case WStype_TEXT:
            // Handle incoming messages if needed
            break;
        case WStype_ERROR:
            Serial.println("[WebSocket] Error!");
            break;
    }
}

float readVoltage() {
    // Read raw value
    int rawValue = analogRead(VOLTAGE_PIN);
    
    // Convert to actual voltage
    float voltage = rawValue * VOLTAGE_FACTOR * 100; // Adjust multiplier based on voltage divider
    
    return voltage;
}

float readCurrent() {
    // Read raw value
    int rawValue = analogRead(CURRENT_PIN);
    
    // Convert to actual current
    float current = rawValue * CURRENT_FACTOR;
    
    return current;
}

float calculatePower(float voltage, float current) {
    return (voltage * current) / 1000.0; // Convert to kW
}

void sendData() {
    // Read sensor values
    float voltage = readVoltage();
    float current = readCurrent();
    float power = calculatePower(voltage, current);
    
    // Create JSON document
    StaticJsonDocument<200> doc;
    doc["power"] = power;
    doc["voltage"] = voltage;
    doc["current"] = current;
    doc["frequency"] = 50.0; // Assuming constant frequency
    doc["efficiency"] = 92.0; // Example efficiency value
    
    // Serialize JSON to string
    String jsonString;
    serializeJson(doc, jsonString);
    
    // Send data through WebSocket
    webSocket.sendTXT(jsonString);
    
    // Debug output
    Serial.println(jsonString);
}

void loop() {
    webSocket.loop();
    
    // Send data every INTERVAL milliseconds
    unsigned long currentTime = millis();
    if (currentTime - lastSendTime >= INTERVAL) {
        if (WiFi.status() == WL_CONNECTED) {
            sendData();
            lastSendTime = currentTime;
        }
    }
}

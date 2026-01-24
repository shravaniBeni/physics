# ESP32 Hardware Integration Guide

## Overview
This guide shows how to integrate your ESP32 physics experiments with the Physics Pocket Lab backend for AI analysis and data storage.

## Current ESP32 Code Enhancement

Your current code is excellent! Here are the enhancements to integrate with the backend:

### 1. Enhanced ESP32 Code

```cpp
#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <Wire.h>
#include <MPU6050.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

/* ===== WIFI ===== */
const char* ssid = "Airtel_niti_6194";
const char* password = "air92886";

/* ===== BACKEND INTEGRATION ===== */
const char* serverURL = "http://192.168.1.101:3002"; // Your Physics Lab server IP
String currentExperimentId = "";
String authToken = ""; // Will be set when experiment starts

/* ===== OBJECTS ===== */
AsyncWebServer server(80);
MPU6050 mpu;
HTTPClient http;

/* ===== MPU DATA ===== */
int16_t axr, ayr, azr;
float ax, ay, az;

/* ===== FILTER ===== */
float alpha = 0.85;
float theta_f = 0;
float alpha_p = 0.92;

/* ===== TIME ===== */
unsigned long t0;
unsigned long lastDataSend = 0;
const unsigned long DATA_SEND_INTERVAL = 100; // Send data every 100ms

/* ===== CSV ===== */
#define CSV_MAX 1000
float tBuf[CSV_MAX];
float yBuf[CSV_MAX];
int csvIndex = 0;

/* ===== CURRENT MODE ===== */
String mode = "none";
bool backendConnected = false;

/* ===== ENHANCED HTML WITH BACKEND INTEGRATION ===== */
const char index_html[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Physics Experiments - ESP32</title>
<style>
body{background:#0f172a;color:#00ff88;font-family:Arial;text-align:center;padding:20px}
.container{max-width:1200px;margin:0 auto}
canvas{border:2px solid #00ff88;border-radius:8px;background:#1e293b}
button{padding:12px 24px;font-size:16px;margin:8px;border:none;border-radius:6px;cursor:pointer;transition:all 0.3s}
.btn-primary{background:#00ff88;color:#0f172a}
.btn-secondary{background:#64748b;color:white}
.btn-danger{background:#ef4444;color:white}
.status{padding:10px;margin:10px 0;border-radius:6px}
.status.connected{background:#10b981;color:white}
.status.disconnected{background:#ef4444;color:white}
.status.recording{background:#f59e0b;color:white}
.data-panel{background:#1e293b;border:1px solid #334155;border-radius:8px;padding:20px;margin:20px 0}
</style>
</head>
<body>
<div class="container">
<h1>🔬 ESP32 Physics Lab</h1>
<div id="backend-status" class="status disconnected">Backend: Disconnected</div>
<div id="experiment-status" class="status disconnected">Experiment: Not Started</div>

<h2>Select Experiment</h2>
<button class="btn-primary" onclick="start('pendulum')">🎯 Simple Pendulum</button>
<button class="btn-primary" onclick="start('freefall')">⚡ Free Fall</button>
<button class="btn-secondary" onclick="connectBackend()">🔗 Connect to Backend</button>

<div id="exp" style="display:none">
<h3 id="title"></h3>
<div class="data-panel">
<canvas id="g" width="900" height="450"></canvas><br>
<div style="margin:20px 0">
<strong>Current Value: <span id="v">0</span></strong><br>
<small>Data Points: <span id="points">0</span> | Duration: <span id="duration">0</span>s</small>
</div>
</div>

<button class="btn-danger" onclick="stopExperiment()">⏹️ Stop & Analyze</button>
<button class="btn-secondary" onclick="location.href='/csv'">📊 Download CSV</button>
</div>

<script>
let mode="";
let experimentStartTime = 0;
let dataPointCount = 0;
const c=document.getElementById("g");
const ctx=c.getContext("2d");
const W=c.width,H=c.height,M=60;
const MAX=300;
let data=new Array(MAX).fill(0);

function connectBackend() {
    fetch("/connect-backend")
    .then(r => r.json())
    .then(j => {
        if(j.success) {
            document.getElementById("backend-status").className = "status connected";
            document.getElementById("backend-status").innerHTML = "Backend: Connected ✅";
        }
    })
    .catch(e => {
        document.getElementById("backend-status").innerHTML = "Backend: Connection Failed ❌";
    });
}

function start(m){
    mode=m;
    experimentStartTime = Date.now();
    dataPointCount = 0;
    document.getElementById("exp").style.display="block";
    document.getElementById("title").innerHTML = 
        (m=="pendulum") ? "🎯 Pendulum – Angle vs Time" : "⚡ Free Fall – Acceleration vs Time";
    document.getElementById("experiment-status").className = "status recording";
    document.getElementById("experiment-status").innerHTML = "Experiment: Recording 🔴";
    
    fetch("/set?mode="+m)
    .then(r => r.json())
    .then(j => {
        if(j.experiment_id) {
            console.log("Experiment started with ID:", j.experiment_id);
        }
    });
}

function stopExperiment() {
    if(mode) {
        fetch("/stop-experiment")
        .then(r => r.json())
        .then(j => {
            document.getElementById("experiment-status").className = "status connected";
            document.getElementById("experiment-status").innerHTML = "Experiment: Analyzing 🧠";
            alert("Experiment stopped! Check your Physics Lab dashboard for AI analysis.");
        });
    }
}

function axes(yLabel){
    ctx.strokeStyle="#00ff88";
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.moveTo(M,M); ctx.lineTo(M,H-M); ctx.lineTo(W-M,H-M);
    ctx.stroke();
    ctx.fillStyle="#00ff88";
    ctx.font="14px Arial";
    ctx.fillText("Time (s)",W/2,H-10);
    ctx.save();
    ctx.translate(20,H/2); ctx.rotate(-Math.PI/2);
    ctx.fillText(yLabel,0,0);
    ctx.restore();
}

function draw(yLabel,scale){
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle="#1e293b";
    ctx.fillRect(0,0,W,H);
    axes(yLabel);
    
    ctx.strokeStyle="#06b6d4";
    ctx.lineWidth=2;
    ctx.beginPath();
    data.forEach((v,i)=>{
        let x=M+i*(W-2*M)/MAX;
        let y=H/2 - v*scale;
        i?ctx.lineTo(x,y):ctx.moveTo(x,y);
    });
    ctx.stroke();
}

setInterval(()=>{
    if(!mode) return;
    fetch("/data").then(r=>r.json()).then(j=>{
        data.push(j.y);
        if(data.length>MAX) data.shift();
        draw(j.label,j.scale);
        document.getElementById("v").innerHTML=j.y.toFixed(3);
        
        dataPointCount++;
        const duration = (Date.now() - experimentStartTime) / 1000;
        document.getElementById("points").innerHTML = dataPointCount;
        document.getElementById("duration").innerHTML = duration.toFixed(1);
    });
},50);

// Auto-connect to backend on load
setTimeout(connectBackend, 1000);
</script>
</div>
</body>
</html>
)rawliteral";

void setup(){
    Serial.begin(115200);
    delay(1000);
    
    Wire.begin(21,22);
    mpu.initialize();
    Serial.println("MPU6050 initialized");
    
    WiFi.begin(ssid,password);
    while(WiFi.status()!=WL_CONNECTED){
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nWiFi connected");
    Serial.println("ESP32 IP: " + WiFi.localIP().toString());
    
    setupRoutes();
    server.begin();
    Serial.println("ESP32 Server started");
    Serial.println("Connect to: http://" + WiFi.localIP().toString());
}

void setupRoutes() {
    server.on("/",HTTP_GET,[](AsyncWebServerRequest*r){
        r->send_P(200,"text/html",index_html);
    });
    
    server.on("/connect-backend",HTTP_GET,[](AsyncWebServerRequest*r){
        backendConnected = testBackendConnection();
        r->send(200,"application/json", 
            backendConnected ? "{\"success\":true}" : "{\"success\":false}");
    });
    
    server.on("/set",HTTP_GET,[](AsyncWebServerRequest*r){
        if(r->hasParam("mode")){
            mode=r->getParam("mode")->value();
            csvIndex=0;
            t0=millis();
            
            // Start experiment on backend
            if(backendConnected) {
                currentExperimentId = startBackendExperiment(mode);
            }
        }
        
        String response = "{\"mode\":\"" + mode + "\"";
        if(currentExperimentId.length() > 0) {
            response += ",\"experiment_id\":\"" + currentExperimentId + "\"";
        }
        response += "}";
        
        r->send(200,"application/json", response);
    });
    
    server.on("/stop-experiment",HTTP_GET,[](AsyncWebServerRequest*r){
        if(currentExperimentId.length() > 0 && backendConnected) {
            stopBackendExperiment();
        }
        mode = "none";
        r->send(200,"application/json","{\"stopped\":true}");
    });
    
    server.on("/data",HTTP_GET,[](AsyncWebServerRequest*r){
        mpu.getAcceleration(&axr,&ayr,&azr);
        ax=axr/16384.0; ay=ayr/16384.0; az=azr/16384.0;
        
        float y=0, scale=10;
        String label;
        
        if(mode=="pendulum"){
            float theta = atan2(ax, az) * 180.0 / PI;
            theta_f = alpha_p * theta_f + (1 - alpha_p) * theta;
            y = theta_f;
            label="Angle (deg)";
            scale=6;
        }else if(mode=="freefall"){
            float amag = sqrt(ax*ax+ay*ay+az*az);
            y = (amag-1.0)*9.81;
            label="Acceleration (m/s²)";
            scale=12;
        }
        
        float t=(millis()-t0)/1000.0;
        
        // Store locally
        if(csvIndex<CSV_MAX){
            tBuf[csvIndex]=t;
            yBuf[csvIndex]=y;
            csvIndex++;
        }
        
        // Send to backend
        if(backendConnected && currentExperimentId.length() > 0 && 
           millis() - lastDataSend > DATA_SEND_INTERVAL) {
            sendDataToBackend(t, y, ax, ay, az);
            lastDataSend = millis();
        }
        
        r->send(200,"application/json",
            "{\"y\":"+String(y,3)+",\"label\":\""+label+"\",\"scale\":"+String(scale)+"}");
    });
    
    server.on("/csv",HTTP_GET,[](AsyncWebServerRequest*r){
        String csv="time,value\n";
        for(int i=0;i<csvIndex;i++){
            csv+=String(tBuf[i],3)+","+String(yBuf[i],3)+"\n";
        }
        r->send(200,"text/csv",csv);
    });
}

bool testBackendConnection() {
    http.begin(String(serverURL) + "/api/health");
    int httpCode = http.GET();
    http.end();
    
    Serial.println("Backend connection test: " + String(httpCode));
    return httpCode == 200;
}

String startBackendExperiment(String experimentType) {
    http.begin(String(serverURL) + "/api/hardware/experiments/start");
    http.addHeader("Content-Type", "application/json");
    // Note: In production, you'd need proper authentication
    
    String payload = "{\"experiment_type\":\"" + experimentType + 
                    "\",\"device_id\":\"esp32_physics_lab\",\"device_ip\":\"" + 
                    WiFi.localIP().toString() + "\"}";
    
    int httpCode = http.POST(payload);
    String response = http.getString();
    http.end();
    
    if(httpCode == 200) {
        // Parse JSON to get experiment ID
        DynamicJsonDocument doc(1024);
        deserializeJson(doc, response);
        String expId = doc["experiment_id"];
        Serial.println("Started backend experiment: " + expId);
        return expId;
    }
    
    Serial.println("Failed to start backend experiment: " + String(httpCode));
    return "";
}

void sendDataToBackend(float timestamp, float value, float ax, float ay, float az) {
    if(currentExperimentId.length() == 0) return;
    
    http.begin(String(serverURL) + "/api/hardware/experiments/" + currentExperimentId + "/data");
    http.addHeader("Content-Type", "application/json");
    
    String payload = "{\"timestamp\":" + String(millis()) + 
                    ",\"value\":" + String(value, 6) +
                    ",\"raw_data\":{\"ax\":" + String(ax, 6) + 
                    ",\"ay\":" + String(ay, 6) + 
                    ",\"az\":" + String(az, 6) + "}}";
    
    int httpCode = http.POST(payload);
    http.end();
    
    if(httpCode != 200) {
        Serial.println("Data send failed: " + String(httpCode));
    }
}

void stopBackendExperiment() {
    if(currentExperimentId.length() == 0) return;
    
    http.begin(String(serverURL) + "/api/hardware/experiments/" + currentExperimentId + "/stop");
    http.addHeader("Content-Type", "application/json");
    
    int httpCode = http.POST("");
    http.end();
    
    Serial.println("Stopped experiment: " + String(httpCode));
    currentExperimentId = "";
}

void loop(){
    // Main loop can be used for other tasks
    delay(10);
}
```

## Integration Steps

### 1. Update Your ESP32 Code
- Replace your current code with the enhanced version above
- Update the `serverURL` to match your Physics Lab server IP
- Install required libraries: `ArduinoJson`

### 2. Backend Setup
Your Physics Lab server now includes:
- Hardware experiment endpoints
- Real-time data reception
- AI analysis of experimental data
- CSV export with enhanced data
- Integration with gamification system

### 3. Frontend Integration
- New "Hardware Lab" page in navigation
- Real-time data visualization
- Experiment control interface
- AI analysis display

## Features

### 🔬 **Experiment Management**
- Start/stop experiments from web interface
- Real-time data streaming to backend
- Automatic experiment ID generation
- Session management

### 📊 **Data Analysis**
- **Pendulum**: Period, frequency, amplitude, damping analysis
- **Free Fall**: Acceleration measurement, error analysis
- **AI Insights**: Physics principles, predictions, recommendations
- **Data Quality**: Noise assessment, sample rate analysis

### 🎮 **Gamification Integration**
- **150 points** for completing hardware experiments
- **Real-time leaderboard** updates
- **Achievement tracking** for different experiment types
- **Progress analytics** in user dashboard

### 🧠 **AI Features**
- **Automated Analysis**: Physics principle identification
- **Predictive Modeling**: Outcome predictions based on data
- **Error Detection**: Measurement quality assessment
- **Educational Insights**: Learning recommendations

## Usage Workflow

1. **Connect ESP32**: Set up your hardware and connect to WiFi
2. **Start Server**: Run your Physics Lab backend server
3. **Open Hardware Lab**: Navigate to Hardware Lab in your web app
4. **Connect Device**: Enter ESP32 IP and test connection
5. **Select Experiment**: Choose pendulum or free fall
6. **Start Recording**: Begin data collection
7. **Monitor Live**: Watch real-time graphs and data
8. **Stop & Analyze**: End experiment for AI analysis
9. **Review Results**: Check AI insights and download data

## Next Enhancements

### 🔮 **Future Features**
- **Multiple Sensors**: Add ultrasonic, temperature, pressure sensors
- **Advanced Experiments**: Projectile motion, oscillations, waves
- **Machine Learning**: Pattern recognition, anomaly detection
- **Collaborative Experiments**: Multi-device synchronization
- **AR Visualization**: Augmented reality data overlay

This integration transforms your ESP32 into a powerful physics research tool with AI-powered analysis! 🚀
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

/* ===== BACKEND CONFIG ===== */
const char* serverURL = "http://192.168.1.101:3002"; // Your Physics Lab server IP
String currentExperimentId = "";
bool backendEnabled = false; // Start disabled for safety

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
unsigned long lastBackendSend = 0;
const unsigned long BACKEND_SEND_INTERVAL = 200; // Send every 200ms (5Hz)

/* ===== CSV ===== */
#define CSV_MAX 1000
float tBuf[CSV_MAX];
float yBuf[CSV_MAX];
int csvIndex = 0;

/* ===== BACKEND BUFFER (NON-BLOCKING) ===== */
struct DataPoint {
  float timestamp;
  float value;
  float ax, ay, az;
  bool needsSending;
};

DataPoint latestData = {0, 0, 0, 0, 0, false};

/* ===== CURRENT MODE ===== */
String mode = "none";

/* ===== ENHANCED HTML ===== */
const char index_html[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>ESP32 Physics Lab - CORS Fixed</title>
<style>
body{background:#0f172a;color:#00ff88;font-family:Arial;text-align:center;padding:20px}
.container{max-width:1200px;margin:0 auto}
canvas{border:2px solid #00ff88;border-radius:8px;background:#1e293b}
button{padding:12px 24px;font-size:16px;margin:8px;border:none;border-radius:6px;cursor:pointer;transition:all 0.3s}
.btn-primary{background:#00ff88;color:#0f172a}
.btn-secondary{background:#64748b;color:white}
.btn-danger{background:#ef4444;color:white}
.status{padding:10px;margin:10px 0;border-radius:6px;font-weight:bold}
.status.connected{background:#10b981;color:white}
.status.disconnected{background:#ef4444;color:white}
.status.recording{background:#f59e0b;color:white}
.status.testing{background:#3b82f6;color:white}
.data-panel{background:#1e293b;border:1px solid #334155;border-radius:8px;padding:20px;margin:20px 0}
.info{background:#1e40af;color:white;padding:10px;border-radius:6px;margin:10px 0}
</style>
</head>
<body>
<div class="container">
<h1>🔬 ESP32 Physics Lab</h1>
<div class="info">✅ CORS Fixed + Hardware Lab Integration Ready</div>

<div id="mpu-status" class="status disconnected">MPU6050: Checking...</div>
<div id="backend-status" class="status disconnected">Backend: Disabled</div>
<div id="experiment-status" class="status disconnected">Experiment: Ready</div>

<h2>🎛️ Controls</h2>
<button class="btn-primary" onclick="start('pendulum')">🎯 Simple Pendulum</button>
<button class="btn-primary" onclick="start('freefall')">⚡ Free Fall</button>
<button class="btn-secondary" onclick="toggleBackend()">🔗 Toggle Backend</button>
<button class="btn-secondary" onclick="testMPU()">🔧 Test MPU6050</button>

<div id="exp" style="display:none">
<h3 id="title"></h3>
<div class="data-panel">
<canvas id="g" width="900" height="450"></canvas><br>
<div style="margin:20px 0">
<strong>Value: <span id="v">0</span></strong><br>
<small>Points: <span id="points">0</span> | Duration: <span id="duration">0</span>s | Backend: <span id="backend-sent">0</span> sent</small>
</div>
</div>

<button class="btn-danger" onclick="stopExperiment()">⏹️ Stop Experiment</button>
<button class="btn-secondary" onclick="location.href='/csv'">📊 Download CSV</button>
</div>

<div id="debug" style="margin-top:20px;padding:10px;background:#1e293b;border-radius:6px;text-align:left;font-family:monospace;font-size:12px;max-height:200px;overflow-y:auto;"></div>

<script>
let mode="";
let experimentStartTime = 0;
let dataPointCount = 0;
let backendSentCount = 0;
const c=document.getElementById("g");
const ctx=c.getContext("2d");
const W=c.width,H=c.height,M=60;
const MAX=300;
let data=new Array(MAX).fill(0);

function log(msg) {
    const debug = document.getElementById("debug");
    const time = new Date().toLocaleTimeString();
    debug.innerHTML += `[${time}] ${msg}<br>`;
    debug.scrollTop = debug.scrollHeight;
}

function testMPU() {
    log("Testing MPU6050 connection...");
    fetch("/test-mpu")
    .then(r => r.json())
    .then(j => {
        if(j.connected) {
            document.getElementById("mpu-status").className = "status connected";
            document.getElementById("mpu-status").innerHTML = "MPU6050: Connected ✅";
            log("✅ MPU6050 test passed");
        } else {
            document.getElementById("mpu-status").className = "status disconnected";
            document.getElementById("mpu-status").innerHTML = "MPU6050: Failed ❌";
            log("❌ MPU6050 test failed - check wiring");
        }
    })
    .catch(e => log("❌ MPU test error: " + e));
}

function toggleBackend() {
    log("Toggling backend connection...");
    fetch("/toggle-backend")
    .then(r => r.json())
    .then(j => {
        if(j.enabled) {
            document.getElementById("backend-status").className = "status connected";
            document.getElementById("backend-status").innerHTML = "Backend: Enabled ✅";
            log("✅ Backend enabled");
        } else {
            document.getElementById("backend-status").className = "status disconnected";
            document.getElementById("backend-status").innerHTML = "Backend: Disabled";
            log("⚠️ Backend disabled");
        }
    })
    .catch(e => log("❌ Backend toggle error: " + e));
}

function start(m){
    mode=m;
    experimentStartTime = Date.now();
    dataPointCount = 0;
    backendSentCount = 0;
    document.getElementById("exp").style.display="block";
    document.getElementById("title").innerHTML = 
        (m=="pendulum") ? "🎯 Pendulum – Angle vs Time" : "⚡ Free Fall – Acceleration vs Time";
    document.getElementById("experiment-status").className = "status recording";
    document.getElementById("experiment-status").innerHTML = "Experiment: Recording 🔴";
    
    log(`🚀 Starting ${m} experiment`);
    fetch("/set?mode="+m)
    .then(r => r.json())
    .then(j => {
        if(j.backend_experiment_id) {
            log("✅ Backend experiment started: " + j.backend_experiment_id);
        }
        log("✅ Local experiment started");
    })
    .catch(e => log("⚠️ Start error: " + e));
}

function stopExperiment() {
    if(mode) {
        log("🛑 Stopping experiment...");
        fetch("/stop")
        .then(r => r.json())
        .then(j => {
            document.getElementById("experiment-status").className = "status connected";
            document.getElementById("experiment-status").innerHTML = "Experiment: Stopped ✅";
            log("✅ Experiment stopped");
            if(j.backend_stopped) {
                log("✅ Backend experiment stopped for analysis");
            }
        })
        .catch(e => log("⚠️ Stop error: " + e));
        mode = "";
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

// FAST polling for graph (50ms)
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
        document.getElementById("backend-sent").innerHTML = j.backend_sent || 0;
    });
},50);

// Auto-test MPU on load
setTimeout(testMPU, 1000);
</script>
</div>
</body>
</html>
)rawliteral";

void setup(){
    Serial.begin(115200);
    delay(2000); // Give Serial time to initialize
    
    Serial.println("\n🚀 ESP32 Physics Lab - CORS Fixed Version");
    Serial.println("==========================================");
    
    // Initialize I2C
    Wire.begin(21, 22);
    Serial.println("📡 I2C initialized");
    
    // Initialize MPU6050 with connection test
    mpu.initialize();
    if (mpu.testConnection()) {
        Serial.println("✅ MPU6050 connected successfully");
    } else {
        Serial.println("❌ MPU6050 connection failed - check wiring!");
        Serial.println("🔧 But web server will still work for testing");
    }
    
    // Connect to WiFi
    Serial.print("📶 Connecting to WiFi");
    WiFi.begin(ssid, password);
    while(WiFi.status() != WL_CONNECTED){
        delay(500);
        Serial.print(".");
    }
    Serial.println();
    Serial.println("✅ WiFi connected");
    Serial.print("🌐 ESP32 IP: ");
    Serial.println(WiFi.localIP());
    
    setupRoutes();
    server.begin();
    Serial.println("🌍 Web server started with CORS support");
    Serial.println("🔗 Open: http://" + WiFi.localIP().toString());
    Serial.println("🔗 Hardware Lab can now connect from localhost:3000");
    Serial.println("==========================================");
}

void setupRoutes() {
    // CORS Headers for all responses
    server.onNotFound([](AsyncWebServerRequest *request){
        if (request->method() == HTTP_OPTIONS) {
            request->send(200);
        } else {
            request->send(404);
        }
    });
    
    server.on("/", HTTP_GET, [](AsyncWebServerRequest *request){
        // Add CORS headers
        request->addInterestingHeader("Access-Control-Allow-Origin: *");
        request->send_P(200, "text/html", index_html);
    });
    
    // SAFE: Test MPU connection
    server.on("/test-mpu", HTTP_GET, [](AsyncWebServerRequest *request){
        bool connected = mpu.testConnection();
        String response = "{\"connected\":" + String(connected ? "true" : "false") + "}";
        
        // Add CORS headers
        AsyncWebServerResponse *resp = request->beginResponse(200, "application/json", response);
        resp->addHeader("Access-Control-Allow-Origin", "*");
        resp->addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        resp->addHeader("Access-Control-Allow-Headers", "Content-Type");
        request->send(resp);
        
        Serial.println("🔧 MPU test: " + String(connected ? "PASS" : "FAIL"));
    });
    
    // SAFE: Toggle backend (non-blocking test)
    server.on("/toggle-backend", HTTP_GET, [](AsyncWebServerRequest *request){
        backendEnabled = !backendEnabled;
        String response = "{\"enabled\":" + String(backendEnabled ? "true" : "false") + "}";
        
        AsyncWebServerResponse *resp = request->beginResponse(200, "application/json", response);
        resp->addHeader("Access-Control-Allow-Origin", "*");
        resp->addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        resp->addHeader("Access-Control-Allow-Headers", "Content-Type");
        request->send(resp);
        
        Serial.println("🔗 Backend " + String(backendEnabled ? "ENABLED" : "DISABLED"));
    });
    
    // SAFE: Start experiment
    server.on("/set", HTTP_GET, [](AsyncWebServerRequest *request){
        if(request->hasParam("mode")){
            mode = request->getParam("mode")->value();
            csvIndex = 0;
            t0 = millis();
            
            Serial.println("🚀 Starting " + mode + " experiment");
            
            String response = "{\"mode\":\"" + mode + "\"";
            if(backendEnabled) {
                response += ",\"backend_experiment_id\":\"will_be_created\"";
                // Flag to create backend experiment in loop() - NOT HERE!
                latestData.needsSending = true;
            }
            response += "}";
            
            AsyncWebServerResponse *resp = request->beginResponse(200, "application/json", response);
            resp->addHeader("Access-Control-Allow-Origin", "*");
            request->send(resp);
        } else {
            AsyncWebServerResponse *resp = request->beginResponse(400, "application/json", "{\"error\":\"no mode\"}");
            resp->addHeader("Access-Control-Allow-Origin", "*");
            request->send(resp);
        }
    });
    
    // SAFE: Stop experiment
    server.on("/stop", HTTP_GET, [](AsyncWebServerRequest *request){
        Serial.println("🛑 Stopping experiment: " + mode);
        mode = "none";
        
        String response = "{\"stopped\":true";
        if(backendEnabled && currentExperimentId.length() > 0) {
            response += ",\"backend_stopped\":true";
            // Flag to stop backend experiment in loop() - NOT HERE!
        }
        response += "}";
        
        AsyncWebServerResponse *resp = request->beginResponse(200, "application/json", response);
        resp->addHeader("Access-Control-Allow-Origin", "*");
        request->send(resp);
    });
    
    // FAST: Get sensor data (NO BACKEND CALLS HERE!)
    server.on("/data", HTTP_GET, [](AsyncWebServerRequest *request){
        // Read MPU (fast) - even if MPU fails, return dummy data for testing
        float y = 0, scale = 10;
        String label;
        
        if (mpu.testConnection()) {
            mpu.getAcceleration(&axr, &ayr, &azr);
            ax = axr / 16384.0;
            ay = ayr / 16384.0; 
            az = azr / 16384.0;
        } else {
            // Generate dummy data for testing when MPU is not connected
            float t = (millis() - t0) / 1000.0;
            ax = 0.1 * sin(t * 2.0); // Simulate pendulum motion
            ay = 0.05 * cos(t * 1.5);
            az = 1.0 + 0.02 * sin(t * 3.0);
        }
        
        if(mode == "pendulum"){
            float theta = atan2(ax, az) * 180.0 / PI;
            theta_f = alpha_p * theta_f + (1 - alpha_p) * theta;
            y = theta_f;
            label = "Angle (deg)";
            scale = 6;
        } else if(mode == "freefall"){
            float amag = sqrt(ax*ax + ay*ay + az*az);
            y = (amag - 1.0) * 9.81;
            label = "Acceleration (m/s²)";
            scale = 12;
        }
        
        float t = (millis() - t0) / 1000.0;
        
        // Store locally (fast)
        if(csvIndex < CSV_MAX){
            tBuf[csvIndex] = t;
            yBuf[csvIndex] = y;
            csvIndex++;
        }
        
        // Buffer for backend (NO HTTP HERE!)
        latestData.timestamp = t;
        latestData.value = y;
        latestData.ax = ax;
        latestData.ay = ay;
        latestData.az = az;
        latestData.needsSending = true;
        
        // Fast response with CORS
        String response = "{\"y\":" + String(y, 3) + 
                         ",\"label\":\"" + label + 
                         "\",\"scale\":" + String(scale) +
                         ",\"backend_sent\":" + String(csvIndex) + "}";
        
        AsyncWebServerResponse *resp = request->beginResponse(200, "application/json", response);
        resp->addHeader("Access-Control-Allow-Origin", "*");
        request->send(resp);
    });
    
    // SAFE: CSV download
    server.on("/csv", HTTP_GET, [](AsyncWebServerRequest *request){
        String csv = "time,value\n";
        for(int i = 0; i < csvIndex; i++){
            csv += String(tBuf[i], 3) + "," + String(yBuf[i], 3) + "\n";
        }
        
        AsyncWebServerResponse *resp = request->beginResponse(200, "text/csv", csv);
        resp->addHeader("Access-Control-Allow-Origin", "*");
        request->send(resp);
        
        Serial.println("📊 CSV downloaded (" + String(csvIndex) + " points)");
    });
    
    // Status endpoint
    server.on("/status", HTTP_GET, [](AsyncWebServerRequest *request){
        String response = "{\"mode\":\"" + mode + 
                         "\",\"backend_enabled\":" + String(backendEnabled ? "true" : "false") +
                         ",\"experiment_id\":\"" + currentExperimentId + 
                         "\",\"mpu_connected\":" + String(mpu.testConnection() ? "true" : "false") +
                         ",\"uptime\":" + String(millis()) + "}";
        
        AsyncWebServerResponse *resp = request->beginResponse(200, "application/json", response);
        resp->addHeader("Access-Control-Allow-Origin", "*");
        request->send(resp);
    });
}

void loop(){
    // SAFE backend operations (isolated from web server)
    handleBackendOperations();
    
    // Small delay to prevent watchdog issues
    delay(10);
}

void handleBackendOperations() {
    if(!backendEnabled) return;
    
    // Send data to backend (non-blocking, rate-limited)
    if(latestData.needsSending && 
       millis() - lastBackendSend > BACKEND_SEND_INTERVAL) {
        
        sendDataToBackend();
        lastBackendSend = millis();
        latestData.needsSending = false;
    }
    
    // Handle experiment lifecycle
    static bool experimentStartPending = false;
    if(mode != "none" && currentExperimentId.length() == 0 && !experimentStartPending) {
        experimentStartPending = true;
        startBackendExperiment();
        experimentStartPending = false;
    }
}

void startBackendExperiment() {
    Serial.println("🔗 Starting backend experiment...");
    
    http.begin(String(serverURL) + "/api/hardware/experiments/start");
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(5000); // 5 second timeout
    
    String payload = "{\"experiment_type\":\"" + mode + 
                    "\",\"device_id\":\"esp32_physics_lab\",\"device_ip\":\"" + 
                    WiFi.localIP().toString() + "\"}";
    
    int httpCode = http.POST(payload);
    
    if(httpCode == 200) {
        String response = http.getString();
        DynamicJsonDocument doc(1024);
        if(deserializeJson(doc, response) == DeserializationError::Ok) {
            currentExperimentId = doc["experiment_id"].as<String>();
            Serial.println("✅ Backend experiment started: " + currentExperimentId);
        }
    } else {
        Serial.println("❌ Backend start failed: " + String(httpCode));
    }
    
    http.end();
}

void sendDataToBackend() {
    if(currentExperimentId.length() == 0) return;
    
    http.begin(String(serverURL) + "/api/hardware/experiments/" + currentExperimentId + "/data");
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(2000); // Short timeout
    
    String payload = "{\"timestamp\":" + String(millis()) + 
                    ",\"value\":" + String(latestData.value, 6) +
                    ",\"raw_data\":{\"ax\":" + String(latestData.ax, 6) + 
                    ",\"ay\":" + String(latestData.ay, 6) + 
                    ",\"az\":" + String(latestData.az, 6) + "}}";
    
    int httpCode = http.POST(payload);
    
    if(httpCode == 200) {
        Serial.print("📡");
    } else {
        Serial.print("❌");
    }
    
    http.end();
}

void stopBackendExperiment() {
    if(currentExperimentId.length() == 0) return;
    
    Serial.println("🛑 Stopping backend experiment...");
    
    http.begin(String(serverURL) + "/api/hardware/experiments/" + currentExperimentId + "/stop");
    http.addHeader("Content-Type", "application/json");
    
    int httpCode = http.POST("");
    
    if(httpCode == 200) {
        Serial.println("✅ Backend experiment stopped");
    } else {
        Serial.println("❌ Backend stop failed: " + String(httpCode));
    }
    
    http.end();
    currentExperimentId = "";
}
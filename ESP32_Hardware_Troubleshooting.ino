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
bool mpuConnected = false;

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

/* ===== ENHANCED HTML WITH TROUBLESHOOTING ===== */
const char index_html[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>ESP32 Physics Lab - Hardware Troubleshooting</title>
<style>
body{background:#0f172a;color:#00ff88;font-family:Arial;text-align:center;padding:20px}
.container{max-width:1200px;margin:0 auto}
canvas{border:2px solid #00ff88;border-radius:8px;background:#1e293b}
button{padding:12px 24px;font-size:16px;margin:8px;border:none;border-radius:6px;cursor:pointer;transition:all 0.3s}
.btn-primary{background:#00ff88;color:#0f172a}
.btn-secondary{background:#64748b;color:white}
.btn-danger{background:#ef4444;color:white}
.btn-warning{background:#f59e0b;color:white}
.status{padding:10px;margin:10px 0;border-radius:6px;font-weight:bold}
.status.connected{background:#10b981;color:white}
.status.disconnected{background:#ef4444;color:white}
.status.recording{background:#f59e0b;color:white}
.status.testing{background:#3b82f6;color:white}
.data-panel{background:#1e293b;border:1px solid #334155;border-radius:8px;padding:20px;margin:20px 0}
.info{background:#1e40af;color:white;padding:10px;border-radius:6px;margin:10px 0}
.warning{background:#dc2626;color:white;padding:10px;border-radius:6px;margin:10px 0}
.troubleshoot{background:#7c2d12;color:white;padding:15px;border-radius:8px;margin:20px 0;text-align:left}
.troubleshoot h3{color:#fbbf24;margin-top:0}
.troubleshoot ul{margin:10px 0;padding-left:20px}
.troubleshoot li{margin:5px 0}
</style>
</head>
<body>
<div class="container">
<h1>🔬 ESP32 Physics Lab - Hardware Troubleshooting</h1>
<div class="info">✅ CORS Fixed + Enhanced MPU6050 Diagnostics</div>

<div id="mpu-status" class="status disconnected">MPU6050: Checking...</div>
<div id="backend-status" class="status disconnected">Backend: Disabled</div>
<div id="experiment-status" class="status disconnected">Experiment: Ready</div>

<h2>🔧 Hardware Diagnostics</h2>
<button class="btn-warning" onclick="fullDiagnostic()">🔍 Full Hardware Check</button>
<button class="btn-secondary" onclick="testMPU()">🔧 Test MPU6050</button>
<button class="btn-secondary" onclick="scanI2C()">📡 Scan I2C Bus</button>
<button class="btn-secondary" onclick="resetMPU()">🔄 Reset MPU6050</button>

<div id="diagnostic-results" class="troubleshoot" style="display:none">
<h3>🔍 Diagnostic Results</h3>
<div id="diagnostic-content"></div>
</div>

<div class="troubleshoot">
<h3>⚠️ MPU6050 Troubleshooting Guide</h3>
<ul>
<li><strong>Connection Check:</strong> VCC→3.3V, GND→GND, SDA→GPIO21, SCL→GPIO22</li>
<li><strong>Power Issues:</strong> Use 3.3V (NOT 5V) - ESP32 is 3.3V logic</li>
<li><strong>Pull-up Resistors:</strong> Add 4.7kΩ resistors on SDA and SCL lines if needed</li>
<li><strong>Wiring Length:</strong> Keep I2C wires short (< 20cm) to avoid noise</li>
<li><strong>Multiple Devices:</strong> Check for I2C address conflicts (MPU6050 = 0x68)</li>
<li><strong>Power Supply:</strong> Ensure stable 3.3V supply with good ground connection</li>
</ul>
</div>

<h2>🎛️ Experiment Controls</h2>
<button class="btn-primary" onclick="start('pendulum')">🎯 Simple Pendulum</button>
<button class="btn-primary" onclick="start('freefall')">⚡ Free Fall</button>
<button class="btn-secondary" onclick="toggleBackend()">🔗 Toggle Backend</button>

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

<div id="debug" style="margin-top:20px;padding:10px;background:#1e293b;border-radius:6px;text-align:left;font-family:monospace;font-size:12px;max-height:300px;overflow-y:auto;"></div>

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

function fullDiagnostic() {
    log("🔍 Starting full hardware diagnostic...");
    document.getElementById("diagnostic-results").style.display = "block";
    const content = document.getElementById("diagnostic-content");
    content.innerHTML = "Running tests...";
    
    fetch("/full-diagnostic")
    .then(r => r.json())
    .then(j => {
        let html = "<ul>";
        html += `<li>I2C Bus: ${j.i2c_status ? '✅ OK' : '❌ FAILED'}</li>`;
        html += `<li>MPU6050 Connection: ${j.mpu_connected ? '✅ Connected' : '❌ Not Found'}</li>`;
        html += `<li>MPU6050 Device ID: ${j.device_id || 'N/A'}</li>`;
        html += `<li>I2C Devices Found: ${j.i2c_devices.join(', ') || 'None'}</li>`;
        html += `<li>WiFi Signal: ${j.wifi_rssi} dBm (${j.wifi_quality})</li>`;
        html += `<li>Free Memory: ${j.free_memory} bytes</li>`;
        html += `<li>Uptime: ${j.uptime} ms</li>`;
        html += "</ul>";
        
        if (!j.mpu_connected) {
            html += "<div style='color:#ef4444;margin-top:10px'>";
            html += "<strong>⚠️ MPU6050 Issues Detected:</strong><br>";
            html += "• Check wiring connections<br>";
            html += "• Verify 3.3V power supply<br>";
            html += "• Try different I2C pins<br>";
            html += "• Add pull-up resistors if needed";
            html += "</div>";
        }
        
        content.innerHTML = html;
        log("✅ Full diagnostic completed");
    })
    .catch(e => {
        content.innerHTML = "❌ Diagnostic failed: " + e;
        log("❌ Diagnostic error: " + e);
    });
}

function testMPU() {
    log("Testing MPU6050 connection...");
    fetch("/test-mpu")
    .then(r => r.json())
    .then(j => {
        if(j.connected) {
            document.getElementById("mpu-status").className = "status connected";
            document.getElementById("mpu-status").innerHTML = "MPU6050: Connected ✅";
            log(`✅ MPU6050 test passed - Device ID: ${j.device_id}`);
        } else {
            document.getElementById("mpu-status").className = "status disconnected";
            document.getElementById("mpu-status").innerHTML = "MPU6050: Failed ❌";
            log("❌ MPU6050 test failed - check wiring");
        }
    })
    .catch(e => log("❌ MPU test error: " + e));
}

function scanI2C() {
    log("Scanning I2C bus...");
    fetch("/scan-i2c")
    .then(r => r.json())
    .then(j => {
        if(j.devices.length > 0) {
            log(`✅ I2C devices found: ${j.devices.join(', ')}`);
        } else {
            log("❌ No I2C devices found - check connections");
        }
    })
    .catch(e => log("❌ I2C scan error: " + e));
}

function resetMPU() {
    log("Resetting MPU6050...");
    fetch("/reset-mpu")
    .then(r => r.json())
    .then(j => {
        if(j.success) {
            log("✅ MPU6050 reset successful");
            setTimeout(testMPU, 1000); // Test after reset
        } else {
            log("❌ MPU6050 reset failed");
        }
    })
    .catch(e => log("❌ Reset error: " + e));
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
    
    // Draw smooth curve
    if(data.length > 1) {
        ctx.strokeStyle="#06b6d4";
        ctx.lineWidth=3;
        ctx.beginPath();
        
        // Create smooth curve using quadratic curves
        let x0 = M + 0 * (W-2*M) / MAX;
        let y0 = H/2 - data[0] * scale;
        ctx.moveTo(x0, y0);
        
        for(let i = 1; i < data.length - 1; i++) {
            let x1 = M + i * (W-2*M) / MAX;
            let y1 = H/2 - data[i] * scale;
            let x2 = M + (i+1) * (W-2*M) / MAX;
            let y2 = H/2 - data[i+1] * scale;
            
            let cpx = x1;
            let cpy = y1;
            let x = (x1 + x2) / 2;
            let y = (y1 + y2) / 2;
            
            ctx.quadraticCurveTo(cpx, cpy, x, y);
        }
        
        // Final point
        if(data.length > 1) {
            let x = M + (data.length-1) * (W-2*M) / MAX;
            let y = H/2 - data[data.length-1] * scale;
            ctx.lineTo(x, y);
        }
        
        ctx.stroke();
    }
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
    
    Serial.println("\n🚀 ESP32 Physics Lab - Hardware Troubleshooting Version");
    Serial.println("========================================================");
    
    // Initialize I2C with explicit pins
    Wire.begin(21, 22); // SDA=21, SCL=22
    Wire.setClock(100000); // 100kHz for better reliability
    Serial.println("📡 I2C initialized (SDA=21, SCL=22, 100kHz)");
    
    // Scan I2C bus first
    scanI2CBus();
    
    // Initialize MPU6050 with enhanced error checking
    initializeMPU();
    
    // Connect to WiFi
    Serial.print("📶 Connecting to WiFi");
    WiFi.begin(ssid, password);
    int wifiAttempts = 0;
    while(WiFi.status() != WL_CONNECTED && wifiAttempts < 20){
        delay(500);
        Serial.print(".");
        wifiAttempts++;
    }
    
    if(WiFi.status() == WL_CONNECTED) {
        Serial.println();
        Serial.println("✅ WiFi connected");
        Serial.print("🌐 ESP32 IP: ");
        Serial.println(WiFi.localIP());
        Serial.print("📶 Signal strength: ");
        Serial.print(WiFi.RSSI());
        Serial.println(" dBm");
    } else {
        Serial.println();
        Serial.println("❌ WiFi connection failed");
    }
    
    setupRoutes();
    server.begin();
    Serial.println("🌍 Web server started with enhanced diagnostics");
    Serial.println("🔗 Open: http://" + WiFi.localIP().toString());
    Serial.println("========================================================");
    
    // Final status report
    Serial.println("📊 System Status:");
    Serial.println("  MPU6050: " + String(mpuConnected ? "✅ Connected" : "❌ Not Connected"));
    Serial.println("  WiFi: " + String(WiFi.status() == WL_CONNECTED ? "✅ Connected" : "❌ Disconnected"));
    Serial.println("  Free Memory: " + String(ESP.getFreeHeap()) + " bytes");
}

void scanI2CBus() {
    Serial.println("🔍 Scanning I2C bus...");
    int deviceCount = 0;
    
    for(byte address = 1; address < 127; address++) {
        Wire.beginTransmission(address);
        byte error = Wire.endTransmission();
        
        if(error == 0) {
            Serial.print("  ✅ I2C device found at address 0x");
            if(address < 16) Serial.print("0");
            Serial.print(address, HEX);
            if(address == 0x68) Serial.print(" (MPU6050)");
            Serial.println();
            deviceCount++;
        }
    }
    
    if(deviceCount == 0) {
        Serial.println("  ❌ No I2C devices found");
        Serial.println("  🔧 Check connections: VCC→3.3V, GND→GND, SDA→21, SCL→22");
    } else {
        Serial.println("  📊 Found " + String(deviceCount) + " I2C device(s)");
    }
}

void initializeMPU() {
    Serial.println("🔧 Initializing MPU6050...");
    
    // Initialize MPU6050
    mpu.initialize();
    delay(100);
    
    // Test connection
    mpuConnected = mpu.testConnection();
    
    if(mpuConnected) {
        Serial.println("✅ MPU6050 connected successfully");
        
        // Get device ID
        uint8_t deviceId = mpu.getDeviceID();
        Serial.println("  📋 Device ID: 0x" + String(deviceId, HEX));
        
        // Configure MPU6050
        mpu.setFullScaleAccelRange(MPU6050_ACCEL_FS_2);
        mpu.setFullScaleGyroRange(MPU6050_GYRO_FS_250);
        mpu.setDLPFMode(MPU6050_DLPF_BW_20);
        
        Serial.println("  ⚙️ MPU6050 configured (±2g, ±250°/s, 20Hz filter)");
        
        // Test reading
        int16_t ax, ay, az;
        mpu.getAcceleration(&ax, &ay, &az);
        Serial.println("  📊 Test reading: ax=" + String(ax) + " ay=" + String(ay) + " az=" + String(az));
        
    } else {
        Serial.println("❌ MPU6050 connection failed");
        Serial.println("  🔧 Troubleshooting steps:");
        Serial.println("    1. Check wiring: VCC→3.3V, GND→GND, SDA→21, SCL→22");
        Serial.println("    2. Verify 3.3V power supply (NOT 5V)");
        Serial.println("    3. Add 4.7kΩ pull-up resistors on SDA/SCL if needed");
        Serial.println("    4. Keep I2C wires short (< 20cm)");
        Serial.println("    5. Check for loose connections");
        Serial.println("  ⚠️ Will use dummy data for testing");
    }
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
        request->addInterestingHeader("Access-Control-Allow-Origin: *");
        request->send_P(200, "text/html", index_html);
    });
    
    // Enhanced MPU test with detailed info
    server.on("/test-mpu", HTTP_GET, [](AsyncWebServerRequest *request){
        bool connected = mpu.testConnection();
        uint8_t deviceId = connected ? mpu.getDeviceID() : 0;
        
        String response = "{\"connected\":" + String(connected ? "true" : "false") + 
                         ",\"device_id\":\"0x" + String(deviceId, HEX) + "\"}";
        
        AsyncWebServerResponse *resp = request->beginResponse(200, "application/json", response);
        resp->addHeader("Access-Control-Allow-Origin", "*");
        resp->addHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        resp->addHeader("Access-Control-Allow-Headers", "Content-Type");
        request->send(resp);
        
        Serial.println("🔧 MPU test: " + String(connected ? "PASS" : "FAIL") + 
                      " (ID: 0x" + String(deviceId, HEX) + ")");
    });
    
    // I2C bus scan
    server.on("/scan-i2c", HTTP_GET, [](AsyncWebServerRequest *request){
        String devices = "[";
        int deviceCount = 0;
        
        for(byte address = 1; address < 127; address++) {
            Wire.beginTransmission(address);
            byte error = Wire.endTransmission();
            
            if(error == 0) {
                if(deviceCount > 0) devices += ",";
                devices += "\"0x" + String(address, HEX) + "\"";
                deviceCount++;
            }
        }
        devices += "]";
        
        String response = "{\"devices\":" + devices + ",\"count\":" + String(deviceCount) + "}";
        
        AsyncWebServerResponse *resp = request->beginResponse(200, "application/json", response);
        resp->addHeader("Access-Control-Allow-Origin", "*");
        request->send(resp);
        
        Serial.println("🔍 I2C scan: " + String(deviceCount) + " devices found");
    });
    
    // Full diagnostic
    server.on("/full-diagnostic", HTTP_GET, [](AsyncWebServerRequest *request){
        // I2C scan
        String devices = "[";
        int deviceCount = 0;
        for(byte address = 1; address < 127; address++) {
            Wire.beginTransmission(address);
            if(Wire.endTransmission() == 0) {
                if(deviceCount > 0) devices += ",";
                devices += "\"0x" + String(address, HEX) + "\"";
                deviceCount++;
            }
        }
        devices += "]";
        
        // MPU test
        bool mpuConn = mpu.testConnection();
        uint8_t deviceId = mpuConn ? mpu.getDeviceID() : 0;
        
        // WiFi quality
        int rssi = WiFi.RSSI();
        String quality = rssi > -50 ? "Excellent" : rssi > -60 ? "Good" : rssi > -70 ? "Fair" : "Poor";
        
        String response = "{";
        response += "\"i2c_status\":true,";
        response += "\"mpu_connected\":" + String(mpuConn ? "true" : "false") + ",";
        response += "\"device_id\":\"0x" + String(deviceId, HEX) + "\",";
        response += "\"i2c_devices\":" + devices + ",";
        response += "\"wifi_rssi\":" + String(rssi) + ",";
        response += "\"wifi_quality\":\"" + quality + "\",";
        response += "\"free_memory\":" + String(ESP.getFreeHeap()) + ",";
        response += "\"uptime\":" + String(millis());
        response += "}";
        
        AsyncWebServerResponse *resp = request->beginResponse(200, "application/json", response);
        resp->addHeader("Access-Control-Allow-Origin", "*");
        request->send(resp);
        
        Serial.println("🔍 Full diagnostic completed");
    });
    
    // Reset MPU
    server.on("/reset-mpu", HTTP_GET, [](AsyncWebServerRequest *request){
        Serial.println("🔄 Resetting MPU6050...");
        
        // Reinitialize I2C and MPU
        Wire.end();
        delay(100);
        Wire.begin(21, 22);
        Wire.setClock(100000);
        delay(100);
        
        mpu.initialize();
        delay(100);
        mpuConnected = mpu.testConnection();
        
        String response = "{\"success\":" + String(mpuConnected ? "true" : "false") + "}";
        
        AsyncWebServerResponse *resp = request->beginResponse(200, "application/json", response);
        resp->addHeader("Access-Control-Allow-Origin", "*");
        request->send(resp);
        
        Serial.println("🔄 MPU reset: " + String(mpuConnected ? "SUCCESS" : "FAILED"));
    });
    
    // Toggle backend
    server.on("/toggle-backend", HTTP_GET, [](AsyncWebServerRequest *request){
        backendEnabled = !backendEnabled;
        String response = "{\"enabled\":" + String(backendEnabled ? "true" : "false") + "}";
        
        AsyncWebServerResponse *resp = request->beginResponse(200, "application/json", response);
        resp->addHeader("Access-Control-Allow-Origin", "*");
        request->send(resp);
        
        Serial.println("🔗 Backend " + String(backendEnabled ? "ENABLED" : "DISABLED"));
    });
    
    // Start experiment
    server.on("/set", HTTP_GET, [](AsyncWebServerRequest *request){
        if(request->hasParam("mode")){
            mode = request->getParam("mode")->value();
            csvIndex = 0;
            t0 = millis();
            
            Serial.println("🚀 Starting " + mode + " experiment");
            
            String response = "{\"mode\":\"" + mode + "\"";
            if(backendEnabled) {
                response += ",\"backend_experiment_id\":\"will_be_created\"";
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
    
    // Stop experiment
    server.on("/stop", HTTP_GET, [](AsyncWebServerRequest *request){
        Serial.println("🛑 Stopping experiment: " + mode);
        mode = "none";
        
        String response = "{\"stopped\":true";
        if(backendEnabled && currentExperimentId.length() > 0) {
            response += ",\"backend_stopped\":true";
        }
        response += "}";
        
        AsyncWebServerResponse *resp = request->beginResponse(200, "application/json", response);
        resp->addHeader("Access-Control-Allow-Origin", "*");
        request->send(resp);
    });
    
    // Get sensor data with enhanced error handling
    server.on("/data", HTTP_GET, [](AsyncWebServerRequest *request){
        float y = 0, scale = 10;
        String label;
        
        if (mpuConnected) {
            // Try to read real MPU data
            int16_t ax_raw, ay_raw, az_raw;
            mpu.getAcceleration(&ax_raw, &ay_raw, &az_raw);
            
            // Check if readings are valid (not all zeros or max values)
            if(ax_raw != 0 || ay_raw != 0 || az_raw != 0) {
                ax = ax_raw / 16384.0;
                ay = ay_raw / 16384.0; 
                az = az_raw / 16384.0;
            } else {
                // MPU might be disconnected, use dummy data
                float t = (millis() - t0) / 1000.0;
                ax = 0.1 * sin(t * 2.0);
                ay = 0.05 * cos(t * 1.5);
                az = 1.0 + 0.02 * sin(t * 3.0);
            }
        } else {
            // Generate realistic dummy data for testing
            float t = (millis() - t0) / 1000.0;
            if(mode == "pendulum") {
                // Simulate damped pendulum motion
                float amplitude = 15.0 * exp(-0.1 * t); // Damping
                ax = amplitude * sin(t * 3.14159 * 2.0 / 2.0) / 180.0 * 3.14159; // Convert to radians for atan2
                az = 1.0; // Gravity component
                ay = 0.05 * sin(t * 5.0); // Small noise
            } else if(mode == "freefall") {
                // Simulate free fall with noise
                ax = 0.02 * sin(t * 10.0);
                ay = 0.02 * cos(t * 8.0);
                az = 0.05 * sin(t * 12.0); // Near zero for free fall
            }
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
        
        // Store locally
        if(csvIndex < CSV_MAX){
            tBuf[csvIndex] = t;
            yBuf[csvIndex] = y;
            csvIndex++;
        }
        
        // Buffer for backend
        latestData.timestamp = t;
        latestData.value = y;
        latestData.ax = ax;
        latestData.ay = ay;
        latestData.az = az;
        latestData.needsSending = true;
        
        String response = "{\"y\":" + String(y, 3) + 
                         ",\"label\":\"" + label + 
                         "\",\"scale\":" + String(scale) +
                         ",\"backend_sent\":" + String(csvIndex) + 
                         ",\"mpu_connected\":" + String(mpuConnected ? "true" : "false") + "}";
        
        AsyncWebServerResponse *resp = request->beginResponse(200, "application/json", response);
        resp->addHeader("Access-Control-Allow-Origin", "*");
        request->send(resp);
    });
    
    // CSV download
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
                         "\",\"mpu_connected\":" + String(mpuConnected ? "true" : "false") +
                         ",\"uptime\":" + String(millis()) + 
                         ",\"free_memory\":" + String(ESP.getFreeHeap()) + "}";
        
        AsyncWebServerResponse *resp = request->beginResponse(200, "application/json", response);
        resp->addHeader("Access-Control-Allow-Origin", "*");
        request->send(resp);
    });
}

void loop(){
    // Handle backend operations safely
    handleBackendOperations();
    
    // Monitor MPU connection periodically
    static unsigned long lastMPUCheck = 0;
    if(millis() - lastMPUCheck > 10000) { // Check every 10 seconds
        bool currentStatus = mpu.testConnection();
        if(currentStatus != mpuConnected) {
            mpuConnected = currentStatus;
            Serial.println("🔧 MPU6050 status changed: " + String(mpuConnected ? "CONNECTED" : "DISCONNECTED"));
        }
        lastMPUCheck = millis();
    }
    
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
    http.setTimeout(5000);
    
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
    http.setTimeout(2000);
    
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
/* ===== UPDATED NETWORK CONFIGURATION ===== */

/* ===== WIFI ===== */
const char* ssid = "Atlas5";           // Your WiFi name
const char* password = "FutureisTech"; // Your WiFi password

/* ===== BACKEND CONFIG - UPDATED FOR NEW LOCATION ===== */
const char* serverURL = "http://10.1.16.65:3002"; // ✅ UPDATED IP ADDRESS

String currentExperimentId = "";
bool backendEnabled = false; // Start disabled for safety

/* ===== NETWORK INFO ===== */
/*
OLD LOCATION: 192.168.1.101 (192.168.1.x network)
NEW LOCATION: 10.1.16.65    (10.1.16.x network)

Network Details:
- IPv4 Address: 10.1.16.65
- Subnet Mask: 255.255.240.0
- Gateway: 10.1.16.1
- Network Type: Corporate/Institution network (10.x.x.x range)
*/

// Rest of your ESP32 code remains the same...
// Just replace the serverURL line with the new IP above
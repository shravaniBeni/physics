/* ===== NETWORK CONFIGURATION TEMPLATE ===== */

/* ===== WIFI SETTINGS ===== */
// Update these for your new location
const char* ssid = "Atlas5";           // Your new WiFi name
const char* password = "FutureisTech"; // Your new WiFi password

/* ===== BACKEND SERVER CONFIG ===== */
// ⚠️ UPDATE THIS IP ADDRESS FOR NEW LOCATION ⚠️
// Find your computer's IP with: ipconfig (Windows) or ifconfig (Mac/Linux)

// OLD LOCATION (example):
// const char* serverURL = "http://192.168.1.101:3002";

// NEW LOCATION - UPDATE THIS IP:
const char* serverURL = "http://192.168.0.XXX:3002"; // Replace XXX with your computer's new IP

/* ===== QUICK SETUP GUIDE ===== */
/*
1. Connect to new WiFi
2. Find your computer's IP address:
   - Windows: Open CMD, type "ipconfig"
   - Mac: Open Terminal, type "ifconfig" 
   - Look for IPv4 address like 192.168.0.105

3. Update serverURL above with the new IP
4. Upload this code to ESP32
5. Start your physics lab server on your computer
6. Test connection from ESP32 web interface

Example IPs by network type:
- Home routers: 192.168.1.x or 192.168.0.x
- Office/School: 10.0.0.x or 172.16.x.x
- Mobile hotspot: 192.168.43.x
*/

/* ===== ALTERNATIVE: AUTO-DISCOVERY (ADVANCED) ===== */
// If you want to avoid manual IP updates, you could implement:
// 1. mDNS discovery (find server by name instead of IP)
// 2. Broadcast discovery (ESP32 searches for server)
// 3. Static IP configuration (set fixed IPs)

/* ===== TROUBLESHOOTING ===== */
/*
Common issues:
1. Wrong IP address - double-check with ipconfig/ifconfig
2. Firewall blocking - temporarily disable to test
3. Different subnet - ensure ESP32 and computer on same network
4. Server not running - start physics lab server first
5. Port blocked - try different port if 3002 doesn't work
*/
@echo off
echo ========================================
echo    FINDING YOUR COMPUTER'S IP ADDRESS
echo ========================================
echo.

echo Your network configuration:
ipconfig | findstr /i "IPv4"

echo.
echo ========================================
echo INSTRUCTIONS FOR ESP32 UPDATE:
echo ========================================
echo 1. Look for "IPv4 Address" above
echo 2. Copy the IP address (like 192.168.0.105)
echo 3. Update ESP32 code: 
echo    const char* serverURL = "http://YOUR_IP:3002";
echo 4. Upload to ESP32
echo ========================================

pause
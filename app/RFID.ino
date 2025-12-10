/*
 * ESP32 RFID Attendance System
 * Features:
 * - RC522 RFID Reader
 * - I2C LCD Display (16x2)
 * - WiFi Connection
 * - Time In/Time Out Recording
 * - Student Information Display
 * 
 * Pin Connections:
 * RC522:
 *   GPIO 5  -> SDA/SS
 *   GPIO 4  -> RST
 *   GPIO 18 -> SCK
 *   GPIO 23 -> MOSI
 *   GPIO 19 -> MISO
 *   3.3V    -> VCC (try 5V if 3.3V doesn't work)
 *   GND     -> GND
 * 
 * LCD (I2C):
 *   GPIO 21 -> SDA
 *   GPIO 22 -> SCL
 *   5V/3.3V -> VCC
 *   GND     -> GND
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <SPI.h>
#include <MFRC522.h>
#include <LiquidCrystal_I2C.h>
#include <ArduinoJson.h>

// WiFi Credentials
const char* ssid = "PLDTHOMEFIBRcb1f0";
const char* password = "PLDTWIFIf3p4u";

// Server URL Configuration
// Switch between LOCAL (faster) and VERCEL (production) by uncommenting the one you want

// LOCAL SERVER (FASTER - for testing/development)
// Make sure your Next.js dev server is running on port 3000
const char* serverURL = "http://192.168.1.9:3000/api/admin/attendance-live";

// VERCEL DEPLOYMENT (for production/remote access)
// const char* serverURL = "https://migrate-eight.vercel.app/api/admin/attendance-live";

// RC522 Pins
#define SS_PIN 5
#define RST_PIN 4

// SPI Pins for ESP32
#define SCK_PIN 18
#define MOSI_PIN 23
#define MISO_PIN 19

// Initialize RC522
MFRC522 mfrc522(SS_PIN, RST_PIN);

// Initialize LCD (I2C address: 0x27 or 0x3F)
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Variables
String lastCardUID = "";
unsigned long lastScanTime = 0;
const unsigned long scanInterval = 1000; // 1 second between scans (reduced from 2s)
bool isConnected = false;
bool rc522Working = false;

// HTTP Client reuse for faster connections
WiFiClientSecure secureClient;  // For HTTPS (Vercel)
WiFiClient regularClient;       // For HTTP (local)
HTTPClient http;
bool httpInitialized = false;

void setup() {
  // Initialize Serial
  Serial.begin(115200);
  delay(2000);
  
  Serial.println();
  Serial.println("========================================");
  Serial.println("ESP32 RFID Attendance System");
  Serial.println("========================================");
  
  // Initialize LCD
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Initializing...");
  
  // Initialize SPI
  Serial.println("Initializing SPI...");
  SPI.begin(SCK_PIN, MISO_PIN, MOSI_PIN, SS_PIN);
  delay(100);
  
  // Reset RC522
  Serial.println("Resetting RC522...");
  pinMode(RST_PIN, OUTPUT);
  digitalWrite(RST_PIN, LOW);
  delay(50);
  digitalWrite(RST_PIN, HIGH);
  delay(200);
  
  // Initialize RC522
  Serial.println("Initializing RC522...");
  mfrc522.PCD_Init();
  delay(100);
  
  // Check RC522 version
  byte version = mfrc522.PCD_ReadRegister(mfrc522.VersionReg);
  Serial.print("RC522 Version: 0x");
  if (version < 0x10) Serial.print("0");
  Serial.println(version, HEX);
  
  if (version == 0x00 || version == 0xFF) {
    Serial.println("ERROR: RC522 not detected!");
    Serial.println("Check wiring and power supply.");
    Serial.println("Try using 5V instead of 3.3V for RC522 VCC");
    rc522Working = false;
    
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("RC522 ERROR!");
    lcd.setCursor(0, 1);
    lcd.print("Check Wiring");
    delay(5000);
  } else {
    Serial.println("RC522 initialized successfully!");
    rc522Working = true;
    
    // Set antenna gain to maximum
    mfrc522.PCD_SetAntennaGain(mfrc522.RxGain_max);
    Serial.println("Antenna gain set to maximum");
  }
  
  // Connect to WiFi
  connectToWiFi();
  
  // Display ready message
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("System Ready");
  lcd.setCursor(0, 1);
  lcd.print("Scan RFID Card");
  
  Serial.println("System ready. Waiting for RFID card...");
  Serial.println("========================================");
}

void loop() {
  // Check WiFi
  if (WiFi.status() != WL_CONNECTED) {
    isConnected = false;
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi Disconnected");
    connectToWiFi();
    return;
  }
  
  // Skip if RC522 not working
  if (!rc522Working) {
    delay(1000);
    return;
  }
  
  // CONTINUOUS CARD DETECTION - Optimized for speed
  // Check for cards with minimal delay
  if (!mfrc522.PICC_IsNewCardPresent()) {
    // No card detected, continue loop (reduced delay for faster scanning)
    delay(5); // Reduced from 10ms to 5ms
    return;
  }
  
  // Card detected! Now try to read it
  if (!mfrc522.PICC_ReadCardSerial()) {
    // Failed to read, try again (reduced delay)
    delay(5); // Reduced from 10ms to 5ms
    return;
  }
  
  // Card read successfully!
  Serial.println();
  Serial.println(">>> CARD DETECTED! <<<");
  
  // Read UID
  String cardUID = "";
  Serial.print("UID: ");
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (mfrc522.uid.uidByte[i] < 0x10) cardUID += "0";
    cardUID += String(mfrc522.uid.uidByte[i], HEX);
    Serial.print("0x");
    if (mfrc522.uid.uidByte[i] < 0x10) Serial.print("0");
    Serial.print(mfrc522.uid.uidByte[i], HEX);
    Serial.print(" ");
  }
  Serial.println();
  cardUID.toUpperCase();
  Serial.println("Card UID: " + cardUID);
  
  // Prevent duplicate scans
  unsigned long currentTime = millis();
  if (cardUID == lastCardUID && (currentTime - lastScanTime) < scanInterval) {
    Serial.println("(Same card, ignoring duplicate)");
    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();
    delay(100);
    return;
  }
  
  lastCardUID = cardUID;
  lastScanTime = currentTime;
  
  Serial.println(">>> Processing: " + cardUID + " <<<");
  
  // Display on LCD
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Scanning...");
  lcd.setCursor(0, 1);
  String displayUID = cardUID;
  if (displayUID.length() > 16) {
    displayUID = displayUID.substring(0, 13) + "...";
  }
  lcd.print(displayUID);
  
  // Send to server
  sendScanToServer(cardUID);
  
  // Halt card and stop crypto (reduced delay for faster response)
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
  delay(200); // Reduced from 500ms to 200ms
  
  // Reset display
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("System Ready");
  lcd.setCursor(0, 1);
  lcd.print("Scan RFID Card");
}

void connectToWiFi() {
  Serial.println();
  Serial.println("========================================");
  Serial.println("WiFi Connection Debug");
  Serial.println("========================================");
  Serial.print("SSID: ");
  Serial.println(ssid);
  Serial.print("Password: ");
  Serial.println(password ? "***SET***" : "NOT SET");
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Connecting WiFi");
  lcd.setCursor(0, 1);
  lcd.print("Please wait...");
  
  // Disconnect any existing connection
  WiFi.disconnect(true);
  delay(100);
  
  // Set WiFi mode to Station (client)
  WiFi.mode(WIFI_STA);
  
  // Set hostname for easier identification
  WiFi.setHostname("ESP32-RFID-Scanner");
  
  // Begin connection
  Serial.println("Starting WiFi connection...");
  WiFi.begin(ssid, password);
  
  // Wait for connection with detailed status reporting
  int attempts = 0;
  int maxAttempts = 30; // 15 seconds total (30 * 500ms)
  
  Serial.println("Waiting for connection...");
  while (WiFi.status() != WL_CONNECTED && attempts < maxAttempts) {
    delay(500);
    Serial.print(".");
    attempts++;
    
    // Print status every 5 attempts (2.5 seconds)
    if (attempts % 5 == 0) {
      Serial.println();
      Serial.print("Attempt ");
      Serial.print(attempts);
      Serial.print("/");
      Serial.print(maxAttempts);
      Serial.print(" - Status: ");
      printWiFiStatus();
    }
  }
  
  Serial.println();
  Serial.println("========================================");
  
  if (WiFi.status() == WL_CONNECTED) {
    isConnected = true;
    Serial.println("✅ WiFi CONNECTED!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Gateway: ");
    Serial.println(WiFi.gatewayIP());
    Serial.print("Subnet: ");
    Serial.println(WiFi.subnetMask());
    Serial.print("RSSI (Signal): ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
    Serial.print("MAC Address: ");
    Serial.println(WiFi.macAddress());
    Serial.println("========================================");
    
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi Connected");
    lcd.setCursor(0, 1);
    String ipStr = WiFi.localIP().toString();
    if (ipStr.length() > 16) {
      ipStr = ipStr.substring(0, 13) + "...";
    }
    lcd.print(ipStr);
    delay(2000);
  } else {
    isConnected = false;
    Serial.println("❌ WiFi CONNECTION FAILED!");
    Serial.print("Final Status: ");
    printWiFiStatus();
    Serial.println("========================================");
    Serial.println("Troubleshooting:");
    Serial.println("1. Check SSID and password are correct");
    Serial.println("2. Ensure WiFi router is powered on");
    Serial.println("3. Check signal strength (move closer)");
    Serial.println("4. Try disconnecting USB and using battery");
    Serial.println("5. Check if router allows new devices");
    Serial.println("6. USB power might be insufficient - try external power");
    Serial.println("========================================");
    
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi Failed!");
    lcd.setCursor(0, 1);
    lcd.print("Check Serial");
    delay(3000);
  }
}

void printWiFiStatus() {
  wl_status_t status = WiFi.status();
  switch (status) {
    case WL_IDLE_STATUS:
      Serial.println("IDLE - WiFi is in process of changing between states");
      break;
    case WL_NO_SSID_AVAIL:
      Serial.println("NO SSID AVAIL - Configured SSID cannot be reached");
      break;
    case WL_SCAN_COMPLETED:
      Serial.println("SCAN COMPLETED - Networks scan completed");
      break;
    case WL_CONNECTED:
      Serial.println("CONNECTED - Successfully connected to WiFi");
      break;
    case WL_CONNECT_FAILED:
      Serial.println("CONNECT FAILED - Password is incorrect");
      break;
    case WL_CONNECTION_LOST:
      Serial.println("CONNECTION LOST - Connection was lost");
      break;
    case WL_DISCONNECTED:
      Serial.println("DISCONNECTED - WiFi is disconnected");
      break;
    default:
      Serial.print("UNKNOWN STATUS: ");
      Serial.println(status);
      break;
  }
}

void sendScanToServer(String rfidCard) {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected! Reconnecting...");
    isConnected = false;
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi Lost");
    lcd.setCursor(0, 1);
    lcd.print("Reconnecting...");
    connectToWiFi();
    if (WiFi.status() != WL_CONNECTED) {
      delay(2000);
      return;
    }
  }
  
  // Determine if using local (HTTP) or Vercel (HTTPS)
  bool isLocal = String(serverURL).startsWith("http://");
  
  Serial.print("Preparing ");
  Serial.print(isLocal ? "HTTP" : "HTTPS");
  Serial.println(" connection...");
  Serial.println("Server URL: " + String(serverURL));
  
  // Reuse client connection for faster requests
  if (!httpInitialized) {
    if (isLocal) {
      // HTTP for local server (faster, no SSL overhead)
      regularClient.setTimeout(5000); // 5 seconds for local (very fast)
      http.setTimeout(5000);
    } else {
      // HTTPS for Vercel
      secureClient.setInsecure(); // Skip certificate validation
      secureClient.setTimeout(10000); // 10 seconds for remote
      http.setTimeout(10000);
    }
    http.setReuse(true); // Enable connection reuse for faster requests
    httpInitialized = true;
  }
  
  String url = String(serverURL);
  if (url.endsWith("/")) {
    url = url.substring(0, url.length() - 1);
  }
  
  Serial.println("Connecting to: " + url);
  
  // Begin connection with retry (increased attempts for reliability)
  bool connected = false;
  int maxAttempts = isLocal ? 3 : 2; // Increased to 3 attempts for local
  Serial.println("Attempting to connect to server...");
  
  for (int attempt = 0; attempt < maxAttempts; attempt++) {
    Serial.print("Connection attempt ");
    Serial.print(attempt + 1);
    Serial.print("/");
    Serial.print(maxAttempts);
    Serial.println("...");
    
    // Close any existing connection first
    http.end();
    delay(100);
    
    // Use appropriate client based on URL
    bool beginResult = isLocal 
      ? http.begin(regularClient, url)
      : http.begin(secureClient, url);
      
    if (beginResult) {
      Serial.println("✓ Connection established!");
      connected = true;
      break;
    } else {
      Serial.print("✗ Connection attempt ");
      Serial.print(attempt + 1);
      Serial.println(" failed");
      if (attempt < maxAttempts - 1) {
        Serial.println("Retrying in 500ms...");
        delay(500);
      }
    }
  }
  
  if (!connected) {
    Serial.println("========================================");
    Serial.println("❌ ERROR: Failed to establish connection");
    Serial.println("========================================");
    Serial.print("Server URL: ");
    Serial.println(url);
    Serial.print("WiFi Status: ");
    printWiFiStatus();
    Serial.print("WiFi IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("Gateway: ");
    Serial.println(WiFi.gatewayIP());
    Serial.println("========================================");
    Serial.println("Troubleshooting:");
    Serial.println("1. Check if Next.js dev server is running");
    Serial.println("2. Verify server URL is correct");
    Serial.println("3. Check if PC firewall is blocking port 3000");
    Serial.println("4. Try accessing URL in browser: " + url);
    Serial.println("5. Verify ESP32 and PC are on same network");
    Serial.println("========================================");
    
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Connection");
    lcd.setCursor(0, 1);
    lcd.print("Failed");
    delay(3000);
    return;
  }
  
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Accept", "application/json");
  http.addHeader("Connection", "close");
  
  // Create JSON payload
  DynamicJsonDocument doc(512);
  doc["rfidCard"] = rfidCard;
  
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  Serial.println("Sending: " + jsonPayload);
  Serial.println("Payload length: " + String(jsonPayload.length()));
  
  // Send POST request with timeout handling
  Serial.println("Sending POST request...");
  Serial.print("Payload: ");
  Serial.println(jsonPayload);
  
  int httpCode = http.POST(jsonPayload);
  
  Serial.println("========================================");
  Serial.print("HTTP Response Code: ");
  Serial.println(httpCode);
  Serial.println("========================================");
  
  if (httpCode > 0) {
    String response = http.getString();
    response.trim();

    Serial.println("Response: " + response);
    
    // Check if response is valid JSON
    if (response.length() > 0 && (response.startsWith("{") || response.startsWith("["))) {
      DynamicJsonDocument responseDoc(2048);
      DeserializationError error = deserializeJson(responseDoc, response);
      
      if (!error && responseDoc["success"]) {
        // Success!
        const char* studentName = responseDoc["record"]["studentName"] | "Unknown";
        const char* scanType = responseDoc["record"]["scanType"] | "unknown";
        
        Serial.println("Success! Student: " + String(studentName));
        Serial.println("Scan Type: " + String(scanType));
        
        // Display on LCD
        lcd.clear();
        String name = String(studentName);
        if (name.length() > 16) {
          name = name.substring(0, 13) + "...";
        }
        lcd.setCursor(0, 0);
        lcd.print(name);
        
        if (strcmp(scanType, "timein") == 0) {
          lcd.setCursor(0, 1);
          lcd.print("TIME IN");
        } else if (strcmp(scanType, "timeout") == 0) {
          lcd.setCursor(0, 1);
          lcd.print("TIME OUT");
        } else {
          lcd.setCursor(0, 1);
          lcd.print("Recorded");
        }
        
        delay(2000); // Reduced from 3000ms to 2000ms for faster next scan
      } else {
        // Error from server
        String errorMsg = "Error";
        String searchedRfid = "";
        
        if (responseDoc.containsKey("error")) {
          errorMsg = responseDoc["error"].as<String>();
        }
        if (responseDoc.containsKey("searchedRfid")) {
          searchedRfid = responseDoc["searchedRfid"].as<String>();
        }
        if (responseDoc.containsKey("message")) {
          errorMsg = responseDoc["message"].as<String>();
        }
        
        Serial.println("Server error: " + errorMsg);
        if (searchedRfid.length() > 0) {
          Serial.println("Searched RFID: " + searchedRfid);
          Serial.println("IMPORTANT: Assign this RFID card to a student in the admin panel!");
        }
        Serial.println("Full response: " + response);
        
        // Display error on LCD - show RFID and error message
        lcd.clear();
        if (searchedRfid.length() > 0) {
          // Show RFID on first line
          String rfidDisplay = "RFID: " + searchedRfid;
          if (rfidDisplay.length() > 16) {
            rfidDisplay = searchedRfid.substring(0, 13) + "...";
          }
          lcd.setCursor(0, 0);
          lcd.print(rfidDisplay);
          
          // Show error on second line
          lcd.setCursor(0, 1);
          lcd.print("Not Found");
        } else {
          // No RFID info, just show error message
          if (errorMsg.length() <= 16) {
            lcd.setCursor(0, 0);
            lcd.print(errorMsg);
          } else {
            String line1 = errorMsg.substring(0, 16);
            String line2 = errorMsg.substring(16, 32);
            lcd.setCursor(0, 0);
            lcd.print(line1);
            lcd.setCursor(0, 1);
            lcd.print(line2);
          }
        }
        delay(3000); // Reduced from 5000ms to 3000ms
      }
    } else {
      Serial.println("========================================");
      Serial.println("❌ INVALID RESPONSE FORMAT");
      Serial.println("========================================");
      Serial.print("Response length: ");
      Serial.println(response.length());
      Serial.print("Response (first 200 chars): ");
      Serial.println(response.substring(0, 200));
      Serial.println("========================================");
      Serial.println("Possible causes:");
      Serial.println("  1. Server returned HTML instead of JSON");
      Serial.println("  2. Server returned empty response");
      Serial.println("  3. Response is not valid JSON");
      Serial.println("  4. Network issue causing truncated response");
      Serial.println("========================================");
      
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Invalid Response");
      lcd.setCursor(0, 1);
      lcd.print("Check Serial");
      delay(3000);
    }
  } else {
    // HTTP Error Code -1 usually means connection failed
    Serial.println("========================================");
    Serial.println("❌ HTTP ERROR");
    Serial.println("========================================");
    Serial.print("HTTP Error Code: ");
    Serial.println(httpCode);
    
    String errorMsg = "";
    if (httpCode == -1 || httpCode == 0 || httpCode == -11) {
      if (httpCode == -11) {
        errorMsg = "Connection Refused";
        Serial.println("========================================");
        Serial.println("❌ ERROR -11: Connection Refused");
        Serial.println("========================================");
        Serial.println("This means the server rejected the connection.");
        Serial.println("Possible causes:");
        Serial.println("1. Next.js server is NOT running");
        Serial.println("2. Wrong IP address in serverURL");
        Serial.println("3. Firewall blocking port 3000");
        Serial.println("4. ESP32 and PC on different networks");
        Serial.println("========================================");
        Serial.print("Target Server: ");
        Serial.println(serverURL);
        Serial.print("ESP32 IP: ");
        Serial.println(WiFi.localIP());
        Serial.print("Gateway: ");
        Serial.println(WiFi.gatewayIP());
        Serial.print("Server IP (extracted): ");
        // Extract IP from URL
        String urlStr = String(serverURL);
        if (urlStr.startsWith("http://")) {
          int start = urlStr.indexOf("//") + 2;
          int end = urlStr.indexOf(":", start);
          if (end == -1) end = urlStr.indexOf("/", start);
          if (end != -1) {
            Serial.println(urlStr.substring(start, end));
          }
        }
        Serial.println("========================================");
        Serial.println("Troubleshooting Steps:");
        Serial.println("1. Open browser on PC and go to: " + String(serverURL));
        Serial.println("2. If browser shows error, server is not running");
        Serial.println("3. Run 'npm run dev' in your project folder");
        Serial.println("4. Check Windows Firewall allows port 3000");
        Serial.println("5. Verify ESP32 IP and PC IP are on same subnet");
        Serial.println("========================================");
        Serial.println("========================================");
        Serial.println("This means the server rejected the connection.");
        Serial.println("Possible causes:");
        Serial.println("1. Server is NOT running (most common)");
        Serial.println("2. Wrong IP address (192.168.1.9 might be wrong)");
        Serial.println("3. Wrong port (should be 3000)");
        Serial.println("4. Firewall blocking port 3000 on your PC");
        Serial.println("5. Server crashed or not accepting connections");
      } else {
        errorMsg = "Connection Failed";
        Serial.println("ERROR: Connection failed (Code " + String(httpCode) + ")");
        Serial.println("========================================");
        Serial.println("Possible causes:");
        Serial.println("1. Server unreachable (check if Next.js is running)");
        Serial.println("2. WiFi connection lost");
        Serial.println("3. Wrong IP address or port");
        Serial.println("4. Firewall blocking connection");
        Serial.println("5. Server not responding");
      }
      Serial.println("========================================");
      Serial.print("Attempted URL: ");
      Serial.println(url);
      Serial.print("WiFi Status: ");
      printWiFiStatus();
      Serial.print("WiFi IP: ");
      Serial.println(WiFi.localIP());
      Serial.print("Target IP: ");
      // Extract IP from URL
      String targetIP = url;
      if (targetIP.startsWith("http://")) {
        targetIP = targetIP.substring(7); // Remove "http://"
      } else if (targetIP.startsWith("https://")) {
        targetIP = targetIP.substring(8); // Remove "https://"
      }
      int colonPos = targetIP.indexOf(':');
      if (colonPos > 0) {
        targetIP = targetIP.substring(0, colonPos);
      }
      int slashPos = targetIP.indexOf('/');
      if (slashPos > 0) {
        targetIP = targetIP.substring(0, slashPos);
      }
      Serial.println(targetIP);
      Serial.println("========================================");
      Serial.println("TROUBLESHOOTING STEPS:");
      Serial.println("1. Check if Next.js server is running:");
      Serial.println("   - Open terminal in project folder");
      Serial.println("   - Run: npm run dev");
      Serial.println("   - Should see: 'Ready on http://localhost:3000'");
      Serial.println("");
      Serial.println("2. Verify IP address:");
      Serial.println("   - On Windows: Run 'ipconfig' in CMD");
      Serial.println("   - Look for 'IPv4 Address' (usually 192.168.x.x)");
      Serial.println("   - Update serverURL in RFID.ino if different");
      Serial.println("");
      Serial.println("3. Test server in browser:");
      Serial.println("   - Open: " + url);
      Serial.println("   - Should see JSON response, not error page");
      Serial.println("");
      Serial.println("4. Check Windows Firewall:");
      Serial.println("   - Allow port 3000 for Node.js");
      Serial.println("   - Or temporarily disable firewall to test");
      Serial.println("========================================");
      
      // Try to reconnect WiFi
      if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi disconnected, attempting reconnect...");
        connectToWiFi();
      }
    } else if (httpCode == -2) {
      errorMsg = "Timeout";
      Serial.println("ERROR: Request timeout (Code -2)");
      Serial.println("Server took too long to respond");
    } else if (httpCode == -3) {
      errorMsg = "Invalid Response";
      Serial.println("ERROR: Invalid response from server (Code -3)");
    } else {
      errorMsg = "Error " + String(httpCode);
      Serial.print("ERROR: Unknown HTTP error code: ");
      Serial.println(httpCode);
    }
    
    // Try to get error response
    String errorResponse = http.getString();
    if (errorResponse.length() > 0) {
      Serial.println("Error response: " + errorResponse);
    }
    
    lcd.clear();
    lcd.setCursor(0, 0);
    if (errorMsg.length() <= 16) {
      lcd.print(errorMsg);
    } else {
      lcd.print(errorMsg.substring(0, 16));
    }
    lcd.setCursor(0, 1);
    if (httpCode == -11) {
      lcd.print("Server Not Running");
    } else if (httpCode == -1 || httpCode == 0) {
      lcd.print("Check WiFi/Server");
    } else {
      lcd.print("Code: " + String(httpCode));
    }
    delay(3000); // Increased to 3 seconds for error messages
  }
  
  // End HTTP request but keep client connection for reuse
  http.end();
  // Note: We keep the client connection alive for faster next request
  
  // Minimal delay before next operation
  delay(50); // Reduced from 100ms to 50ms
}

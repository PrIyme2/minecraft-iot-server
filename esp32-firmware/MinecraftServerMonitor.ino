#include <WiFi.h>
#include <WiFiMulti.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <ArduinoJson.h>

// =========================================================================
// 1. DISPLAY AUSWAHL (1 = OLED 128x64, 2 = LCD 16x2)
// =========================================================================
#define DISPLAY_TYPE 1

#if DISPLAY_TYPE == 1
  #include <Adafruit_GFX.h>
  #include <Adafruit_SSD1306.h>
  #define SCREEN_WIDTH 128
  #define SCREEN_HEIGHT 64
  #define OLED_RESET -1
  Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
#elif DISPLAY_TYPE == 2
  #include <LiquidCrystal_I2C.h>
  LiquidCrystal_I2C lcd(0x27, 16, 2);
#endif

// =========================================================================
// 2. PIN-KONFIGURATION
// =========================================================================
// Display I2C:
#define I2C_SDA 26  // SDA = GPIO 26
#define I2C_SCL 25  // SCL = GPIO 25

// Status-Lampen (LEDs):
#define PIN_LED_GREEN  27  // Gruene LED : Pin D27 (TPS 20 / optimal)
#define PIN_LED_YELLOW 14  // Gelbe LED  : Pin D14 (TPS 17-19 / Booten / Warnung)
#define PIN_LED_RED    13  // Rote LED   : Pin D13 (TPS < 17 oder Offline)

// 3 Knoepfe (Taster) zum Ein- und Ausschalten sowie Backup:
#define PIN_BTN_START  18  // Start-Knopf : Pin D18 (Server einschalten)
#define PIN_BTN_STOP   19  // Stop-Knopf  : Pin D19 (Server ausschalten)
#define PIN_BTN_BACKUP 23  // Backup-Knopf: Pin D23 (Google Drive Backup starten)

// =========================================================================
// 3. WLAN & TAILSCALE KONFIGURATION
// =========================================================================
WiFiMulti wifiMulti;

// Weltweit erreichbare Tailscale-URL & lokales Heimnetz
// Ersetze diese Werte mit deiner Tailscale Funnel Domain bzw. lokaler IP:
const char* TAILSCALE_BASE_URL = "https://YOUR_TAILSCALE_DEVICE.ts.net";
const char* LOCAL_BASE_URL     = "http://192.168.0.33:5000";
const char* HOME_SSID          = "YOUR_HOME_WIFI_SSID";

// Intervall:
const unsigned long UPDATE_INTERVAL = 2500;

// =========================================================================
// ZUSTANDSMASCHINE & VARIABLEN
// =========================================================================
enum ServerLifecycleState {
  STATE_OFFLINE,
  STATE_STARTING,
  STATE_ONLINE,
  STATE_STOPPING
};

ServerLifecycleState serverState = STATE_OFFLINE;
unsigned long stateChangeTime = 0;

bool serverOnline = false;
int serverPing = 0;
int onlinePlayers = 0;
int maxPlayers = 20;
int ramPct = 0;
float currentTps = 20.0f;
unsigned long lastUpdate = 0;
bool heartbeat = false;

// Hardware-Interrupt & Taster-Logik
unsigned long actionCooldown = 0;
volatile bool startRequested = false;
volatile bool stopRequested = false;
volatile bool backupRequested = false;
volatile unsigned long lastStartInterrupt = 0;
volatile unsigned long lastStopInterrupt = 0;
volatile unsigned long lastBackupInterrupt = 0;

int lastStartPoll  = HIGH;
int lastStopPoll   = HIGH;
int lastBackupPoll = HIGH;

// Funktions-Prototypen
void updateDisplay();
void setLampState(bool online, float tps);

// =========================================================================
// INTERRUPT SERVICE ROUTINES (ISRs) MIT DEBOUNCE (ENTPRELLUNG)
// =========================================================================
void IRAM_ATTR isrStartButton() {
  unsigned long now = millis();
  if (now - lastStartInterrupt > 300) {
    startRequested = true;
    lastStartInterrupt = now;
  }
}

void IRAM_ATTR isrStopButton() {
  unsigned long now = millis();
  if (now - lastStopInterrupt > 300) {
    stopRequested = true;
    lastStopInterrupt = now;
  }
}

void IRAM_ATTR isrBackupButton() {
  unsigned long now = millis();
  if (now - lastBackupInterrupt > 300) {
    backupRequested = true;
    lastBackupInterrupt = now;
  }
}

// -------------------------------------------------------------------------
// Ampelsystem (3 LEDs nach TPS-Schwellenwerten)
// -------------------------------------------------------------------------
void setLampState(bool online, float tps) {
  if (serverState == STATE_STARTING || serverState == STATE_STOPPING) {
    digitalWrite(PIN_LED_GREEN,  LOW);
    digitalWrite(PIN_LED_YELLOW, HIGH);
    digitalWrite(PIN_LED_RED,    LOW);
    return;
  }

  if (!online || serverState == STATE_OFFLINE) {
    digitalWrite(PIN_LED_GREEN,  LOW);
    digitalWrite(PIN_LED_YELLOW, LOW);
    digitalWrite(PIN_LED_RED,    HIGH);
    return;
  }

  // Server ist ONLINE -> Ampel nach Performance / TPS
  if (tps >= 19.5f) {
    digitalWrite(PIN_LED_GREEN,  HIGH);
    digitalWrite(PIN_LED_YELLOW, LOW);
    digitalWrite(PIN_LED_RED,    LOW);
  } else if (tps >= 16.0f) {
    digitalWrite(PIN_LED_GREEN,  LOW);
    digitalWrite(PIN_LED_YELLOW, HIGH);
    digitalWrite(PIN_LED_RED,    LOW);
  } else {
    // Schwerer Lag (< 16.0 TPS): Rot leuchtet als Warnung
    digitalWrite(PIN_LED_GREEN,  LOW);
    digitalWrite(PIN_LED_YELLOW, LOW);
    digitalWrite(PIN_LED_RED,    HIGH);
  }
}

// -------------------------------------------------------------------------
// Server-Aktion senden (start / stop / backup)
// Intelligent: Nutzt zu Hause LAN, unterwegs Tailscale Funnel HTTPS!
// -------------------------------------------------------------------------
void sendServerAction(const char* action, const char* displayMsg) {
  Serial.printf("\n>>> [BEFEHL] Sende '%s' an Laptop... <<<\n", action);

  if (WiFi.status() == WL_CONNECTED) {
    bool atHome = (WiFi.SSID() == HOME_SSID);
    bool sent = false;

    // 1. Wenn zu Hause: Zuerst ultraschnell ueber LAN probieren
    if (atHome) {
      HTTPClient localHttp;
      String localUrl = String(LOCAL_BASE_URL) + "/" + String(action);
      localHttp.begin(localUrl);
      localHttp.setTimeout(2500);
      int code = localHttp.GET();
      if (code > 0) {
        Serial.printf("[HTTP-LAN] Antwort: %d\n", code);
        sent = true;
      }
      localHttp.end();
    }

    // 2. Unterwegs (oder wenn LAN fehlschlaegt): Ueber Tailscale Funnel HTTPS
    if (!sent) {
      WiFiClientSecure secureClient;
      secureClient.setInsecure();
      secureClient.setTimeout(4000);

      HTTPClient http;
      String url = String(TAILSCALE_BASE_URL) + "/" + String(action);
      http.begin(secureClient, url);
      http.setTimeout(4000);
      int httpCode = http.GET();

      if (httpCode > 0) {
        String payload = http.getString();
        Serial.printf("[HTTP-Tailscale] Antwort: %d (%s)\n", httpCode, payload.c_str());
      } else {
        Serial.printf("[HTTP] Fehler: %s\n", http.errorToString(httpCode).c_str());
      }
      http.end();
    }
  } else {
    Serial.println("[HTTP] FEHLER: Kein WLAN!");
  }
}

// -------------------------------------------------------------------------
// Taster-Aktionen verarbeiten
// -------------------------------------------------------------------------
void handleStartTrigger() {
  Serial.println("\n[TASTER] Start-Knopf gedrueckt (Pin 18)!");
  actionCooldown = millis() + 4000;
  serverState = STATE_STARTING;
  stateChangeTime = millis();

  digitalWrite(PIN_LED_GREEN,  LOW);
  digitalWrite(PIN_LED_YELLOW, HIGH);
  digitalWrite(PIN_LED_RED,    LOW);
  updateDisplay();

  sendServerAction("start", "STARTE SERVER..");
  updateDisplay();
  lastUpdate = millis();
}

void handleStopTrigger() {
  Serial.println("\n[TASTER] Stop-Knopf gedrueckt (Pin 19)!");
  actionCooldown = millis() + 4000;
  serverState = STATE_STOPPING;
  stateChangeTime = millis();

  digitalWrite(PIN_LED_GREEN,  LOW);
  digitalWrite(PIN_LED_YELLOW, HIGH);
  digitalWrite(PIN_LED_RED,    LOW);
  updateDisplay();

  sendServerAction("stop", "STOPPE SERVER..");
  updateDisplay();
  lastUpdate = millis();
}

void handleBackupTrigger() {
  Serial.println("\n[TASTER] Backup-Knopf gedrueckt (Pin 23)!");
  actionCooldown = millis() + 4000;

  digitalWrite(PIN_LED_GREEN,  LOW);
  digitalWrite(PIN_LED_YELLOW, HIGH);
  digitalWrite(PIN_LED_RED,    LOW);

#if DISPLAY_TYPE == 1
  display.clearDisplay();
  display.fillRect(0, 0, 128, 12, SSD1306_WHITE);
  display.setTextColor(SSD1306_BLACK, SSD1306_WHITE);
  display.setTextSize(1);
  display.setCursor(14, 2);
  display.print("MINECRAFT SERVER");
  display.setTextColor(SSD1306_WHITE);
  display.drawRoundRect(0, 15, 128, 16, 3, SSD1306_WHITE);
  display.setCursor(16, 19);
  display.print(">> BACKUP... <<");
  display.setCursor(2, 36);
  display.print("Sichere Welten & DB");
  display.setCursor(2, 48);
  display.print("Upload zu GDrive...");
  display.display();
#elif DISPLAY_TYPE == 2
  lcd.clear();
  lcd.setCursor(0, 0); lcd.print("MC: BACKUP...   ");
  lcd.setCursor(0, 1); lcd.print("Upload zu GDrive");
#endif

  sendServerAction("backup", "STARTE BACKUP..");
  delay(1200);
  updateDisplay();
  lastUpdate = millis();
}

void handleButtons() {
  if (millis() < actionCooldown) {
    startRequested = false;
    stopRequested = false;
    backupRequested = false;
    return;
  }

  if (startRequested) {
    startRequested = false;
    handleStartTrigger();
    return;
  }
  if (stopRequested) {
    stopRequested = false;
    handleStopTrigger();
    return;
  }
  if (backupRequested) {
    backupRequested = false;
    handleBackupTrigger();
    return;
  }

  int curStart  = digitalRead(PIN_BTN_START);
  int curStop   = digitalRead(PIN_BTN_STOP);
  int curBackup = digitalRead(PIN_BTN_BACKUP);

  if (lastStartPoll == HIGH && curStart == LOW) {
    handleStartTrigger();
  } else if (lastStopPoll == HIGH && curStop == LOW) {
    handleStopTrigger();
  } else if (lastBackupPoll == HIGH && curBackup == LOW) {
    handleBackupTrigger();
  }

  lastStartPoll  = curStart;
  lastStopPoll   = curStop;
  lastBackupPoll = curBackup;
}

// -------------------------------------------------------------------------
// Metriken & Status abfragen (Automatische Umschaltung LAN <-> Tailscale)
// -------------------------------------------------------------------------
void queryMinecraftServer() {
  if (WiFi.status() != WL_CONNECTED) {
    serverOnline = false;
    currentTps = 0.0f;
    return;
  }

  unsigned long tStart = millis();
  bool success = false;
  bool atHome = (WiFi.SSID() == HOME_SSID);

  // 1. Wenn zu Hause im Heim-WLAN: Zuerst schnelles LAN probieren
  if (atHome) {
    HTTPClient localHttp;
    String localUrl = String(LOCAL_BASE_URL) + "/api/status";
    localHttp.begin(localUrl);
    localHttp.setTimeout(2500);

    int localCode = localHttp.GET();
    if (localCode == 200) {
      serverPing = (int)(millis() - tStart);
      String payload = localHttp.getString();
      JsonDocument doc;
      DeserializationError err = deserializeJson(doc, payload);
      if (!err) {
        if (doc["online"].is<bool>()) serverOnline = doc["online"].as<bool>();
        if (doc["tps"].is<float>()) currentTps = doc["tps"].as<float>();
        else if (doc["tps"].is<int>()) currentTps = (float)doc["tps"].as<int>();
        if (doc["players"].is<int>()) onlinePlayers = doc["players"].as<int>();
        if (doc["max_players"].is<int>()) maxPlayers = doc["max_players"].as<int>();
        if (doc["ram_pct"].is<int>()) ramPct = doc["ram_pct"].as<int>();
        success = true;
      }
    }
    localHttp.end();
  }

  // 2. Unterwegs (Handy-Hotspot) oder Fallback: Tailscale Funnel HTTPS
  if (!success) {
    WiFiClientSecure secureClient;
    secureClient.setInsecure();
    secureClient.setTimeout(4000);

    HTTPClient http;
    String url = String(TAILSCALE_BASE_URL) + "/api/status";
    http.begin(secureClient, url);
    http.setTimeout(4000);

    int httpCode = http.GET();
    if (httpCode == 200) {
      serverPing = (int)(millis() - tStart);
      String payload = http.getString();
      JsonDocument doc;
      DeserializationError err = deserializeJson(doc, payload);
      if (!err) {
        if (doc["online"].is<bool>()) serverOnline = doc["online"].as<bool>();
        if (doc["tps"].is<float>()) currentTps = doc["tps"].as<float>();
        else if (doc["tps"].is<int>()) currentTps = (float)doc["tps"].as<int>();
        if (doc["players"].is<int>()) onlinePlayers = doc["players"].as<int>();
        if (doc["max_players"].is<int>()) maxPlayers = doc["max_players"].as<int>();
        if (doc["ram_pct"].is<int>()) ramPct = doc["ram_pct"].as<int>();
        success = true;
      }
    }
    http.end();
  }

  if (!success) {
    serverOnline = false;
    currentTps = 0.0f;
  }
}

// -------------------------------------------------------------------------
// Zustandspruefung
// -------------------------------------------------------------------------
void evaluateServerState() {
  queryMinecraftServer();
  unsigned long now = millis();

  if (serverState == STATE_STARTING) {
    if (serverOnline) {
      serverState = STATE_ONLINE;
      Serial.printf("[STATUS] Server ist BEREIT! | TPS: %.1f | Spieler: %d/%d\n", currentTps, onlinePlayers, maxPlayers);
    } else {
      unsigned long elapsed = (now - stateChangeTime) / 1000;
      if (elapsed > 45) {
        serverState = STATE_OFFLINE;
        Serial.println("[STATUS] Start-Timeout: Server reagiert nicht.");
      } else {
        Serial.printf("[STATUS] Server bootet noch... (ca. %lu s gewartet)\n", elapsed);
      }
    }
  } else if (serverState == STATE_STOPPING) {
    if (!serverOnline) {
      serverState = STATE_OFFLINE;
      Serial.println("[STATUS] Server erfolgreich heruntergefahren.");
    } else {
      unsigned long elapsed = (now - stateChangeTime) / 1000;
      if (elapsed > 30) {
        serverState = STATE_OFFLINE;
      } else {
        Serial.printf("[STATUS] Server stoppt noch... (%lu s gewartet)\n", elapsed);
      }
    }
  } else {
    if (serverOnline) {
      serverState = STATE_ONLINE;
      Serial.printf("[STATUS] Server ONLINE | Ping: %d ms | Spieler: %d/%d | TPS: %.1f | RAM: %d%%\n", 
                    serverPing, onlinePlayers, maxPlayers, currentTps, ramPct);
    } else {
      serverState = STATE_OFFLINE;
      Serial.println("[STATUS] Server OFFLINE | Rote Lampe aktiv | Start mit D18");
    }
  }

  // Wichtig: setLampState NACHDEM serverState feststeht!
  setLampState(serverOnline, currentTps);
}

// -------------------------------------------------------------------------
// Display-Ausgabe
// -------------------------------------------------------------------------
void updateDisplay() {
#if DISPLAY_TYPE == 1
  display.clearDisplay();

  // Titelleiste oben
  display.fillRect(0, 0, 128, 12, SSD1306_WHITE);
  display.setTextColor(SSD1306_BLACK, SSD1306_WHITE);
  display.setTextSize(1);
  display.setCursor(14, 2);
  display.print("MINECRAFT SERVER");

  heartbeat = !heartbeat;
  if (heartbeat) display.fillCircle(122, 5, 2, SSD1306_BLACK);

  display.setTextColor(SSD1306_WHITE);

  if (serverState == STATE_STARTING) {
    unsigned long elapsed = (millis() - stateChangeTime) / 1000;
    display.drawRoundRect(0, 15, 128, 16, 3, SSD1306_WHITE);
    display.setCursor(16, 19);
    display.print(">> STARTET... <<");

    display.setCursor(2, 34);
    display.print("Java & Welt laden");
    display.setCursor(2, 44);
    display.printf("Warte: %lu s (ca. 15s)", elapsed);

    int barWidth = (elapsed * 120) / 18;
    if (barWidth > 120) barWidth = 120;
    display.drawRect(4, 55, 120, 6, SSD1306_WHITE);
    display.fillRect(4, 55, barWidth, 6, SSD1306_WHITE);

  } else if (serverState == STATE_STOPPING) {
    display.drawRoundRect(0, 15, 128, 16, 3, SSD1306_WHITE);
    display.setCursor(16, 19);
    display.print(">> STOPPT... <<");

    display.setCursor(2, 36);
    display.print("Speichere Welten...");
    display.setCursor(2, 48);
    display.print("Server faehrt herab");

  } else if (serverState == STATE_ONLINE) {
    display.drawRoundRect(0, 15, 128, 16, 3, SSD1306_WHITE);
    display.fillRect(2, 17, 124, 12, SSD1306_WHITE);
    display.setTextColor(SSD1306_BLACK);
    display.setTextSize(1);
    if (currentTps >= 19.5f) {
      display.setCursor(24, 19);
      display.print("[ OK ] ONLINE");
    } else if (currentTps >= 16.0f) {
      display.setCursor(18, 19);
      display.print("[WARN] MODERAT");
    } else {
      display.setCursor(16, 19);
      display.print("[LAG] SEHR LANGSAM");
    }

    display.setTextColor(SSD1306_WHITE);
    display.setCursor(2, 33);
    display.printf("Spieler: %d/%d | RAM:%d%%", onlinePlayers, maxPlayers, ramPct);

    display.setCursor(2, 43);
    display.printf("Ping: %d ms", serverPing);

    display.setCursor(2, 53);
    if (currentTps >= 19.5f) {
      display.printf("TPS: %.1f  [GRUEN]", currentTps);
    } else if (currentTps >= 16.0f) {
      display.printf("TPS: %.1f  [GELB]", currentTps);
    } else {
      display.printf("TPS: %.1f  [ROT! LAG]", currentTps);
    }
  } else {
    display.drawRoundRect(0, 15, 128, 16, 3, SSD1306_WHITE);
    display.setCursor(22, 19);
    display.print("! OFFLINE !");

    display.setCursor(2, 36);
    display.print("Server ist gestoppt.");
    display.setCursor(2, 46);
    display.print("D18 druecken:");
    display.setCursor(2, 56);
    display.print("-> SERVER STARTEN");
  }
  display.display();

#elif DISPLAY_TYPE == 2
  lcd.clear();
  if (serverState == STATE_STARTING) {
    lcd.setCursor(0, 0); lcd.print("MC: STARTET...  ");
    lcd.setCursor(0, 1); lcd.print("Bitte warten....");
  } else if (serverState == STATE_STOPPING) {
    lcd.setCursor(0, 0); lcd.print("MC: STOPPT...   ");
    lcd.setCursor(0, 1); lcd.print("Speichere Welt..");
  } else if (serverState == STATE_ONLINE) {
    lcd.setCursor(0, 0); lcd.printf("MC:%3dms TPS:%.1f", serverPing, currentTps);
    lcd.setCursor(0, 1); lcd.printf("Spieler: %d/%d", onlinePlayers, maxPlayers);
  } else {
    lcd.setCursor(0, 0); lcd.print("MC: OFFLINE [!] ");
    lcd.setCursor(0, 1); lcd.print("D18=Start Server");
  }
#endif
}

// -------------------------------------------------------------------------
// Setup
// -------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n===========================================");
  Serial.println("  ESP32 Minecraft Monitor & Tailscale Link");
  Serial.println("===========================================");

  pinMode(PIN_LED_GREEN,  OUTPUT);
  pinMode(PIN_LED_YELLOW, OUTPUT);
  pinMode(PIN_LED_RED,    OUTPUT);

  pinMode(PIN_BTN_START,  INPUT_PULLUP);
  pinMode(PIN_BTN_STOP,   INPUT_PULLUP);
  pinMode(PIN_BTN_BACKUP, INPUT_PULLUP);

  lastStartPoll  = digitalRead(PIN_BTN_START);
  lastStopPoll   = digitalRead(PIN_BTN_STOP);
  lastBackupPoll = digitalRead(PIN_BTN_BACKUP);

  attachInterrupt(digitalPinToInterrupt(PIN_BTN_START),  isrStartButton,  FALLING);
  attachInterrupt(digitalPinToInterrupt(PIN_BTN_STOP),   isrStopButton,   FALLING);
  attachInterrupt(digitalPinToInterrupt(PIN_BTN_BACKUP), isrBackupButton, FALLING);

  // Lampen-Selbsttest
  digitalWrite(PIN_LED_GREEN,  HIGH); delay(200); digitalWrite(PIN_LED_GREEN,  LOW);
  digitalWrite(PIN_LED_YELLOW, HIGH); delay(200); digitalWrite(PIN_LED_YELLOW, LOW);
  digitalWrite(PIN_LED_RED,    HIGH); delay(200); digitalWrite(PIN_LED_RED,    LOW);

  setLampState(false, 0.0f);

  Wire.begin(I2C_SDA, I2C_SCL);

#if DISPLAY_TYPE == 1
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    display.begin(SSD1306_SWITCHCAPVCC, 0x3D);
  }
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(14, 8);
  display.print("MINECRAFT STATUS");
  display.drawFastHLine(0, 20, 128, SSD1306_WHITE);
  display.setCursor(0, 28);
  display.print("Verbinde Hotspot...");
  display.setCursor(0, 42);
  display.print("SSID: test (2.4GHz)");
  display.display();
#elif DISPLAY_TYPE == 2
  lcd.init(); lcd.backlight();
  lcd.setCursor(0, 0); lcd.print("Minecraft Monitor");
  lcd.setCursor(0, 1); lcd.print("Hotspot: test   ");
#endif

  // WLAN-Zugangspunkte konfigurieren (Handy-Hotspot & Heimnetzwerk)
  wifiMulti.addAP("YOUR_HOTSPOT_SSID", "YOUR_HOTSPOT_PASSWORD");
  // Optional weitere Netzwerke hinzufuegen:
  // wifiMulti.addAP("HOME_WIFI_SSID", "HOME_WIFI_PASSWORD");

  Serial.println("[WLAN] Suche nach Handy-Hotspot (SSID: test)...");
  WiFi.mode(WIFI_STA);

  int step = 0;
  while (wifiMulti.run() != WL_CONNECTED && step < 25) {
    delay(500);
#if DISPLAY_TYPE == 1
    display.fillRect(0, 54, step * 5, 6, SSD1306_WHITE);
    display.display();
#endif
    digitalWrite(PIN_LED_YELLOW, (step % 2 == 0) ? HIGH : LOW);
    step++;
  }
  digitalWrite(PIN_LED_YELLOW, LOW);

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[WLAN] Verbunden mit Hotspot: %s\n", WiFi.SSID().c_str());
    Serial.print("[WLAN] ESP32 IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[WLAN] Hotspot 'test' noch nicht verbunden. Suche laeuft weiter...");
#if DISPLAY_TYPE == 1
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 8);
    display.print("Hotspot 'test' ?");
    display.setCursor(0, 24);
    display.print("Am Handy bitte:");
    display.setCursor(0, 38);
    display.print("Kompatibilitaet");
    display.setCursor(0, 52);
    display.print("-> 2.4 GHz AN!");
    display.display();
    delay(2000);
#endif
  }

  evaluateServerState();
  updateDisplay();
  lastUpdate = millis();
}

// -------------------------------------------------------------------------
// Hauptschleife (Loop)
// -------------------------------------------------------------------------
void loop() {
  unsigned long now = millis();

  // 1. Knoepfe verarbeiten
  handleButtons();

  // 2. Zyklische Serverpruefung
  unsigned long interval = (serverState == STATE_STARTING || serverState == STATE_STOPPING) ? 1200 : UPDATE_INTERVAL;

  if (now - lastUpdate >= interval) {
    if (wifiMulti.run() != WL_CONNECTED) {
      setLampState(false, 0.0f);
#if DISPLAY_TYPE == 1
      display.clearDisplay();
      display.fillRect(0, 0, 128, 12, SSD1306_WHITE);
      display.setTextColor(SSD1306_BLACK, SSD1306_WHITE);
      display.setTextSize(1);
      display.setCursor(14, 2);
      display.print("MINECRAFT SERVER");
      display.setTextColor(SSD1306_WHITE);
      display.drawRoundRect(0, 15, 128, 16, 3, SSD1306_WHITE);
      display.setCursor(20, 19);
      display.print("! KEIN WLAN !");
      display.setCursor(2, 34);
      display.print("Suche Hotspot 'test'");
      display.setCursor(2, 46);
      display.print("Handy: Kompatibilitaet");
      display.setCursor(2, 56);
      display.print("(2.4 GHz) aktivieren");
      display.display();
#endif
    } else {
      evaluateServerState();
      updateDisplay();
    }
    lastUpdate = millis();
  }

  delay(20);
}

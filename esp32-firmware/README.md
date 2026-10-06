# 📟 ESP32 Minecraft IoT Hardware Controller Firmware

C/C++ Firmware für den ESP32-Microcontroller zur externen Überwachung und Steuerung des Minecraft-Servers.

---

## 📌 Hardware-Pinbelegung

| Komponente | ESP32 GPIO Pin | Funktion / Beschreibung |
| :--- | :--- | :--- |
| **I2C SDA** | `GPIO 26` | Display-Datenleitung (SSD1306 OLED oder LCD 16x2) |
| **I2C SCL** | `GPIO 25` | Display-Taktleitung |
| **LED Grün** | `GPIO 27` | Status optimal: Server Online & TPS ≥ 19.5 (mit 330Ω Vorwiderstand) |
| **LED Gelb** | `GPIO 14` | Status Warnung: Booting / Stop / TPS 17.0–19.4 |
| **LED Rot** | `GPIO 13` | Status Alarm: Server Offline oder TPS < 17.0 |
| **Taster START** | `GPIO 18` | Startet Server (`INPUT_PULLUP`, schaltet gegen GND) |
| **Taster STOP** | `GPIO 19` | Stoppt Server (`INPUT_PULLUP`, schaltet gegen GND) |
| **Taster BACKUP**| `GPIO 23` | Löst Cloud-Backup aus (`INPUT_PULLUP`, schaltet gegen GND) |

---

## ⚙️ Features & Software-Architektur

1. **Multi-Display-Unterstützung:**
   - Umschaltbar über `#define DISPLAY_TYPE 1` (OLED 128x64 SSD1306) oder `2` (LCD 16x2 I2C).
2. **Interrupts & Debouncing:**
   - Alle 3 Taster nutzen Hardware-Interrupts (`attachInterrupt(..., FALLING)`) mit 300ms Software-Entprellung.
   - Parallele Polling-Überprüfung in der Hauptschleife verhindert verpasste Eingaben.
3. **Netzwerk-Roaming (`WiFiMulti`):**
   - Unterstützt mehrere gespeicherte APs (z. B. Handy-Hotspot und Heim-WLAN).
   - Dynamische Umschaltung zwischen weltweitem Zugriff (`Tailscale HTTPS Funnel`) und Latenz-optimiertem lokalem Zugriff (`http://192.168.x.x:5000`).
4. **Zustandsmaschine (Lifecycle Engine):**
   - `STATE_OFFLINE`, `STATE_STARTING`, `STATE_ONLINE`, `STATE_STOPPING`.
   - Heartbeat-Blinkindikator auf dem Display für aktive Verbindungen.

---

## 📦 Benötigte Arduino-Bibliotheken

Über den Bibliotheksverwalter in der Arduino IDE (oder `arduino-cli`) installieren:
- **Adafruit SSD1306** (von Adafruit)
- **Adafruit GFX Library** (von Adafruit)
- **ArduinoJson** (Version 6.x oder 7.x)
- **LiquidCrystal_I2C** (von Frank de Brabander, falls LCD 16x2 genutzt wird)

---

## 🚀 Flashen & Konfiguration

1. Öffne [`MinecraftServerMonitor.ino`](MinecraftServerMonitor.ino) in der Arduino IDE.
2. Passe die Zeilen 48–50 sowie 605 mit deinen Zugangsdaten an:
   ```cpp
   const char* TAILSCALE_BASE_URL = "https://DEIN-GERAET.ts.net";
   wifiMulti.addAP("MEIN_HOTSPOT", "MEIN_PASSWORT");
   ```
3. Wähle als Board: **ESP32 Dev Module** (oder NodeMCU-32S).
4. Verbinde den ESP32 per USB-Kabel und klicke auf **Upload**.

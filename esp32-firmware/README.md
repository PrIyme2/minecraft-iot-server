# ESP32 Minecraft IoT Hardware Controller Firmware

C/C++ Firmware für den ESP32 zur externen Überwachung und Steuerung des Minecraft-Servers.

---

## 1. Pinbelegung

| Komponente | GPIO | Funktion |
| :--- | :--- | :--- |
| **I2C SDA** | `GPIO 26` | Display-Datenleitung (SSD1306 OLED) |
| **I2C SCL** | `GPIO 25` | Display-Taktleitung |
| **LED Grün** | `GPIO 27` | TPS ≥ 19.5 (330Ω Vorwiderstand) |
| **LED Gelb** | `GPIO 14` | Statuswechsel / TPS 17.0–19.4 / Backup aktiv |
| **LED Rot** | `GPIO 13` | Server Offline oder TPS < 17.0 |
| **Taster START** | `GPIO 18` | Startet Server (`INPUT_PULLUP` gegen GND) |
| **Taster STOP** | `GPIO 19` | Stoppt Server (`INPUT_PULLUP` gegen GND) |
| **Taster BACKUP**| `GPIO 23` | Startet Cloud-Backup (`INPUT_PULLUP` gegen GND) |

---

## 2. Kernfunktionen

- **Taster-Entprellung:** Hardware-Interrupts (`FALLING`) mit 300 ms Software-Debounce.
- **Routing-Erkennung:** Erkennt Subnetz `10.x.x.x` (Hotspot) und schaltet direkt auf HTTPS (Tailscale Funnel) um. Im LAN wird die lokale IP genutzt.
- **OLED Display:** Zeigt Status (`ONLINE`, `STARTING`, `STOPPING`, `OFFLINE`), TPS, Spielerzahl, Ping und Heartbeat-Icon.

---

## 3. Benötigte Bibliotheken

In der Arduino IDE installieren:
- `Adafruit SSD1306`
- `Adafruit GFX Library`
- `ArduinoJson` (v6 oder v7)

---

## 4. Konfiguration & Flashen

1. [`MinecraftServerMonitor.ino`](MinecraftServerMonitor.ino) in Arduino IDE öffnen.
2. Zeilen 48–50 mit eigener Funnel-URL und WLAN anpassen:
   ```cpp
   const char* TAILSCALE_BASE_URL = "https://<tailnet-node>.ts.net";
   wifiMulti.addAP("WLAN_SSID", "WLAN_PASSWORT");
   ```
3. Board: **ESP32 Dev Module**.
4. Flashen per USB.

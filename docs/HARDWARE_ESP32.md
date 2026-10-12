# ESP32 Hardware Specification & Wiring Guide

Technische Dokumentation zur Bestückung, Verdrahtung und Inbetriebnahme des externen ESP32-Hardwarecontrollers für das Minecraft-Servermanagement.

---

## 1. Stückliste (BOM)

| Komponente | Anzahl | Spezifikation / Zweck |
| :--- | :--- | :--- |
| **ESP32 Dev Module** | 1 | ESP-WROOM-32 (30- oder 38-Pin), 2.4 GHz Wi-Fi & Dual-Core MCU |
| **0.96" I2C OLED Display** | 1 | SSD1306, 128x64 Pixel, I2C-Schnittstelle (Adresse 0x3C) |
| *Alternative:* **16x2 I2C LCD** | 1 | HD44780 mit PCF8574 I2C-Rucksack |
| **5mm LEDs** | 3 | 1x Grün, 1x Gelb, 1x Rot (Ampel-Statusanzeige) |
| **Vorwiderstände 330 Ω** | 3 | Strombegrenzung für Status-LEDs |
| **Kurzhubtaster (Buttons)** | 3 | 6x6mm Taster für Start-, Stop- und Backup-Auslösung |
| **Steckbrett & Jumper-Kabel** | - | Lötfreier Versuchsaufbau |

---

## 2. Pinbelegung & Schaltplan

```text
ESP32 Dev Board
┌──────────────────────────────────────┐
│ [EN]                            [D23]├─── Taster: BACKUP (GPIO 23 -> Taster -> GND)
│ [VP]                            [D22]├─── (Unbelegt)
│ [VN]                            [TX0]│
│ [D34]                           [RX0]│
│ [D35]                           [D21]│
│ [D32]                           [D19]├─── Taster: STOP   (GPIO 19 -> Taster -> GND)
│ [D33]                           [D18]├─── Taster: START  (GPIO 18 -> Taster -> GND)
│ [D25]─── I2C SCL (Display)       [D5]│
│ [D26]─── I2C SDA (Display)       [TX2]│
│ [D27]─── LED Grün  (TPS >= 19.5) [RX2]│
│ [D14]─── LED Gelb  (Warnung)     [D4]│
│ [D12]                           [D2]│
│ [D13]─── LED Rot   (Offline/Lag) [D15]│
│ [GND]─── Gemeinsame Masse       [GND]├─── Gemeinsame Masse
│ [VIN]─── 5V Versorgung          [3V3]├─── Display VCC (3.3V)
└──────────────────────────────────────┘
```

### Verdrahtungsdetails:

1. **SSD1306 OLED Display (I2C):**
   - `VCC` -> `ESP32 3V3`
   - `GND` -> `ESP32 GND`
   - `SDA` -> `ESP32 GPIO 26`
   - `SCL` -> `ESP32 GPIO 25`

2. **LED-Statusampel:**
   - `LED Grün (Anode +)` -> `330 Ω Vorwiderstand` -> `ESP32 GPIO 27`
   - `LED Gelb (Anode +)` -> `330 Ω Vorwiderstand` -> `ESP32 GPIO 14`
   - `LED Rot (Anode +)` -> `330 Ω Vorwiderstand` -> `ESP32 GPIO 13`
   - `Alle Kathoden (-)` -> `Gemeinsamer ESP32 GND`

3. **Taster (Hardware-Interrupts mit Software-Entprellung):**
   - Im Code konfiguriert als `INPUT_PULLUP` (schalten bei Betätigung gegen Masse).
   - `Start-Taster`: Zwischen `ESP32 GPIO 18` und `GND`.
   - `Stop-Taster`: Zwischen `ESP32 GPIO 19` und `GND`.
   - `Backup-Taster`: Zwischen `ESP32 GPIO 23` und `GND`.

---

## 3. Logik der Statusampel

| LED-Farbe | Auslösebedingung | Bedeutung |
| :--- | :--- | :--- |
| **Grün** | Server online UND `TPS >= 19.5` | Optimaler Betriebszustand (keine Tick-Verzögerung) |
| **Gelb** | Server bootet / stoppt ODER `17.0 <= TPS < 19.5` | Warnung: Lastspitze oder Statuswechsel |
| **Rot** | Server offline ODER `TPS < 17.0` | Kritischer Zustand: Server gestoppt oder schwerer Lag |

---

## 4. OLED Display Interface

```text
┌───────────────────────────────┐
│ MINECRAFT STATUS  [●] ONLINE  │
│ ───────────────────────────── │
│ TPS:   20.00 / 20.00  [GRÜN]  │
│ Spieler: 0 / 20               │
│ PING:  34 ms  [HOTSPOT]       │
└───────────────────────────────┘
```
- Heartbeat-Icon (`[●]` / `[○]`) signalisiert aktive Datenabrufe in der oberen rechten Ecke.
- Status-Badge zeigt `OFFLINE`, `STARTING`, `ONLINE` oder `STOPPING`.
- `[GRÜN]` / `[GELB]` / `[ROT! LAG]` Statusauswertung wird mit nativem CP437-Umlaut (`\x9a`) gerendert.
- Zweite Zeile zeigt die aktuelle Spielerzahl im Format `Spieler: <online> / <max>`.
- Netzwerk-Tag signalisiert direkte Tailscale Funnel HTTPS-Verbindung (`HOTSPOT`) oder lokales LAN (`LOCAL`).

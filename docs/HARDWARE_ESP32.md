# 📟 ESP32 Hardware Specification & Wiring Guide

Detailed technical documentation for assembling and wiring the external Minecraft IoT hardware monitor.

---

## 🧰 Component List (BOM)

| Component | Quantity | Purpose |
| :--- | :--- | :--- |
| **ESP32 Dev Module** (ESP-WROOM-32, 30 or 38-pin) | 1 | Microcontroller with 2.4 GHz Wi-Fi & Dual Core MCU |
| **0.96" I2C OLED Display** (SSD1306, 128x64) | 1 | Real-time display for TPS, RAM, Players, and State |
| *Alternative:* **16x2 I2C LCD Display** (HD44780 + PCF8574) | 1 | Optional 2-line textual display |
| **5mm LEDs** (1x Green, 1x Yellow, 1x Red) | 3 | Traffic light indicator for performance |
| **Resistors 330 Ω** | 3 | Current limiting resistors for LEDs |
| **Tactile Push Buttons** (6x6mm or momentary switches) | 3 | Start, Stop, and Backup triggers |
| **Breadboard / Perfboard & Jumper Wires** | - | Wiring & assembly |

---

## 🔌 Pinout & Wiring Table

```text
ESP32 Dev Board
┌──────────────────────────────────────┐
│ [EN]                            [D23]├─── Button: BACKUP (Pin 23 -> Button -> GND)
│ [VP]                            [D22]├─── (Unused)
│ [VN]                            [TX0]│
│ [D34]                           [RX0]│
│ [D35]                           [D21]│
│ [D32]                           [D19]├─── Button: STOP   (Pin 19 -> Button -> GND)
│ [D33]                           [D18]├─── Button: START  (Pin 18 -> Button -> GND)
│ [D25]─── I2C SCL (Display)       [D5]│
│ [D26]─── I2C SDA (Display)       [TX2]│
│ [D27]─── LED Gruen (TPS 20)      [RX2]│
│ [D14]─── LED Gelb  (Warnung)     [D4]│
│ [D12]                           [D2]│
│ [D13]─── LED Rot   (Offline)    [D15]│
│ [GND]─── Common GND             [GND]├─── Common GND
│ [VIN]─── 5V Power Supply        [3V3]├─── Display VCC (3.3V)
└──────────────────────────────────────┘
```

### Complete Circuit Connections:

1. **SSD1306 OLED Display (I2C):**
   - `VCC` $\rightarrow$ `ESP32 3V3`
   - `GND` $\rightarrow$ `ESP32 GND`
   - `SDA` $\rightarrow$ `ESP32 GPIO 26`
   - `SCL` $\rightarrow$ `ESP32 GPIO 25`

2. **LED Ampel (Traffic Light):**
   - `LED Grün (Anode +)` $\rightarrow$ `330 Ω Resistor` $\rightarrow$ `ESP32 GPIO 27`
   - `LED Gelb (Anode +)` $\rightarrow$ `330 Ω Resistor` $\rightarrow$ `ESP32 GPIO 14`
   - `LED Rot (Anode +)` $\rightarrow$ `330 Ω Resistor` $\rightarrow$ `ESP32 GPIO 13`
   - `Alle Kathoden (-)` $\rightarrow$ `Gemeinsamer ESP32 GND`

3. **Buttons (Taster):**
   - Configured in software as `INPUT_PULLUP`.
   - `Start Button`: Between `ESP32 GPIO 18` and `GND`.
   - `Stop Button`: Between `ESP32 GPIO 19` and `GND`.
   - `Backup Button`: Between `ESP32 GPIO 23` and `GND`.

---

## 🚦 Status Traffic Light Logic

| LED Color | Trigger Condition | Meaning |
| :--- | :--- | :--- |
| **Grün (Green)** | Server online AND `TPS >= 19.5` | Perfect performance (no tick delay) |
| **Gelb (Yellow)** | Booting up, shutting down, or `17.0 <= TPS < 19.5` | Caution: Under load or state transition |
| **Rot (Red)** | Server offline OR `TPS < 17.0` | Critical lag, crashed, or stopped |

---

## 🖥️ OLED Display Interface

```text
┌───────────────────────────────┐
│ MINECRAFT STATUS  [●] ONLINE  │
│ ───────────────────────────── │
│ TPS:   20.00 / 20.00          │
│ RAM:   48 %                   │
│ PLAY:  3 / 20                 │
│ PING:  34 ms  [HOTSPOT]       │
└───────────────────────────────┘
```
- Heartbeat icon (`[●]` / `[○]`) flashes in the top right corner during active polling.
- Status badge shows `OFFLINE`, `STARTING`, `ONLINE`, or `STOPPING`.
- Network tag indicates whether connection is routed through `LOCAL` or `HOTSPOT`.

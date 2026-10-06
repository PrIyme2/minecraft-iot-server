# ⚡ Laptop Server Tuning & CPU Performance Lock

Optimierungsskripte für Debian Linux, um einen Laptop als 24/7 dedizierten Minecraft-Server mit minimalen Tick-Latenzen (Tick Loop Jitter < 2ms) zu betreiben.

---

## ⚙️ Durchgeführte Optimierungen

1. **CPU Frequency Scaling & Governor:**
   - Setzt `scaling_governor` auf `performance`.
   - Setzt `scaling_min_freq` auf `4000000` (4.0 GHz Basistakt-Sperre).
   - Setzt `energy_performance_preference` auf `performance`.
2. **Intel P-State & Dynamic Boost:**
   - `min_perf_pct` auf `98` gesetzt.
   - `hwp_dynamic_boost` aktiviert.
3. **C-States Deaktivierung:**
   - Schaltet tiefe C-States (`state1` bis `state3`) ab, um Latenzverzögerungen beim Aufwachen der CPU-Kerne während Minecraft Tick-Phasen zu verhindern.
4. **Thermisches Profil & Lüfter:**
   - Setzt `/sys/firmware/acpi/platform_profile` auf `performance`.
   - Schaltet Lüfterkühlung auf kontinuierlich aktiv.
5. **Laptop-Betrieb bei geschlossenem Deckel (Lid Close):**
   - Verhindert Standby beim Schließen des Laptop-Deckels in `/etc/systemd/logind.conf`:
     ```ini
     HandleLidSwitch=ignore
     HandleLidSwitchExternalPower=ignore
     HandleLidSwitchDocked=ignore
     ```

---

## 🚀 Installation & Aktivierung

1. Skript kopieren und ausführbar machen:
   ```bash
   sudo cp set-cpu-performance.sh /usr/local/bin/
   sudo chmod +x /usr/local/bin/set-cpu-performance.sh
   ```

2. Systemd-Dienst installieren:
   ```bash
   sudo cp cpu-performance.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable --now cpu-performance.service
   ```

3. Taktfrequenzen prüfen:
   ```bash
   watch -n 1 "cat /proc/cpuinfo | grep 'MHz'"
   ```

# Laptop Server Tuning & CPU Performance Lock

Optimierungen für Debian Linux zum 24/7-Betrieb als dedizierter Minecraft-Server.

---

## 1. Optimierungen

- **CPU Governor:** `performance` mit 4,0 GHz Basistakt-Sperre (`scaling_min_freq=4000000`).
- **Intel P-State:** `min_perf_pct=98`, `hwp_dynamic_boost=1`.
- **C-States:** Tiefe C-States deaktiviert gegen Aufwach-Latenzen bei Tick-Phasen.
- **Kühlung:** ACPI Platform Profile auf `performance`.
- **Lid Close:** Kein Standby beim Schließen des Laptop-Deckels (`/etc/systemd/logind.conf`: `HandleLidSwitch=ignore`).

---

## 2. Installation

```bash
# 1. Skript kopieren und aktivieren
sudo cp set-cpu-performance.sh /usr/local/bin/
sudo chmod +x /usr/local/bin/set-cpu-performance.sh

# 2. Systemd-Dienst aktivieren
sudo cp cpu-performance.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now cpu-performance.service

# 3. Taktfrequenzen überwachen
watch -n 1 "cat /proc/cpuinfo | grep 'MHz'"
```

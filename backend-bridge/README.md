# Backend Control Bridge (`mc-control-service`)

Der **Minecraft Control Service** ist ein performanter, leichtgewichtiger HTTP-REST-Dienst auf Python-Basis. Er dient als Schnittstelle zwischen externen Steuerungen (ESP32-Hardware-Controller, Reviactyl Webpanel) und dem containerisierten Minecraft-Server.

---

## 1. Kernfunktionen

1. **Echtzeit-Metriken (`/api/status`):**
   - **TPS-Abfrage:** Parst TPS direkt über Minecraft RCON.
   - **Spielerzahlen:** Liest `online_players` und `max_players` über ein einzelnes RCON-Paket (Single-Socket Pipeline, Latenz < 100ms).
   - **RAM-Auslastung:** Liest direkt `/sys/fs/cgroup/system.slice/docker-*.scope/memory.current` (Latenz ca. 30ms statt 1500ms bei `docker stats`).
2. **Server-Steuerung:**
   - **`/start`:** Sendet einen Start-Befehl via Wings Agent API.
   - **`/stop`:** Fährt den Server sauber via RCON / Wings herunter.
   - **`/backup`:** Startet die Google Drive Backup Pipeline im Hintergrund (`/usr/local/bin/minecraft-backup`) mit Schutz vor parallelen Ausführungen (`409 Conflict`). Wird sowohl vom ESP32-Taster D23 als auch vom Reviactyl Webpanel (`Create Backup`) aufgerufen.
   - **`/status`:** Gibt den einfachen Container-Status (`true`/`false`) zurück.

---

## 2. API Endpunkte

| Endpunkt | Methode | Rückgabe | Beschreibung |
| :--- | :--- | :--- | :--- |
| `/api/status` | `GET` | `application/json` | JSON-Objekt: `{"online": bool, "tps": float, "players": int, "max_players": int, "ram_pct": int}` |
| `/status` | `GET` | `text/plain` | `true` oder `false` |
| `/start` | `GET` | `text/plain` | `OK: STARTED` |
| `/stop` | `GET` | `text/plain` | `OK: STOPPING` |
| `/backup` | `GET` | `text/plain` | `OK: BACKUP_STARTED` oder `BUSY: BACKUP_ALREADY_RUNNING` |

---

## 3. Installation & Einrichtung

1. Skript nach `/usr/local/bin/mc-control-service.py` kopieren:
   ```bash
   sudo cp mc-control-service.py /usr/local/bin/
   sudo chmod +x /usr/local/bin/mc-control-service.py
   ```

2. Systemd-Dienst aktivieren und starten:
   ```bash
   sudo cp mc-control.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable --now mc-control.service
   ```

3. Status überprüfen:
   ```bash
   systemctl status mc-control.service
   curl http://127.0.0.1:5000/api/status
   ```

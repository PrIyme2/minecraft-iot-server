# 🔌 Backend Control Bridge (`mc-control-service`)

Der **Minecraft Control Service** ist ein extrem performanter, leichtgewichtiger HTTP-REST-Dienst auf Python-Basis. Er dient als sichere Schnittstelle zwischen dem externen ESP32-Hardware-Controller und dem containerisierten Minecraft-Server.

---

## 🚀 Kernfunktionen

1. **Echtzeit-Metriken (`/api/status`):**
   - **TPS-Abfrage:** Parst TPS direkt über Minecraft RCON.
   - **Spielerzahlen:** Liest `online_players` und `max_players` über ein einzelnes RCON-Paket (Single-Socket Pipeline, Latenz < 100ms).
   - **RAM-Auslastung:** Liest direkt `/sys/fs/cgroup/system.slice/docker-*.scope/memory.current` (Latenz ca. 30ms statt 1500ms bei `docker stats`).
2. **Server-Steuerung:**
   - **`/start`:** Sendet einen Start-Befehl via Pterodactyl Wings Agent API (Fallback: `docker start`).
   - **`/stop`:** Fährt den Server sauber via Agent/RCON herunter (Fallback: `docker stop -t 10`).
   - **`/backup`:** Startet die Google Drive Backup Pipeline im Hintergrund (`/usr/local/bin/minecraft-backup`) mit Schutz vor parallelen Ausführungen (`409 Conflict`).
   - **`/status`:** Gibt den einfachen Container-Status (`true`/`false`) zurück.

---

## 📡 API Endpunkte

| Endpunkt | Methode | Rückgabe | Beschreibung |
| :--- | :--- | :--- | :--- |
| `/api/status` | `GET` | `application/json` | JSON-Objekt: `{"online": bool, "tps": float, "players": int, "max_players": int, "ram_pct": int}` |
| `/status` | `GET` | `text/plain` | `true` oder `false` |
| `/start` | `GET` | `text/plain` | `OK: STARTED` |
| `/stop` | `GET` | `text/plain` | `OK: STOPPING` |
| `/backup` | `GET` | `text/plain` | `OK: BACKUP_STARTED` oder `BUSY: BACKUP_ALREADY_RUNNING` |

---

## 🛠️ Installation & Einrichtung

1. Skript nach `/usr/local/bin/mc-control-service.py` kopieren:
   ```bash
   sudo cp mc-control-service.py /usr/local/bin/
   sudo chmod +x /usr/local/bin/mc-control-service.py
   ```

2. Konfiguration anlegen (optional via `/etc/default/mc-control`):
   ```bash
   sudo cp .env.example /etc/default/mc-control
   sudo nano /etc/default/mc-control
   ```

3. Systemd-Dienst aktivieren und starten:
   ```bash
   sudo cp mc-control.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable --now mc-control.service
   ```

4. Status überprüfen:
   ```bash
   systemctl status mc-control.service
   curl http://127.0.0.1:5000/api/status
   ```

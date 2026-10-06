# 📋 Vollständiger Lagebericht: Minecraft Infrastructure & IoT Hardware Ecosystem

**Projekt:** Containerisierte Minecraft Server-Infrastruktur mit Cloud-Backup-Pipeline, Echtzeit-Monitoring, Discord-Alerting & externem ESP32-IoT-Hardwarecontroller  
**Datum & Uhrzeit:** 03. Oktober 2026, 15:42 Uhr  
**Gesamtstatus:** 🟢 **100 % BETRIEBSBEREIT & VOLL FUNKTIONSFÄHIG**

---

## 1. Executive Summary & Projektziel

Das Projekt realisiert eine professionelle, mehrschichtige IT-Infrastruktur für Game-Server-Hosting, Disaster Recovery, Performance-Monitoring und physische IoT-Fernsteuerung. Es kombiniert moderne DevOps-Konzepte (Docker, Systemd, Cgroups, REST-APIs), Datensicherheit (GPG AES-256, Cloud-Synchronisation via Rclone), Zero-Trust-Netzwerkarchitektur (Tailscale Mesh & TLS-Funnel) und Embedded Systems (ESP32-C/C++ mit Interrupt-Steuerung, I2C-Display und Hardware-Ampel).

---

## 2. Detaillierter Status aller Teilsysteme

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 LAPTOP (Debian 13 Linux)                               │
│                                                                                        │
│  ┌────────────────────────┐  ┌────────────────────────┐  ┌──────────────────────────┐  │
│  │   Pterodactyl Panel    │  │  MariaDB SQL & Redis   │  │   CPU Performance Svc    │  │
│  │ Nginx (Port 80) & PHP  │  │   Datenbank & Cache    │  │ Governor: ~3.9 GHz Turbo │  │
│  └───────────┬────────────┘  └───────────┬────────────┘  └──────────────────────────┘  │
│              │                           │                                             │
│              ▼                           ▼                                             │
│  ┌────────────────────────────────────────────────────┐  ┌──────────────────────────┐  │
│  │        Docker: Purpur Minecraft Server 1.21        │  │ Automated Cloud Backup   │  │
│  │  Port 25565 (Game) | Port 25566 (RCON Management)  │  │ RCON Flush + GPG AES-256 │  │
│  └───────────────────────┬────────────────────────────┘  │ Rclone -> Google Drive   │  │
│                          │                               └──────────────────────────┘  │
│                          ▼                                                             │
│  ┌────────────────────────────────────────────────────┐  ┌──────────────────────────┐  │
│  │    mc-control-service.py (Systemd / Port 5000)     │  │ Discord Perf-Monitor     │  │
│  │  Single-Socket RCON | Fast Cgroups RAM (30ms)      │  │ TPS, RAM & Crash Daemon  │  │
│  └───────────────────────┬────────────────────────────┘  └──────────────────────────┘  │
│                          │                                                             │
│                          ▼                                                             │
│  ┌────────────────────────────────────────────────────┐                                │
│  │ Tailscale Funnel: https://prime.tail923f91.ts.net  │                                │
│  │ Let's Encrypt TLS | Zero Port-Forwarding / CGNAT   │                                │
│  └───────────────────────┬────────────────────────────┘                                │
└──────────────────────────┼─────────────────────────────────────────────────────────────┘
                           │ Weltweites HTTPS (Internet / Mobilfunk)
                           ▼
              ┌──────────────────────────┐
              │   Handy-Hotspot: "test"  │
              │     (2.4 GHz / WPA2)     │
              └────────────┬─────────────┘
                           │ Lokales WLAN (IP: 10.29.104.115)
                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              ESP32 HARDWARE-MONITOR & CONTROLLER                       │
│                                                                                        │
│   [OLED 128x64]            [3-Stufen LED-Ampel]           [3x Hardware-Taster]         │
│   • Titelleiste + Pulse    • Grün:  TPS >= 19.5           • Pin 18: Server Start       │
│   • Status-Badge           • Gelb:  16.0 <= TPS < 19.5    • Pin 19: Server Stop        │
│   • Spieler, RAM, Ping     • Rot:   TPS < 16 oder Offline • Pin 23: Drive Backup       │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Schicht 1: Host-System & Hardware-Tuning (ThinkBook 14 G2 ITL)
* **Betriebssystem:** Debian GNU/Linux 13 (Trixie), Kernel 6.12 x86_64.
* **Prozessor & Taktung:**
  * Intel Core i5 (11. Gen) mit aktivem Intel Turbo Boost.
  * Eigener Systemd-Dienst `cpu-performance.service` und Skript `/usr/local/bin/set-cpu-performance.sh`.
  * CPU-Governor ist fest auf **`performance`** gesetzt; Taktraten arbeiten stabil bei **~3.89 – 4.0 GHz**.
* **Headless- & Dauerbetrieb:**
  * Systemd Sleep- und Suspend-Targets wurden deaktiviert (`sleep.target`, `suspend.target`, `hibernate.target` -> `/dev/null`).
  * Der Laptop kann mit **zugeklapptem Display** 24/7 betrieben werden, ohne in den Ruhezustand zu wechseln oder die Verbindung zu kappen.
* **Akku- & Energiestatus:** Akku bei **96 %**; Netzbetrieb aktiv.

---

### Schicht 2: Game-Server & Virtualisierung (Docker & Pterodactyl)
* **Container-Instanz:** `15978df8-7342-4713-8d50-3f15de6cc95d` auf Basis von `ghcr.io/reviactyl/images:java_25`.
* **Server-Core:** **Purpur 1.21.x** (hochoptimierter Paper/Spigot-Fork).
* **Ports & Netzwerk:**
  * Game-Port: `25565/TCP+UDP`
  * RCON-Management: `25566/TCP` (Passwort in `server.properties` gesichert)
* **Management-Panel:**
  * **Nginx** Webserver (`pterodactyl.conf`) auf Port 80.
  * **Pterodactyl Panel** (`/var/www/pterodactyl`) mit PHP 8.x und MariaDB SQL-Datenbank.
  * **Pterodactyl Agent / Wings** (`agent.service` auf Port 8080) für containerisierte Prozesssteuerung.
  * **Redis** In-Memory-Cache aktiv für Session- und Queue-Verwaltung.

---

### Schicht 3: Automatisierte Backup- & Disaster-Recovery-Pipeline
* **Speicherort:** `/home/prime/minecraft-backup/`
* **Kernfunktionen (`backup.sh`):**
  1. **RCON-Live-Flush:** Sendet vor dem Archivieren `save-off`, `save-all flush` und danach `save-on`, um Speicherzustände ohne Serverneustart absolut konsistent auf die SSD zu schreiben.
  2. **MariaDB SQL-Dump:** Sichert parallel die Panel- und Server-Datenbanken (`mysqldump`).
  3. **GPG AES-256 Verschlüsselung:** Alle Archive werden vor dem Verlassen des Rechners symmetrisch verschlüsselt (`.tar.gz.gpg`).
  4. **Google Drive Cloud-Upload:** Vollautomatische Synchronisation via `rclone` in den Cloud-Ordner `gdrive:minecraft-backups/`.
  5. **Retention-Policy:** Automatische Bereinigung alter Backups (lokal 7 Tage, Google Drive 30 Tage Aufbewahrung).
  6. **Discord-Webhook:** Sendet Erfolgs- oder Fehlerberichte mit Größe, Dauer und Zeitstempel direkt in den Discord-Kanal.
* **Automatisierung:** Nativer Systemd-Timer (`minecraft-backup.timer`), der täglich um **03:30 Uhr** auslöst.
* **Disaster-Recovery (`restore.sh`):** Ermöglicht Ein-Klick-Wiederherstellung von Welten und Datenbanken direkt aus Google Drive oder lokalem Staging.

---

### Schicht 4: Performance-Monitoring & Alerting Daemon
* **Speicherort:** `/home/prime/minecraft-monitor/`
* **Dienst:** `mc-perf-monitor.service` (dauerhaft aktiv)
* **Überwachung (`mc-perf-monitor.py`):**
  * Kontinuierliche Abfrage der 5s-, 1m- und 5m-TPS-Werte über RCON.
  * Auslesen des Docker-Container-Speichers und der CPU-Last.
  * Crash-Detection: Erkennt unvorhergesehenes Beenden des Containers in Echtzeit.
  * Discord-Alerts bei TPS-Drops unter 17.0 bzw. 14.0 TPS mit 10-Minuten-Cooldown zur Vermeidung von Benachrichtigungs-Spam.

---

### Schicht 5: REST-API-Bridge & Steuerungsdienst
* **Datei:** `/usr/local/bin/mc-control-service.py`
* **Dienst:** `mc-control.service` auf Port **5000**
* **Endpunkte:**
  * `GET /api/status`: Liefert konsolidiertes JSON (`online`, `tps`, `players`, `max_players`, `ram_pct`).
  * `GET /start`: Startet den Server via Pterodactyl-Power-API (Fallback: Docker CLI).
  * `GET /stop`: Fährt den Server sauber herunter.
  * `GET /backup`: Triggert sofort ein Cloud-Backup im Hintergrund.
* **High-Speed-Optimierungen:**
  * **Cgroups-RAM-Read:** Liest `/sys/fs/cgroup/.../memory.current` in nur **30 ms** (zuvor über 1,7 s mit `docker stats`).
  * **Single-Socket RCON:** `tps` und `list` werden in einer einzigen RCON-Session abgefragt.
  * **Last-Cache (`cached_metrics`):** Verhindert, dass RCON bei künstlich erzeugtem Serverlag in Timeouts läuft oder auf 20.0 zurückspringt.

---

### Schicht 6: Zero-Trust Remote-Vernetzung (Tailscale Funnel)
* **Funnel-URL:** `https://prime.tail923f91.ts.net/`
* **Verschlüsselung:** Öffentliches Let's-Encrypt-TLS-Zertifikat.
* **Routing:** Tailscale leitet eingehende weltweite HTTPS-Pakete an `127.0.0.1:5000` weiter.
* **Bedeutung:**
  * Das System benötigt **keinerlei Port-Forwarding** an Heim- oder Schul-Routern.
  * Funktioniert hinter restriktiven Firewalls, Proxy-Servern und Mobilfunk-NAT (CGNAT).

---

### Schicht 7: IoT-Hardwarecontroller & Monitor (ESP32)
* **Quellcode:** `/home/prime/Arduino/MinecraftServerMonitor/MinecraftServerMonitor.ino`
* **Hardware-Pins:**
  * **OLED-Display (SSD1306 128x64):** I2C SDA = GPIO 26, SCL = GPIO 25.
  * **Ampel-LEDs:** Grün = GPIO 27, Gelb = GPIO 14, Rot = GPIO 13.
  * **Taster:** Start = GPIO 18, Stop = GPIO 19, Backup = GPIO 23 (mit Hardware-Interrupts & Software-Debounce).
* **Netzwerkanbindung:**
  * Exklusiv angebunden an den mobilen Handy-Hotspot auf **2,4 GHz**.
  * Aktuelle zugewiesene Hotspot-IP: **`10.29.104.115`**.
  * Ruft Serverdaten weltweit über Tailscale Funnel HTTPS (`https://prime.tail923f91.ts.net/api/status`) ab.
* **Synchronisierte Ampel- und Display-Logik:**
  * **Optimal (>= 19.5 TPS):** Grüne LED an | Display: `[ OK ] ONLINE` | `TPS: 20.0 [GRUEN]`
  * **Mittellast (16.0 – 19.4 TPS):** Gelbe LED an | Display: `[WARN] MODERAT` | `TPS: XX.X [GELB]`
  * **Schwerer Lag (< 16.0 TPS):** Rote LED an | Display: `[LAG] SEHR LANGSAM` | `TPS: XX.X [ROT! LAG]`
  * **Booting / Stoppen:** Gelbe LED an | Fortschrittsbalken & Statusmeldung.
  * **Server Offline:** Rote LED an | Display: `! OFFLINE ! -> SERVER STARTEN (D18)`.
  * **WLAN verloren:** Display zeigt sofort Hinweis: `! KEIN WLAN ! Handy: Kompatibilitaet (2.4 GHz) aktivieren`.

---

## 3. Übersicht aller aktiven Dienste (Systemd Audit)

| Dienst | Einheit | Status | Beschreibung |
| :--- | :--- | :--- | :--- |
| **mc-control** | `mc-control.service` | 🟢 `active (running)` | REST-API Port 5000 & ESP32-Bridge |
| **mc-perf-monitor** | `mc-perf-monitor.service` | 🟢 `active (running)` | Live-Überwachung & Discord-Alerting |
| **agent (Wings)** | `agent.service` | 🟢 `active (running)` | Pterodactyl Container Daemon (Port 8080) |
| **pteroq** | `pteroq.service` | 🟢 `active (running)` | Pterodactyl Hintergrund-Warteschlange |
| **mariadb** | `mariadb.service` | 🟢 `active (running)` | SQL-Datenbank für Pterodactyl & Plugins |
| **redis** | `redis-server.service` | 🟢 `active (running)` | In-Memory Key-Value Store |
| **nginx** | `nginx.service` | 🟢 `active (running)` | Webserver für Pterodactyl Panel (Port 80) |
| **tailscaled** | `tailscaled.service` | 🟢 `active (running)` | Mesh-VPN & Funnel HTTPS Reverse Proxy |
| **cpu-performance**| `cpu-performance.service` | 🟢 `active (exited)` | 4 GHz Performance CPU-Governor |
| **mc-backup** | `minecraft-backup.timer` | 🟢 `active (waiting)` | Täglicher Cloud-Backup-Timer (03:30 Uhr) |

---

## 4. Fazit & Bereitschaft

Alle Teilsysteme von der Hardware-Ebene über das Betriebssystem, die Container-Virtualisierung, die Cloud-Pipeline bis hin zur mobilen IoT-Steuerung sind **vollständig eingerichtet, im Dauerbetrieb getestet und aufeinander abgestimmt**. 

Das Gesamtsystem kann jederzeit demonstriert werden.

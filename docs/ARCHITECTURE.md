# System Architecture & Technical Specifications

Übersicht über Architektur, Schnittstellen und Datenflüsse des Minecraft Server & IoT Ecosystems.

---

## 1. High-Level Architecture Diagram

Klicke auf eine Komponente im Diagramm oder nutze die [Tabelle](#direkte-links-zur-implementierung--installation) für den direkten Quellcode-Zugriff:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 LAPTOP (Debian 13 Linux)                               │
│                                                                                        │
│  ┌────────────────────────┐  ┌────────────────────────┐  ┌──────────────────────────┐  │
│  │   Pterodactyl Panel    │  │  MariaDB SQL & Redis   │  │   CPU Performance Svc    │  │
│  │ Nginx (Port 80) & PHP  │  │   Datenbank & Cache    │  │ Governor: ~4.0 GHz Turbo │  │
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
│  │ Tailscale Funnel: https://<tailnet-node>.ts.net    │                                │
│  │ Let's Encrypt TLS | Zero Port-Forwarding / CGNAT   │                                │
│  └───────────────────────┬────────────────────────────┘                                │
└──────────────────────────┼─────────────────────────────────────────────────────────────┘
                           │ Weltweites HTTPS (Internet / Mobilfunk)
                           ▼
              ┌──────────────────────────┐
              │    Mobiler 2.4 GHz AP    │
              │         (WPA2)           │
              └────────────┬─────────────┘
                           │ Mobilfunk WLAN (10.x.x.x)
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

### Direkte Links zur Implementierung & Installation

| Komponente | Quelldatei / Implementierung | Dokumentation & Installation | Kurzbeschreibung |
| :--- | :--- | :--- | :--- |
| **Installation (Gesamt)** | [`README.md`](../README.md#4-schritt-für-schritt-installationsanleitung) | [`README.md`](../README.md) | Schritt-für-Schritt Anleitung (Phasen 1–6) |
| **Panel (Pterodactyl)** | [`/var/www/pterodactyl`](../README.md#phase-2-reviactyl-panel--wings-daemon) | [`PTERODACTYL_REVERSE_PROXY.md`](./PTERODACTYL_REVERSE_PROXY.md) | Webinterface, Multi-Domain Reverse Proxy & Laravel Asset Fix |
| **Wings Daemon** | [`agent.service`](../README.md#phase-2-reviactyl-panel--wings-daemon) | [`PTERODACTYL_NODE_WEBSOCKET_PNA.md`](./PTERODACTYL_NODE_WEBSOCKET_PNA.md) | Container-Laufzeitumgebung & WebSocket Live-Konsole (:8080) |
| **Node FQDN Fix** | [`fix_node_fqdn.sql`](../backend-bridge/fix_node_fqdn.sql) | [`PTERODACTYL_NODE_WEBSOCKET_PNA.md`](./PTERODACTYL_NODE_WEBSOCKET_PNA.md) | SQL-Patch zur Behebung des roten Konsolen-Balkens |
| **Nginx VHost** | [`pterodactyl.conf.example`](../dns-bind9/nginx/pterodactyl.conf.example) | [`PTERODACTYL_REVERSE_PROXY.md`](./PTERODACTYL_REVERSE_PROXY.md) | Reverse Proxy VHost für Port 80, 443 & Funnel |
| **MCJars Extension** | [`mcjars-integration/`](../panel-extensions/mcjars-integration/) | [`panel-extensions/README.md`](../panel-extensions/README.md) | Panel Extension für 28 Minecraft Cores |
| **Modrinth Extension** | [`modrinth-plugin-installer/`](../panel-extensions/modrinth-plugin-installer/) | [`panel-extensions/README.md`](../panel-extensions/README.md) | 1-Klick Plugin Installer (Modrinth, Spigot, Hangar) |
| **ESP32 Firmware** | [`MinecraftServerMonitor.ino`](../esp32-firmware/MinecraftServerMonitor.ino) | [`esp32-firmware/README.md`](../esp32-firmware/README.md) | C++ Firmware für OLED, LEDs, WLAN & Taster |
| **Hardware Pinout** | [`HARDWARE_ESP32.md`](./HARDWARE_ESP32.md) | [`HARDWARE_ESP32.md`](./HARDWARE_ESP32.md) | GPIO-Belegung, Schaltplan und Entprellung |
| **REST Control Bridge** | [`mc-control-service.py`](../backend-bridge/mc-control-service.py) | [`backend-bridge/README.md`](../backend-bridge/README.md) | REST API für Serverstatus, Cgroups RAM & RCON |
| **Systemd Service** | [`mc-control.service`](../backend-bridge/mc-control.service) | [`backend-bridge/README.md`](../backend-bridge/README.md) | Daemon Unit File auf Port 5000 |
| **Split-View DNS** | [`named.conf.split-view.example`](../dns-bind9/named.conf.split-view.example) | [`dns-bind9/README.md`](../dns-bind9/README.md) | BIND9 Split-DNS für LAN und Tailscale |
| **Performance Daemon** | [`mc-perf-monitor.py`](../perf-monitoring/mc-perf-monitor.py) | [`perf-monitoring/README.md`](../perf-monitoring/README.md) | TPS- & Crash-Wächter mit Discord Alerts |
| **Backup Pipeline** | [`backup.sh`](../backup-pipeline/backup.sh) | [`backup-pipeline/README.md`](../backup-pipeline/README.md) | RCON Freeze, MariaDB Dump, GPG AES-256 Upload |
| **Google Drive Sync** | [`sync_gdrive_backups.py`](../backup-pipeline/sync_gdrive_backups.py) | [`BACKUP_PIPELINE.md`](./BACKUP_PIPELINE.md) | Automatischer Abgleich der Cloud-Backups mit der Panel-DB |
| **Disaster Recovery** | [`restore.sh`](../backup-pipeline/restore.sh) | [`backup-pipeline/README.md`](../backup-pipeline/README.md) | Entschlüsselung und Wiederherstellung von Welt & DB |
| **Discord Benachrichtigung**| [`send_discord.py`](../backup-pipeline/send_discord.py) | [`backup-pipeline/README.md`](../backup-pipeline/README.md) | Webhook Rich Embeds für Status & Fehler |
| **RCON CLI Client** | [`rcon_cli.py`](../backup-pipeline/rcon_cli.py) | [`backup-pipeline/README.md`](../backup-pipeline/README.md) | Python RCON-Client für Scripting |
| **CPU Performance Lock**| [`set-cpu-performance.sh`](../system-tuning/set-cpu-performance.sh) | [`system-tuning/README.md`](../system-tuning/README.md) | 4,0 GHz Governor Lock gegen Tick-Drops |
| **System Health Check** | [`healthcheck.sh`](../scripts/healthcheck.sh) | [`scripts/healthcheck.sh`](../scripts/healthcheck.sh) | 16-Punkte Diagnosetest für alle Komponenten |

---

## 2. Socket & Port Mapping

| Port | Protokoll | Service / Implementierung | Erreichbarkeit | Zweck |
| :--- | :--- | :--- | :--- | :--- |
| **22** | TCP | [OpenSSH Daemon](./TAILSCALE_SETUP.md) | Tailscale (`100.x.y.z`) & LAN | Fernwartung der Host-Konsole |
| **53** | UDP/TCP | [BIND9 DNS Server](../dns-bind9/named.conf.split-view.example) | Tailscale & LAN | Split-View DNS Auflösung (`server.priyme`) |
| **80** | TCP | [Panel & Nginx](../README.md#phase-2-reviactyl-panel--wings-daemon) | Alle Schnittstellen & Funnel | Webinterface & Reverse Proxy |
| **443** | TCP | [Nginx TLS / Funnel](./TAILSCALE_SETUP.md) | LAN & Tailscale Funnel | Verschlüsselter HTTPS Ingress mit Let's Encrypt |
| **2022** | TCP | [Wings SFTP](./PTERODACTYL_REVERSE_PROXY.md) | Alle Schnittstellen | Sicherer Dateiübertragungsdienst |
| **5000** | TCP | [`mc-control-service.py`](../backend-bridge/mc-control-service.py) | Localhost (Nginx Reverse Proxy) | REST API für Hardware-Controller & Webpanel |
| **8080** | TCP | [Wings Agent API](./PTERODACTYL_NODE_WEBSOCKET_PNA.md) | Alle Schnittstellen | WebSocket Live-Konsole & Node API |
| **25565** | TCP/UDP | [Minecraft Purpur Server](../scripts/healthcheck.sh) | Alle Schnittstellen (0.0.0.0) | Game Server Client Port |
| **25566** | TCP | [Minecraft RCON](../backup-pipeline/rcon_cli.py) | Localhost (127.0.0.1) | Schnelle Remote-Befehle für Bridge & Backups |

---

## 3. Datenflüsse & Protokolle

### 1. IoT Status-Loop
1. **Abfrage:** ESP32 pollt alle 2500 ms `/api/status` (Hotspot: Tailscale Funnel HTTPS, LAN: Direkt-IP `192.168.0.33`).
2. **Bridge:** [`mc-control-service.py`](../backend-bridge/mc-control-service.py) liest RAM via Cgroups v2 (<30 ms) und TPS/Spieler via Single-Socket RCON.
3. **Ausgabe:** ESP32 rendert SSD1306 OLED und setzt Ampel (Grün: TPS ≥ 19.5, Gelb: 15.0–19.4 / Backup, Rot: < 15 oder Offline).

### 2. Hardware-Taster
- **Start (GPIO 18):** POST an `/start` -> Wings Agent startet Container.
- **Stop (GPIO 19):** POST an `/stop` -> RCON `stop` und Container-Shutdown via Wings.
- **Backup (GPIO 23):** POST an `/backup` -> Startet [`backup.sh`](../backup-pipeline/backup.sh). Doppel-Klicks werden mit `409 Conflict` geblockt.

### 3. Panel & Extensions
- **Panel & Wings Setup:** Siehe [Installationsanleitung Phase 2](../README.md#phase-2-reviactyl-panel--wings-daemon).
- **Reverse Proxy & Ingress:** [PTERODACTYL_REVERSE_PROXY.md](./PTERODACTYL_REVERSE_PROXY.md) verhindert Mixed-Content unter Funnel.
- **Konsole & WebSocket:** [PTERODACTYL_NODE_WEBSOCKET_PNA.md](./PTERODACTYL_NODE_WEBSOCKET_PNA.md) mit SQL-Fix [`fix_node_fqdn.sql`](../backend-bridge/fix_node_fqdn.sql).
- **MCJars Extension:** ([`mcjars-integration/`](../panel-extensions/mcjars-integration/)) Core-Wechsel für 28 Versionen.
- **Modrinth Extension:** ([`modrinth-plugin-installer/`](../panel-extensions/modrinth-plugin-installer/)) 1-Klick Plugin-Installer.
- **Google Drive Sync:** ([`sync_gdrive_backups.py`](../backup-pipeline/sync_gdrive_backups.py)) Zeigt Drive-Backups im Panel und aktualisiert den Backup-Tab.

### 4. Backup Pipeline
1. **Freeze:** RCON `save-off` + `save-all flush` friert Chunks atomar ein.
2. **Dump:** `mysqldump` sichert die MariaDB-Datenbank.
3. **Crypto:** `tar.gz` Archiv + symmetrische GPG AES-256 Verschlüsselung.
4. **Upload:** Rclone lädt Archiv nach Google Drive (8 MB Chunks).
5. **Reaktivierung:** RCON `save-on` aktiviert Autosave wieder.
6. **Sync:** [`sync_gdrive_backups.py`](../backup-pipeline/sync_gdrive_backups.py) gleicht Drive-Backups mit der Panel-DB ab.
7. **Restore:** [`restore.sh`](../backup-pipeline/restore.sh) entschlüsselt und stellt Welt und DB wieder her.

# System Architecture & Technical Specifications

Detaillierte Dokumentation der mehrschichtigen Systemarchitektur, Datenflüsse und Schnittstellen des Minecraft Server & IoT Ecosystems.

---

## 1. High-Level Architecture Diagram

Klicke auf eine Komponente im Diagramm oder nutze die [Implementierungs- & Installations-Tabelle](#-direkte-links-zur-implementierung--installation), um direkt zum Quellcode bzw. zur Anleitung zu springen:

```mermaid
graph TD
    subgraph WAN ["Worldwide Access (Internet / 4G / 5G)"]
        UserPhone["Smartphone / Mobile Hotspot"]
        RemotePlayer["Remote Minecraft Client"]
    end

    subgraph Hardware ["IoT Hardware Controller"]
        ESP32["ESP32 Microcontroller"]
        OLED["SSD1306 128x64 OLED"]
        Ampel["3-Color Status LEDs (G/Y/R)"]
        Buttons["Hardware Taster (Start/Stop/Backup)"]
        ESP32 --> OLED
        ESP32 --> Ampel
        Buttons --> ESP32
    end

    subgraph Security ["Networking & Security Perimeter"]
        TailscaleMesh["Tailscale Mesh VPN (WireGuard)"]
        TailscaleFunnel["Tailscale Funnel (Public TLS Ingress)"]
        BindDNS["BIND9 DNS (Split-View & SRV)"]
    end

    subgraph Host ["Debian 13 Linux Host"]
        CPUOpt["CPU Governor (4.0 GHz Lock)"]

        subgraph CoreServices ["Backend & Daemons"]
            ControlBridge["mc-control-service.py (Port 5000 REST)"]
            PerfMonitor["mc-perf-monitor.py (Daemon)"]
            BackupService["Backup Pipeline (GPG AES-256)"]
            Panel["Reviactyl / Pterodactyl Panel (Nginx / PHP 8.3)"]
            MariaDB["MariaDB 10.x Database"]
        end

        subgraph Containers ["Docker Container Ecosystem"]
            Wings["Pterodactyl Wings Agent (Port 8080)"]
            MCServer["Purpur Minecraft 1.21.x Container\n(Port 25565 / RCON 25566)"]
        end
    end

    subgraph Cloud ["Cloud & Notification Services"]
        GDrive["Google Drive (Rclone Encrypted Storage)"]
        Discord["Discord Webhook (Rich Embed Alerts)"]
    end

    %% Connections
    ESP32 -->|"HTTPS Requests"| TailscaleFunnel
    TailscaleFunnel --> ControlBridge
    RemotePlayer --> BindDNS
    BindDNS --> TailscaleMesh
    TailscaleMesh --> MCServer

    ControlBridge -->|"RCON (TPS & Players)"| MCServer
    ControlBridge -->|"Cgroups RAM (30ms)"| MCServer
    ControlBridge -->|"Power Actions"| Wings
    ControlBridge -->|"Trigger Backup"| BackupService

    PerfMonitor -->|"RCON Polling"| MCServer
    PerfMonitor -->|"Alerts"| Discord

    BackupService -->|"RCON Save Lock"| MCServer
    BackupService -->|"mysqldump"| MariaDB
    BackupService -->|"Encrypted Upload"| GDrive
    BackupService -->|"Status Embeds"| Discord

    %% Clickable Links zur Implementierung & Installation auf GitHub
    click ESP32 href "../esp32-firmware/MinecraftServerMonitor.ino" "ESP32 Firmware Source"
    click Buttons href "./HARDWARE_ESP32.md" "Hardware Schaltung & Taster"
    click OLED href "./HARDWARE_ESP32.md" "OLED Display Spezifikation"
    click Ampel href "./HARDWARE_ESP32.md" "LED Ampel Pinout"
    click BindDNS href "../dns-bind9/named.conf.split-view.example" "BIND9 DNS Konfiguration"
    click TailscaleFunnel href "./TAILSCALE_SETUP.md" "Tailscale Funnel Setup"
    click TailscaleMesh href "./TAILSCALE_SETUP.md" "Tailscale Mesh VPN Setup"
    click CPUOpt href "../system-tuning/set-cpu-performance.sh" "CPU Performance Lock Script"
    click ControlBridge href "../backend-bridge/mc-control-service.py" "mc-control-service.py REST API"
    click PerfMonitor href "../perf-monitoring/mc-perf-monitor.py" "Performance Monitor Daemon"
    click BackupService href "../backup-pipeline/backup.sh" "Backup Pipeline Skript"
    click Panel href "../README.md#phase-2-reviactyl-panel--wings-daemon" "Pterodactyl / Reviactyl Panel Installation & Setup"
    click Wings href "./PTERODACTYL_NODE_WEBSOCKET_PNA.md" "Pterodactyl Wings Agent & WebSocket Setup"
    click MCServer href "../scripts/healthcheck.sh" "Minecraft Server Health Check"
    click GDrive href "../backup-pipeline/sync_gdrive_backups.py" "Google Drive Sync Engine"
    click Discord href "../backup-pipeline/send_discord.py" "Discord Webhook Script"
```

---

### Direkte Links zur Implementierung & Installation

Klicke auf eine Komponente, um direkt zum Quellcode bzw. zur Installationsanleitung im Repository zu gelangen:

| Komponente | Quelldatei / Implementierung | Dokumentation & Installation | Kurzbeschreibung |
| :--- | :--- | :--- | :--- |
| **Installationsanleitung (Gesamt)** | [`README.md`](../README.md#4-schritt-für-schritt-installationsanleitung) | [`README.md`](../README.md) | Vollständige Schritt-für-Schritt-Anleitung (Phasen 1–6) |
| **Pterodactyl / Reviactyl Panel** | [`/var/www/pterodactyl`](../README.md#phase-2-reviactyl-panel--wings-daemon) | [`PTERODACTYL_REVERSE_PROXY.md`](./PTERODACTYL_REVERSE_PROXY.md) | Webinterface, Multi-Domain Reverse Proxy & Laravel Asset Fix |
| **Pterodactyl Wings Agent** | [`agent.service`](../README.md#phase-2-reviactyl-panel--wings-daemon) | [`PTERODACTYL_NODE_WEBSOCKET_PNA.md`](./PTERODACTYL_NODE_WEBSOCKET_PNA.md) | Container-Laufzeitumgebung & WebSocket Live-Konsole (:8080) |
| **Pterodactyl Node FQDN Fix** | [`fix_node_fqdn.sql`](../backend-bridge/fix_node_fqdn.sql) | [`PTERODACTYL_NODE_WEBSOCKET_PNA.md`](./PTERODACTYL_NODE_WEBSOCKET_PNA.md) | SQL-Update zur Behebung des roten Verbindungsbalkens im Panel |
| **Pterodactyl Nginx VHost** | [`pterodactyl.conf.example`](../dns-bind9/nginx/pterodactyl.conf.example) | [`PTERODACTYL_REVERSE_PROXY.md`](./PTERODACTYL_REVERSE_PROXY.md) | Nginx Reverse Proxy VHost für Port 80, 443 & Funnel |
| **Reviactyl MCJars** | [`mcjars-integration/`](../panel-extensions/mcjars-integration/) | [`panel-extensions/README.md`](../panel-extensions/README.md) | Panel Extension für 28 Minecraft Server-Cores |
| **Reviactyl Modrinth** | [`modrinth-plugin-installer/`](../panel-extensions/modrinth-plugin-installer/) | [`panel-extensions/README.md`](../panel-extensions/README.md) | 1-Klick Installer für Modrinth, Spigot & Hangar Plugins |
| **ESP32 Firmware** | [`MinecraftServerMonitor.ino`](../esp32-firmware/MinecraftServerMonitor.ino) | [`esp32-firmware/README.md`](../esp32-firmware/README.md) | C++ Firmware für SSD1306 OLED, LEDs, WLAN & Hardware-Taster |
| **Hardware Pinout** | [`HARDWARE_ESP32.md`](./HARDWARE_ESP32.md) | [`HARDWARE_ESP32.md`](./HARDWARE_ESP32.md) | Pinbelegung (GPIOs), Schaltplan und Schaltungslogik |
| **REST Control Bridge** | [`mc-control-service.py`](../backend-bridge/mc-control-service.py) | [`backend-bridge/README.md`](../backend-bridge/README.md) | Leichtgewichtige REST API für Status, Cgroups RAM & RCON |
| **Systemd Bridge Service** | [`mc-control.service`](../backend-bridge/mc-control.service) | [`backend-bridge/README.md`](../backend-bridge/README.md) | Systemd Unit für den Hintergrunddienst auf Port 5000 |
| **Split-View DNS** | [`named.conf.split-view.example`](../dns-bind9/named.conf.split-view.example) | [`dns-bind9/README.md`](../dns-bind9/README.md) | BIND9 Split-DNS für dynamische Auflösung (LAN & Tailscale) |
| **Performance Daemon** | [`mc-perf-monitor.py`](../perf-monitoring/mc-perf-monitor.py) | [`perf-monitoring/README.md`](../perf-monitoring/README.md) | Tick-Rate- und TPS-Wächter mit Discord Webhook Alerts |
| **Backup Pipeline** | [`backup.sh`](../backup-pipeline/backup.sh) | [`backup-pipeline/README.md`](../backup-pipeline/README.md) | Atomarer RCON-Lock, MariaDB Dump, GPG AES-256 Verschlüsselung |
| **Google Drive Panel Sync**| [`sync_gdrive_backups.py`](../backup-pipeline/sync_gdrive_backups.py) | [`BACKUP_PIPELINE.md`](./BACKUP_PIPELINE.md) | Automatischer Abgleich der Google Drive Archive mit der Panel-DB |
| **Disaster Recovery** | [`restore.sh`](../backup-pipeline/restore.sh) | [`backup-pipeline/README.md`](../backup-pipeline/README.md) | Entschlüsselung und 1-Befehl-Wiederherstellung von Welt & DB |
| **Discord Benachrichtigung**| [`send_discord.py`](../backup-pipeline/send_discord.py) | [`backup-pipeline/README.md`](../backup-pipeline/README.md) | Webhook-Versand formatierter Embeds für Status & Fehler |
| **RCON CLI Client** | [`rcon_cli.py`](../backup-pipeline/rcon_cli.py) | [`backup-pipeline/README.md`](../backup-pipeline/README.md) | Eigenständige Python-RCON-Implementierung für Scripting |
| **CPU Performance Lock** | [`set-cpu-performance.sh`](../system-tuning/set-cpu-performance.sh) | [`system-tuning/README.md`](../system-tuning/README.md) | Governor-Fixierung auf 4,0 GHz gegen Latenzspitzen |
| **System Health Check** | [`healthcheck.sh`](../scripts/healthcheck.sh) | [`scripts/healthcheck.sh`](../scripts/healthcheck.sh) | 16-Punkte Prüfskript für Ports, DNS, Proxy & Container |

---

## 2. Socket & Port Mapping

| Port | Protokoll | Service / Implementierung | Erreichbarkeit | Zweck |
| :--- | :--- | :--- | :--- | :--- |
| **22** | TCP | [OpenSSH Daemon](./TAILSCALE_SETUP.md) | Tailscale (`100.x.y.z`) & LAN | Fernwartung der Host-Konsole |
| **53** | UDP/TCP | [BIND9 DNS Server](../dns-bind9/named.conf.split-view.example) | Tailscale & LAN | Split-View DNS Auflösung (`server.priyme`) |
| **80** | TCP | [Reviactyl / Pterodactyl Webpanel](../README.md#phase-2-reviactyl-panel--wings-daemon) & [Nginx](../dns-bind9/nginx/pterodactyl.conf.example) | Alle Schnittstellen & Funnel | Panel-Oberfläche & IoT Reverse Proxy |
| **443** | TCP | [Nginx TLS / Funnel Ingress](./TAILSCALE_SETUP.md) | LAN & Tailscale Funnel | Verschlüsselter HTTPS Ingress mit Let's Encrypt |
| **2022** | TCP | [Pterodactyl Wings SFTP Server](./PTERODACTYL_REVERSE_PROXY.md) | Alle Schnittstellen | Sicherer Datei-Upload/-Download für Server-Dateien |
| **5000** | TCP | [`mc-control-service.py`](../backend-bridge/mc-control-service.py) | Localhost (Nginx Reverse Proxy) | REST API für Hardware-Controller & Webpanel |
| **8080** | TCP | [Pterodactyl Wings Agent API](./PTERODACTYL_NODE_WEBSOCKET_PNA.md) | Alle Schnittstellen | WebSocket Live-Konsole & Node API |
| **25565** | TCP/UDP | [Minecraft Purpur Server](../scripts/healthcheck.sh) | Alle Schnittstellen (0.0.0.0) | Minecraft Game Client Port |
| **25566** | TCP | [Minecraft RCON](../backup-pipeline/rcon_cli.py) | Localhost (127.0.0.1) | Schnelle Remote-Befehle für Bridge & Backups |

---

## 3. Datenflüsse & Protokolle

### 1. IoT Monitoring & Control Loop
1. Der ESP32 verbindet sich mit dem vorkonfigurierten WLAN (siehe [`MinecraftServerMonitor.ino`](../esp32-firmware/MinecraftServerMonitor.ino)).
2. Alle 2500ms sendet er einen HTTP(S) GET Request an `/api/status`:
   - Befindet sich der ESP32 im Mobilfunknetz (`10.x.x.x`), routet er ohne TCP-Timeouts direkt über den Tailscale Funnel (`https://<host>.ts.net/api/status`).
   - Im lokalen Netzwerk nutzt er die direkte LAN-Adresse (`http://192.168.0.33/api/status`).
3. Die REST Control Bridge ([`mc-control-service.py`](../backend-bridge/mc-control-service.py)) verarbeitet `/api/status`:
   - Ermittelt den Container-RAM direkt über Linux Cgroups v2 (`/sys/fs/cgroup/system.slice/docker-*.scope/memory.current`) in unter 30ms.
   - Fragt TPS und aktive Spieler über eine gemultiplexte Single-Socket RCON-Verbindung ab.
   - Liefert kompaktes JSON zurück (`status`, `players`, `max_players`, `tps`, `ram_used_mb`).
4. Der ESP32 aktualisiert das SSD1306 Display und steuert die LED-Ampel (Grün = TPS ≥ 19.5, Gelb = TPS 15.0–19.4 / Backup aktiv, Rot = TPS < 15 oder Server offline).

### 2. Hardware-Taster & Aktions-Steuerung
- **Start (GPIO 18):** Sendet POST an `/start` -> Bridge ruft Wings Agent `/api/servers/{id}/power` auf (Action: `start`).
- **Stop (GPIO 19):** Sendet POST an `/stop` -> Bridge führt RCON `stop` aus und beendet den Container sauber über Wings.
- **Backup (GPIO 23):** Sendet POST an `/backup` -> Bridge startet die Pipeline ([`backup.sh`](../backup-pipeline/backup.sh)) im Hintergrund. Doppelte Klicks werden mit `409 Conflict` geblockt.

### 3. Reviactyl / Pterodactyl Panel-Architektur & Installation
- **Installation & Bereitstellung:** Die Schritt-für-Schritt Installation des Webpanels und des Daemons ist dokumentiert in [README.md Phase 2](../README.md#phase-2-reviactyl-panel--wings-daemon).
- **Multi-Domain Reverse Proxy & Asset-Fix:** Konfiguriert in [PTERODACTYL_REVERSE_PROXY.md](./PTERODACTYL_REVERSE_PROXY.md) zur Vermeidung von Mixed-Content-Fehlern unter Tailscale Funnel.
- **WebSocket & Browser-PNA-Richtlinie:** Dokumentiert in [PTERODACTYL_NODE_WEBSOCKET_PNA.md](./PTERODACTYL_NODE_WEBSOCKET_PNA.md) mit dem SQL-Patch [`fix_node_fqdn.sql`](../backend-bridge/fix_node_fqdn.sql).
- **MCJars Integration:** ([`panel-extensions/mcjars-integration/`](../panel-extensions/mcjars-integration/)) Bindet sich in die Navigationsleiste des Servers ein und erlaubt das Umschalten zwischen 28 Server-Distributionen (Purpur, Paper, Velocity, Forge etc.) mit automatischem Core-Download.
- **Modrinth Plugin Installer:** ([`panel-extensions/modrinth-plugin-installer/`](../panel-extensions/modrinth-plugin-installer/)) Ermöglicht die direkte Installation von Plugins aus Modrinth, Spigot und Hangar in das Serververzeichnis `/plugins/`.
- **Google Drive Backup Sync:** ([`sync_gdrive_backups.py`](../backup-pipeline/sync_gdrive_backups.py)) Synchrone Anzeige aller verifizierten Minecraft-Backups aus Google Drive direkt im Webpanel, inklusive Status-Synchronisation für Backups, die über den Webpanel-Tab gestartet wurden.

### 4. Backup Pipeline & Datenkonsistenz
- RCON `save-off` gefolgt von `save-all flush` garantiert atomare Welt-Snapshots ohne inkonsistente Chunk-Grenzen.
- Hot-Dump der Panel-Datenbank via `mysqldump` in [`backup.sh`](../backup-pipeline/backup.sh).
- Archivierung und symmetrische clientseitige GPG-Verschlüsselung (AES-256).
- Rclone Upload nach Google Drive in 8 MB Chunks mit automatischer Quota-Absicherung.
- RCON `save-on` reaktiviert das automatische Speichern.
- [`sync_gdrive_backups.py`](../backup-pipeline/sync_gdrive_backups.py) gleicht Google Drive Archive mit der MariaDB-Tabelle `panel.backups` ab.
- Wiederherstellung erfolgt über [`restore.sh`](../backup-pipeline/restore.sh) mit vollständiger Entschlüsselung und automatischem Import.

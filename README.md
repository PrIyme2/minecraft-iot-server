# 🎮 Minecraft Infrastructure & IoT Hardware Ecosystem

[![Platform: Debian Linux](https://img.shields.io/badge/OS-Debian%2013-red.svg)](https://debian.org)
[![Minecraft: Purpur 1.21](https://img.shields.io/badge/Minecraft-Purpur%201.21.x-blue.svg)](https://purpurmc.org)
[![Hardware: ESP32](https://img.shields.io/badge/Hardware-ESP32-brightgreen.svg)](https://espressif.com)
[![Network: Tailscale WireGuard](https://img.shields.io/badge/VPN-Tailscale%20Mesh-blueviolet.svg)](https://tailscale.com)
[![Security: GPG AES-256](https://img.shields.io/badge/Encryption-GPG%20AES--256-orange.svg)](https://gnupg.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Eine professionelle, produktionsreife IT-Infrastruktur für Game-Server-Hosting, Disaster Recovery, Performance-Monitoring und physische IoT-Fernsteuerung über einen externen ESP32-Mikrocontroller.

Dieses Projekt vereint moderne **DevOps-Konzepte** (Docker, Systemd, Cgroups v2, REST-APIs), **Datensicherheit & Disaster Recovery** (GPG AES-256 Verschlüsselung, Cloud-Sync via Rclone), **Zero-Trust-Netzwerke** (Tailscale Mesh VPN & TLS Funnel, BIND9 Split-DNS) sowie **Embedded Systems** (ESP32 C/C++, Hardware-Interrupts, I2C-Display und LED-Ampel).

---

## 🏗️ Systemübersicht

```mermaid
graph TD
    subgraph Mobile ["Mobiles Netz / Schule / Unterwegs"]
        ESP["📟 ESP32 IoT Controller"]
        Hotspot["📱 Handy Hotspot / LTE"]
        ESP --> Hotspot
    end

    subgraph Mesh ["Zero-Trust VPN & Edge Ingress"]
        Funnel["🌍 Tailscale Funnel (HTTPS Ingress)"]
        MeshVPN["🔐 Tailscale Mesh (WireGuard P2P)"]
        SplitDNS["🌐 BIND9 Split-DNS (mc.server.priyme)"]
        Hotspot --> Funnel
    end

    subgraph ServerHost ["Debian 13 Linux Server (Laptop)"]
        Bridge["🔌 Backend Control Bridge (:5000)"]
        DockerMC["⛏️ Purpur Minecraft 1.21 Container"]
        Agent["🦅 Pterodactyl Wings Agent (:8080)"]
        Monitor["📊 Performance & Alert Daemon"]
        Backup["📦 Encrypted Backup Pipeline"]
        CPULock["⚡ 4.0 GHz Turbo & C-State Tuning"]

        Funnel --> Bridge
        Bridge --> Agent
        Bridge --> DockerMC
        Monitor --> DockerMC
        Backup --> DockerMC
    end

    subgraph CloudServices ["Cloud & Benachrichtigungen"]
        GDrive["☁️ Google Drive (GPG AES-256)"]
        Discord["💬 Discord Webhook (Rich Embeds)"]
        Backup --> GDrive
        Backup --> Discord
        Monitor --> Discord
    end
```

---

## 📁 Repository-Struktur

```text
minecraft-iot-server/
├── README.md                      # Gesamtdokumentation & Projektübersicht
├── .gitignore                     # Schutz vor Commits sensibler Dateien & Logs
├── docs/                          # Vertiefende technische Dokumentationen
│   ├── ARCHITECTURE.md            # Detaillierte Architektur, Datenflüsse & Protokolle
│   ├── HARDWARE_ESP32.md          # Schaltpläne, Pinouts, Entprellung & Display-Modi
│   ├── TAILSCALE_SETUP.md         # Zero-Trust VPN, Funnel Ingress & Split-DNS
│   ├── BACKUP_PIPELINE.md         # Save-Flush-Garantie, AES-256 & Disaster Recovery
│   └── LAGEBERICHT.md             # Vollständiger Systembericht und Komponentencheck
├── esp32-firmware/                # Embedded C++ Firmware für den ESP32
│   ├── MinecraftServerMonitor.ino # Hauptsketch (OLED/LCD, Taster, Ampel, WiFiMulti)
│   └── README.md                  # Flash-Anleitung, Libraries & Pinout-Tabelle
├── backend-bridge/                # REST-API Schnittstelle für den ESP32
│   ├── mc-control-service.py      # Python HTTP-Daemon (Cgroups RAM, RCON Pipeline)
│   ├── mc-control.service         # Systemd Unit File
│   ├── .env.example               # Konfigurationsvorlage (Container ID, Token, Ports)
│   └── README.md                  # API-Endpunkte, curl-Tests & Einrichtung
├── backup-pipeline/               # Disaster Recovery & Cloud Backup
│   ├── backup.sh                  # Haupt-Backupskript mit RCON-Lock & GPG-Verschlüsselung
│   ├── restore.sh                 # Interaktives Wiederherstellungsskript
│   ├── setup_rclone.sh            # Rclone Google Drive Einrichtungsassistent
│   ├── rcon_cli.py                # Zero-Dependency Python RCON Client
│   ├── send_discord.py            # Rich Discord Embed Notifier
│   ├── backup.conf.example        # Bereinigte Konfigurationsvorlage
│   ├── systemd/                   # Systemd Timer (täglich 03:30 Uhr) & Service
│   └── README.md                  # Backup-Optionen, Retention Policy & Dry-Run
├── perf-monitoring/               # Echtzeitüberwachung & Alerting
│   ├── mc-perf-monitor.py         # 20s Polling Daemon mit 5s/1m/5m TPS Durchschnitt
│   ├── monitor.conf.example       # Konfigurationsvorlage für Webhooks & Schwellwerte
│   ├── mc-perf-monitor.service    # Systemd Hintergrunddienst
│   └── README.md                  # Schwellwertkonfiguration & Cooldown-Logik
├── system-tuning/                 # Linux Host-Optimierung für Game-Server
│   ├── set-cpu-performance.sh     # Performance Governor, 4.0 GHz Lock, C-States Off
│   ├── cpu-performance.service    # Systemd Boot-Service
│   └── README.md                  # Laptop Server Setup (Lid-Close, Thermals)
└── dns-bind9/                     # Lokaler DNS & Split-DNS für weltweiten Zugriff
    ├── named.conf.local           # Zonen-Konfiguration
    ├── named.conf.options         # Interface- & Forwarder-Optionen
    ├── zones/                     # DNS-Zonendateien (A-Records, SRV-Records)
    └── nginx/                     # Pterodactyl Nginx Reverse-Proxy Vorlage
```

---

## 🌟 Hauptkomponenten im Detail

### 1. 📟 ESP32 IoT Hardware Controller
- **Anzeige:** SSD1306 0.96" OLED (128x64) oder HD44780 16x2 LCD Display.
- **Ampel:** 3-farbige LED-Ampel (Grün = TPS ≥ 19.5, Gelb = Booting/Warnung, Rot = Offline/Lag).
- **Steuerung:** 3 Taster (Start, Stop, Google Drive Backup) mit Hardware-Interrupts (`FALLING`) und 300ms Software-Entprellung.
- **Netzwerk:** Automatisches Roaming via `WiFiMulti` (Handy-Hotspot für unterwegs, lokales WLAN zuhause) mit automatischem Fallback zwischen lokalem HTTP (`:5000`) und weltweitem HTTPS Funnel.

### 2. 🔌 Backend Control Bridge (`mc-control-service`)
- Ultraschneller Cgroups v2 RAM-Reader (`/sys/fs/cgroup/.../memory.current`), Antwortzeit ca. **30 Millisekunden** (statt 1,5 Sekunden bei `docker stats`).
- Single-Socket RCON Multiplexing: Fragt TPS und Spielerzahlen über eine einzige TCP-Verbindung ab, um Socket-Timeouts zu eliminieren.
- Direkte Integration mit der Pterodactyl Wings Agent API für saubere Server-Power-Cycles.

### 3. 📦 Verschlüsselte Google Drive Backup Pipeline
- **Zero-Downtime Save-Flush:** Schützt Spielstände vor Chunk-Boundary-Tearing durch sequentielles `save-off` $\rightarrow$ `save-all flush` $\rightarrow$ `save-on`.
- **Datenbanksicherung:** Automatischer Hot-Dump der MariaDB Pterodactyl-Panel-Datenbanken (`mysqldump`).
- **GPG AES-256:** Clientseitige symmetrische Verschlüsselung vor dem Cloud-Upload.
- **Rclone Integration:** Direkter Upload nach Google Drive mit automatischer Retention Policy (5 lokale Backups, 14 Tage Cloud-Speicher).
- **Automatisierung:** Nativer Systemd-Timer jeden Tag um **03:30 Uhr**.

### 4. 📊 Performance-Monitoring & Discord-Alerting
- Kontinuierliche Überwachung von TPS, Container-RAM und Prozess-Status im 20-Sekunden-Takt.
- Rich Discord Embeds mit Schwellwert-Farbkodierung.
- Integrierter Spam-Schutz (Cooldown-Timer) und automatische Entwarnungen bei Erholung.

### 5. ⚡ Laptop Server Tuning & Turbo Lock
- Dauerhafte Sperre des Intel P-State Governor auf `performance` mit minimal 4.0 GHz.
- Deaktivierung tiefer CPU C-States (`state1`–`state3`), um Tick-Jitter bei niedriger Spielerlast zu verhindern.
- `systemd-logind` Anpassung für den 24/7 Betrieb bei zugeklapptem Laptop-Deckel.

---

## 🚀 Schnellstart (Quickstart)

### 1. Repository klonen & Konfigurationen vorbereiten
```bash
git clone https://github.com/DEIN-BENUTZERNAME/DEIN-REPONAME.git
cd DEIN-REPONAME

# Konfigurationsdateien aus Beispielen erstellen:
cp backend-bridge/.env.example /etc/default/mc-control
cp backup-pipeline/backup.conf.example backup-pipeline/backup.conf
cp perf-monitoring/monitor.conf.example perf-monitoring/monitor.conf
```

### 2. Backend Bridge starten
```bash
sudo cp backend-bridge/mc-control-service.py /usr/local/bin/
sudo cp backend-bridge/mc-control.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now mc-control.service
```

### 3. Monitoring & Backups aktivieren
```bash
# Backup-Timer aktivieren:
sudo cp backup-pipeline/systemd/* /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now minecraft-backup.timer

# Monitoring-Dienst aktivieren:
sudo cp perf-monitoring/mc-perf-monitor.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now mc-perf-monitor.service
```

### 4. ESP32 flashen
1. [`MinecraftServerMonitor.ino`](esp32-firmware/MinecraftServerMonitor.ino) in der Arduino IDE öffnen.
2. Bibliotheken (`Adafruit_SSD1306`, `Adafruit_GFX`, `ArduinoJson`) installieren.
3. WLAN-SSID und Tailscale-URL anpassen.
4. Auf das ESP32 Dev Board übertragen.

---

## 🔒 Sicherheitshinweis

Alle sensiblen Daten (Discord Webhooks, MariaDB-Passwörter, RCON-Passwörter, Tailscale-Funnel-Tokens und GPG-Passphrasen) wurden in Vorlagendateien (`.example`) ausgelagert. Die Datei `.gitignore` verhindert, dass echte Zugangsdaten versehentlich in Git-Repositories eingecheckt werden.

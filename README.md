# Minecraft IoT Infrastructure & Server Ecosystem

Debian-basiertes Minecraft-Hostsystem mit physischer ESP32-Hardwareüberwachung, BIND9 Split-DNS, Tailscale Zero-Trust, automatisierten GPG-Backups und Reviactyl-Webpanel.

---

## Inhaltsverzeichnis
1. [Systemarchitektur](#1-systemarchitektur)
2. [Netzwerk & Port-Übersicht](#2-netzwerk--port-übersicht)
3. [Voraussetzungen](#3-voraussetzungen)
4. [Schritt-für-Schritt Installation](#4-schritt-für-schritt-installation)
   - [Phase 1: Host-System & Pakete](#phase-1-host-system--pakete)
   - [Phase 2: Reviactyl Panel & Wings Daemon](#phase-2-reviactyl-panel--wings-daemon)
   - [Phase 3: Panel Custom Extensions](#phase-3-panel-custom-extensions)
   - [Phase 4: BIND9 Split-DNS & Tailscale](#phase-4-bind9-split-dns--tailscale)
   - [Phase 5: IoT REST-Bridge & ESP32 Firmware](#phase-5-iot-rest-bridge--esp32-firmware)
   - [Phase 6: Backup-Pipeline & Google Drive Sync](#phase-6-backup-pipeline--google-drive-sync)
5. [Systemdiagnose](#5-systemdiagnose)
6. [Repository-Struktur](#6-repository-struktur)

---

## 1. Systemarchitektur

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

**Direkte Komponenten-Links:**
- ESP32 Firmware: [`esp32-firmware/MinecraftServerMonitor.ino`](esp32-firmware/MinecraftServerMonitor.ino) & Pinout: [`docs/HARDWARE_ESP32.md`](docs/HARDWARE_ESP32.md)
- REST Control Bridge: [`backend-bridge/mc-control-service.py`](backend-bridge/mc-control-service.py) (:5000)
- Webpanel & Wings: [Phase 2](#phase-2-reviactyl-panel--wings-daemon) & [`docs/PTERODACTYL_REVERSE_PROXY.md`](docs/PTERODACTYL_REVERSE_PROXY.md)
- Extensions (MCJars & Modrinth): [`panel-extensions/README.md`](panel-extensions/README.md)
- Backup Pipeline: [`backup-pipeline/backup.sh`](backup-pipeline/backup.sh) & Drive Sync: [`backup-pipeline/sync_gdrive_backups.py`](backup-pipeline/sync_gdrive_backups.py)
- DNS & Tailscale: [`dns-bind9/README.md`](dns-bind9/README.md) & [`docs/TAILSCALE_SETUP.md`](docs/TAILSCALE_SETUP.md)

---

## 2. Netzwerk & Port-Übersicht

| Port | Protokoll | Dienst | Schnittstelle | Funktion |
| :--- | :--- | :--- | :--- | :--- |
| `22` | TCP | OpenSSH | Tailscale / LAN | Terminal-Fernwartung |
| `53` | UDP/TCP | BIND9 DNS | Tailscale / LAN | Split-View DNS (`server.priyme`) |
| `80` | TCP | Nginx Webserver | 0.0.0.0 / Funnel | Reverse Proxy für Panel & REST-API |
| `443` | TCP | Tailscale Funnel | Internet | Öffentlicher HTTPS-Endpunkt ohne Port-Forwarding |
| `2022` | TCP | Wings SFTP | 0.0.0.0 | Dateiübertragung für Server-Dateien |
| `5000` | TCP | `mc-control` | 127.0.0.1 | REST-API für Hardware-Controller |
| `8080` | TCP | Wings Agent | 0.0.0.0 | Pterodactyl WebSocket API & Container-Steuerung |
| `25565` | TCP/UDP | Minecraft (Purpur) | 0.0.0.0 | Game Client Port |
| `25566` | TCP | Minecraft RCON | 127.0.0.1 | Lokale Verwaltung (TPS, Spieler, Save-Lock) |

---

## 3. Voraussetzungen

> [!IMPORTANT]
> **Grundvoraussetzung:** Das **Reviactyl-Webpanel** (oder Pterodactyl v1.11+) muss auf dem Server installiert und betriebsbereit sein, bevor mit diesem Tutorial begonnen wird. Sämtliche Teilsysteme (Extensions, REST-Bridge, Node-Daemon und Google Drive Backup-Sync) setzen auf der Datenbank und der Verzeichnisstruktur von Reviactyl auf.
>
> Falls Reviactyl noch nicht installiert ist: Zuerst [Phase 2: Reviactyl Panel & Wings Daemon](#phase-2-reviactyl-panel--wings-daemon) durchführen!

- **Webpanel:** Betriebsbereites Reviactyl- bzw. Pterodactyl-Panel (`/var/www/pterodactyl`, MariaDB, Nginx, PHP 8.3 FPM, Wings Agent).
- **Host:** x86_64 PC/Server, mind. 4 Kerne, 8 GB RAM, Debian 12/13.
- **Hardware-Controller:** ESP32 DevKit, 0.96" SSD1306 OLED (I2C), 3x LEDs (G/Y/R), 3x 330Ω Widerstände, 3x Taster.
- **Accounts:** Tailscale-Account, Google-Konto für Drive-Backups.

---

## 4. Schritt-für-Schritt Installation

### Phase 1: Host-System & Pakete

```bash
# 1. Systempakete installieren
sudo apt update && sudo apt install -y curl wget git jq tar gzip unzip gnupg lsb-release ca-certificates bind9 bind9utils nginx mariadb-server rclone python3 python3-pip

# 2. Docker installieren
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER

# 3. Tailscale einrichten
curl -fsSL https://tailscale.com/install.sh | sudo sh
sudo tailscale up --operator=$USER
```

---

### Phase 2: Reviactyl Panel & Wings Daemon

Details: [docs/PTERODACTYL_REVERSE_PROXY.md](docs/PTERODACTYL_REVERSE_PROXY.md) und [docs/PTERODACTYL_NODE_WEBSOCKET_PNA.md](docs/PTERODACTYL_NODE_WEBSOCKET_PNA.md).

```bash
# 1. MariaDB Datenbank anlegen
sudo mariadb -e "CREATE DATABASE panel; CREATE USER 'pterodactyl'@'127.0.0.1' IDENTIFIED BY 'DEIN_SICHERES_PASSWORT'; GRANT ALL PRIVILEGES ON panel.* TO 'pterodactyl'@'127.0.0.1' WITH GRANT OPTION; FLUSH PRIVILEGES;"

# 2. Panel installieren
sudo mkdir -p /var/www/pterodactyl && cd /var/www/pterodactyl
sudo cp .env.example .env
sudo composer install --no-dev --optimize-autoloader
sudo php artisan key:generate --force
sudo php artisan p:environment:setup
sudo php artisan p:environment:database
sudo php artisan migrate --seed --force
sudo chown -R www-data:www-data /var/www/pterodactyl

# 3. Nginx Reverse Proxy aktivieren
sudo cp dns-bind9/nginx/pterodactyl.conf.example /etc/nginx/sites-available/pterodactyl.conf
sudo ln -s /etc/nginx/sites-available/pterodactyl.conf /etc/nginx/sites-enabled/
sudo systemctl restart nginx

# 4. Wings Daemon starten
sudo systemctl enable --now agent.service

# 5. Node-FQDN Patch gegen Konsolen-Verbindungsfehler
sudo mariadb < backend-bridge/fix_node_fqdn.sql
sudo systemctl restart agent.service
```

---

### Phase 3: Panel Custom Extensions

Dokumentation: [panel-extensions/README.md](panel-extensions/README.md).

```bash
# Extensions ins Panel kopieren
sudo cp -r panel-extensions/mcjars-integration /var/www/pterodactyl/extensions/
sudo cp -r panel-extensions/modrinth-plugin-installer /var/www/pterodactyl/extensions/
sudo chown -R www-data:www-data /var/www/pterodactyl/extensions/
sudo chmod -R 755 /var/www/pterodactyl/extensions/

# Panel Cache leeren
cd /var/www/pterodactyl
sudo -u www-data php artisan route:clear
sudo -u www-data php artisan config:clear
sudo -u www-data php artisan view:clear
```
- **MCJars:** Wechsel zwischen 28 Server-Cores (Purpur, Paper, Velocity etc.).
- **Modrinth:** 1-Klick Installer für Plugins (Modrinth, SpigotMC, Hangar).

---

### Phase 4: BIND9 Split-DNS & Tailscale

Details: [docs/TAILSCALE_SETUP.md](docs/TAILSCALE_SETUP.md) und [dns-bind9/README.md](dns-bind9/README.md).

```bash
# 1. BIND9 Zonen kopieren und starten
sudo cp dns-bind9/named.conf.options /etc/bind/
sudo cp -r dns-bind9/zones/* /etc/bind/
sudo systemctl restart named

# 2. Tailscale Funnel für ESP32 Ingress aktivieren
tailscale funnel --bg 443 on
```
- LAN-Clients (`192.168.0.0/24`) erhalten `192.168.0.33`.
- VPN-Clients (`100.64.0.0/10`) erhalten `100.111.45.61`.

---

### Phase 5: IoT REST-Bridge & ESP32 Firmware

Hardware-Schaltplan: [docs/HARDWARE_ESP32.md](docs/HARDWARE_ESP32.md).

```bash
# 1. REST Bridge Dienst aktivieren
sudo cp backend-bridge/mc-control-service.py /usr/local/bin/mc-control-service.py
sudo chmod +x /usr/local/bin/mc-control-service.py
sudo cp backend-bridge/mc-control.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now mc-control.service
```
2. **ESP32 flashen:**
   - Sketch [`esp32-firmware/MinecraftServerMonitor.ino`](esp32-firmware/MinecraftServerMonitor.ino) öffnen.
   - Tailscale Funnel URL und WLAN-Zugangsdaten anpassen.
   - Per Arduino IDE auf das Board laden (*ESP32 Dev Module*).

---

### Phase 6: Backup-Pipeline & Google Drive Sync

Details: [docs/BACKUP_PIPELINE.md](docs/BACKUP_PIPELINE.md) und [backup-pipeline/README.md](backup-pipeline/README.md).

```bash
# 1. Google Drive Remote anlegen
rclone config

# 2. Skripte kopieren
mkdir -p /home/prime/minecraft-backup
cp backup-pipeline/backup.sh /home/prime/minecraft-backup/
cp backup-pipeline/sync_gdrive_backups.py /home/prime/minecraft-backup/
cp backup-pipeline/backup.conf.example /home/prime/minecraft-backup/backup.conf
chmod +x /home/prime/minecraft-backup/*.sh /home/prime/minecraft-backup/*.py

# 3. Systemd Timer aktivieren
sudo cp backup-pipeline/systemd/minecraft-backup.service /etc/systemd/system/
sudo cp backup-pipeline/systemd/minecraft-backup.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now minecraft-backup.timer
sudo systemctl enable --now gdrive-backup-sync.timer
```

**Trigger-Möglichkeiten:**
- **Webpanel:** Im Tab **Backups** via `Create Backup`.
- **Hardware-Taster:** ESP32 GPIO 23 gegen GND (gelbe Status-LED).
- **Automatisch:** Täglich um 03:30 Uhr via Systemd-Timer.

---

## 5. Systemdiagnose

Automatischer 16-Punkte Test für Ports, Dienste, DNS, Proxy und Container:

```bash
./scripts/healthcheck.sh
```

---

## 6. Repository-Struktur

```text
minecraft-iot-server/
├── README.md                      # Zentrale Dokumentation & Bauanleitung
├── scripts/healthcheck.sh         # 16-Punkte Systemdiagnose
├── panel-extensions/              # Reviactyl Extensions (MCJars, Modrinth)
├── backend-bridge/                # REST API Bridge & Systemd Service
├── esp32-firmware/                # C++ Arduino Firmware für ESP32 Controller
├── backup-pipeline/               # GPG AES-256 Backup, Restore & Drive-Sync
├── dns-bind9/                     # Split-View DNS & Nginx VHost Konfiguration
├── perf-monitoring/               # TPS-Wächter & Discord Alerting Daemon
├── system-tuning/                 # CPU Governor (4.0 GHz Lock Script)
└── docs/                          # Architektur- & Setup-Spezifikationen
```

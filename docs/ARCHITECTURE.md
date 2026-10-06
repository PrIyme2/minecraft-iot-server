# 🏗️ System Architecture & Data Flow

This document details the multi-tiered architecture of the Minecraft Server & IoT Ecosystem.

---

## 📐 High-Level Architecture Diagram

```mermaid
graph TD
    subgraph WAN ["Worldwide Access (Internet / 4G / 5G)"]
        UserPhone["📱 Smartphone / Mobile Hotspot"]
        RemotePlayer["🎮 Remote Minecraft Client"]
    end

    subgraph Hardware ["IoT Hardware Controller"]
        ESP32["📟 ESP32 Microcontroller"]
        OLED["🖥️ SSD1306 128x64 OLED"]
        Ampel["🚦 3-Color Status LEDs (G/Y/R)"]
        Buttons["🔘 Hardware Buttons (Start/Stop/Backup)"]
        ESP32 --> OLED
        ESP32 --> Ampel
        Buttons --> ESP32
    end

    subgraph Security ["Networking & Security Perimeter"]
        TailscaleMesh["🔐 Tailscale Mesh VPN (WireGuard)"]
        TailscaleFunnel["🌍 Tailscale Funnel (Public TLS Ingress)"]
        BindDNS["🌐 BIND9 DNS (Split-DNS & SRV Records)"]
    end

    subgraph Host ["Debian 13 Linux Host"]
        CPUOpt["⚡ CPU Turbo & Governor (4.0 GHz Lock)"]

        subgraph CoreServices ["Backend & Daemons"]
            ControlBridge["🔌 mc-control-service.py (Port 5000 REST)"]
            PerfMonitor["📊 mc-perf-monitor.py (Daemon)"]
            BackupService["📦 Automated Backup Pipeline (GPG AES-256)"]
            PterodactylPanel["🕹️ Pterodactyl Panel (Nginx / PHP 8.3)"]
            MariaDB["🗄️ MariaDB 10.x Database"]
        end

        subgraph Containers ["Docker Container Ecosystem"]
            Wings["🦅 Pterodactyl Wings Agent (Port 8080)"]
            MCServer["⛏️ Purpur Minecraft 1.21.x Container\n(25565 Game / 25566 RCON)"]
        end
    end

    subgraph Cloud ["Cloud & Notification Services"]
        GDrive["☁️ Google Drive (Rclone Encrypted Storage)"]
        Discord["💬 Discord Webhook (Rich Embed Alerts)"]
    end

    %% Connections
    ESP32 -->|"HTTPS Requests"| TailscaleFunnel
    TailscaleFunnel --> ControlBridge
    RemotePlayer --> BindDNS
    BindDNS --> TailscaleMesh
    TailscaleMesh --> MCServer

    ControlBridge -->|"RCON Single-Socket (TPS & Players)"| MCServer
    ControlBridge -->|"Cgroups v2 RAM Reader (30ms)"| Containers
    ControlBridge -->|"Power Actions"| Wings
    ControlBridge -->|"Trigger Backup"| BackupService

    PerfMonitor -->|"Periodic RCON Poll & Health Check"| MCServer
    PerfMonitor -->|"Alert Embeds"| Discord

    BackupService -->|"RCON Save Lock & Flush"| MCServer
    BackupService -->|"mysqldump"| MariaDB
    BackupService -->|"Encrypted Upload"| GDrive
    BackupService -->|"Status Embeds"| Discord
```

---

## 🔄 Data Flows & Protocols

### 1. External Monitoring & Control Loop
1. The **ESP32** checks connectivity via `WiFiMulti`.
2. Every 2500ms, it dispatches an HTTP(S) GET request to `/api/status`:
   - If connected to the mobile hotspot, requests are routed securely via **Tailscale Funnel HTTPS** (`prime.tail923f91.ts.net`).
   - If connected to the local home network, requests hit the low-latency direct IP (`192.168.0.33:5000`).
3. The **Backend Control Bridge** handles `/api/status`:
   - Reads memory from `/sys/fs/cgroup/system.slice/docker-*.scope/memory.current` (bypassing slow `docker stats`).
   - Executes a single-socket dual-query RCON packet for `tps` and `list`.
   - Returns a lightweight JSON payload.
4. The ESP32 parses JSON using `ArduinoJson`, updates the OLED display, and sets the LED Ampel states.

### 2. Hardware Interrupt Actions
- **START Pressed:** ESP32 invokes `/start` $\rightarrow$ Control Bridge triggers Wings Agent `/api/servers/{id}/power` (action: `start`).
- **STOP Pressed:** ESP32 invokes `/stop` $\rightarrow$ Control Bridge triggers graceful RCON `stop` followed by Wings Agent shutdown.
- **BACKUP Pressed:** ESP32 invokes `/backup` $\rightarrow$ Control Bridge spawns `/usr/local/bin/minecraft-backup` in the background (returns `409 BUSY` if an existing backup is running).

### 3. Backup Pipeline & Consistency
- Executes `rcon save-off` and `rcon save-all flush` to ensure all chunks in memory are written to disk without tearing.
- Performs hot database dump (`mysqldump`) for Pterodactyl databases.
- Archives server directory with file exclusion filters.
- Encrypts archive using symmetric GPG (AES-256 cipher).
- Uploads encrypted bundle to Google Drive via Rclone.
- Executes `rcon save-on`.
- Cleans up older local files (retention: 5) and remote files (retention: 14 days).
- Posts completion embed to Discord.

### 4. Performance Monitoring & Alerting
- Continuously polls TPS, container RAM, and process state every 20 seconds.
- Automatically calculates 5s, 1m, and 5m rolling averages.
- Sends rich Discord embeds on threshold breach (Warn / Critical / Crash / Recovery) with a 10-minute cooldown timer.

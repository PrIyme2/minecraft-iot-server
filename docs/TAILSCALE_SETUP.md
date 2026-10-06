# 🌐 Tailscale Mesh VPN, Funnel & Remote Access Architecture

This document describes how the Minecraft server infrastructure achieves secure worldwide connectivity, remote SSH administration, and public HTTPS ingress without opening any ports on the local home router.

---

## 🔒 Zero-Trust Mesh Networking

Traditional server hosting requires forwarding ports (such as `25565` or `80`) on the router, exposing the home IP address to DDoS attacks, port scanners, and ISP routing changes.

Instead, this project utilizes **Tailscale** (built on the modern WireGuard protocol):
1. **P2P Encrypted Mesh:** All participating devices (laptop server, remote administration PCs, player clients) communicate over peer-to-peer WireGuard tunnels with 256-bit encryption.
2. **Stable Private IPs:** The server is assigned a deterministic `100.x.y.z` IP within the tailnet that never changes across network reboots or ISP reconnects.

---

## ⚡ Tailscale Funnel for Web & ESP32 Mobile Ingress

Microcontrollers like the ESP32 connecting via cellular 4G/5G hotspots cannot run a full native WireGuard stack comfortably due to memory limits and roaming complexity. Furthermore, remote browsers require trusted public TLS certificates.

To solve this, **Tailscale Funnel** is implemented on the host:
```bash
# Exposes the local Nginx webserver (Port 80) via Tailscale Funnel with automatic TLS:
tailscale funnel --bg 80
```
- Tailscale provisions an official Let's Encrypt TLS certificate for `prime.tail923f91.ts.net`.
- Ingress traffic hits Tailscale's global edge nodes and is securely proxied over WireGuard to the local machine on port 80.
- Nginx reverse-proxies `/api/status`, `/start`, `/stop`, `/backup`, `/status` to the Python bridge on port 5000, while serving Pterodactyl on `/`.
- The ESP32 can send standard HTTPS requests (`WiFiClientSecure`) to `https://prime.tail923f91.ts.net/api/status` from any cellular carrier.

---

## 🔑 Remote SSH Administration (Worldwide Access)

Port 22 is securely bound to the Tailscale interface (`tailscale0`), allowing full administrative shell access from anywhere without port-forwarding:

### 1. Connecting from PC / Laptop (Windows, macOS, Linux)
Ensure Tailscale is connected, then run:
```bash
ssh prime@100.111.45.61
# Or using MagicDNS hostname:
ssh prime@prime
```

### 2. Connecting from Mobile (iOS / Android)
1. Launch and connect the **Tailscale** app on the mobile device.
2. Open an SSH client app (e.g., **Termius**, **JuiceSSH**, or **Prompt**).
3. Connect to Host `100.111.45.61` on Port `22` with username `prime`.

---

## 🌍 BIND9 Split-DNS & Split-View Setup

To allow Minecraft players on Tailscale to connect with clean vanity domain names like `mc.server.priyme`:

1. **Local BIND9 Server:** Runs on the host (`named`), listening on `0.0.0.0:53`.
2. **Split-View Routing:**
   - Tailscale queries (`100.64.0.0/10`) resolve to `100.111.45.61`.
   - Local LAN queries resolve to `192.168.0.33`.
3. **Tailscale MagicDNS / Split-DNS:**
   - In Tailscale Admin Console -> DNS:
     - Add Nameserver -> Custom IP: `100.111.45.61`.
     - Enable "Restrict to search domain" -> `server.priyme`.
   - Result: Normal internet traffic uses regular DNS, while queries to `*.server.priyme` are resolved directly by the laptop server.

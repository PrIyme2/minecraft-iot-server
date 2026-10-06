# 🌐 Tailscale Mesh VPN, Funnel & DNS Architecture

This document describes how the Minecraft server infrastructure achieves secure, worldwide connectivity without opening ports on the local home router.

---

## 🔒 Zero-Trust Mesh Networking

Traditional server hosting requires forwarding ports (such as `25565` or `80`) on the router, exposing the home IP address to DDoS attacks, port scanners, and ISP routing changes.

Instead, this project utilizes **Tailscale** (built on the modern WireGuard protocol):
1. **P2P Encrypted Mesh:** All participating devices (laptop server, remote administration PCs, player clients) communicate over peer-to-peer WireGuard tunnels with 256-bit encryption.
2. **Stable Private IPs:** The server is assigned a deterministic `100.x.y.z` IP within the tailnet that never changes across network reboots or ISP reconnects.

---

## ⚡ Tailscale Funnel for ESP32 Mobile Ingress

Microcontrollers like the ESP32 connecting via cellular 4G/5G hotspots cannot run a full native WireGuard stack comfortably due to memory limits and roaming complexity.

To solve this, **Tailscale Funnel** was implemented on the host:
```bash
# Exposes the local mc-control-service (Port 5000) via Tailscale Funnel with automatic TLS:
tailscale funnel --bg 5000
```
- Tailscale provisions an official Let's Encrypt TLS certificate for `prime.tail923f91.ts.net`.
- Ingress traffic hits Tailscale's global edge nodes and is securely proxied over WireGuard to the local machine on port 5000.
- The ESP32 can send standard HTTPS requests (`WiFiClientSecure`) to `https://prime.tail923f91.ts.net/api/status` from any cellular carrier.

---

## 🌍 BIND9 Split-DNS Setup

To allow Minecraft players on Tailscale to connect with clean vanity domain names like `mc.server.lan` or `mc.server.priyme`:

1. **Local BIND9 Server:** Runs on the host (`named`), listening on `0.0.0.0:53`.
2. **Zone Records:**
   - A-Records mapping `mc`, `panel`, and `ns1` to the host's Tailscale IP (`100.111.45.61`).
   - SRV-Record `_minecraft._tcp.server.lan` pointing to port 25565.
3. **Tailscale MagicDNS / Split-DNS:**
   - In Tailscale Admin Console -> DNS:
     - Add Nameserver -> Custom IP: `100.111.45.61`.
     - Enable "Restrict to search domain" -> `server.lan` / `server.priyme`.
   - Result: Normal internet traffic uses regular DNS, while queries to `*.server.priyme` or `*.server.lan` are resolved directly by the laptop server.

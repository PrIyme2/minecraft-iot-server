# Tailscale Mesh VPN & Funnel Setup

Netzwerkanbindung für weltweiten Zugriff, Remote-SSH und HTTPS-Ingress ohne Port-Forwarding.

---

## 1. Tailscale Mesh VPN

- **Peer-to-Peer:** WireGuard-Verschlüsselung (256-Bit) zwischen allen Geräten.
- **Feste VPN-IP:** Host erhält feste IP im CGNAT-Bereich `100.64.0.0/10` (unabhängig von Router-Neustarts).

---

## 2. Tailscale Funnel (ESP32 Ingress)

Ermöglicht weltweiten HTTPS-Zugriff für den ESP32 und Browser:

```bash
# HTTPS-Traffic auf lokalen Nginx leiten:
tailscale funnel --bg 443 on
```
- Tailscale liefert automatisches Let's Encrypt TLS-Zertifikat für `https://<tailnet-node>.ts.net`.
- ESP32 ruft `/api/status` per HTTPS aus jedem Mobilfunknetz ab.
- Nginx leitet API-Aufrufe an `127.0.0.1:5000` weiter.

---

## 3. Remote-SSH

Verschlüsselter Shell-Zugriff von jedem Tailscale-Client:
```bash
ssh prime@<tailscale-ip>
```

---

## 4. BIND9 Split-DNS

Auflösung sprechender Domainnamen (`mc.server.priyme`, `panel.server.priyme`):
- **Tailscale-Clients (`100.64.0.0/10`):** Erhalten die VPN-IP des Hosts.
- **LAN-Clients (`192.168.0.0/24`):** Erhalten die lokale LAN-IP `192.168.0.33`.
- **Tailscale Admin-Konsole (DNS -> Nameservers):**
  - Custom Nameserver: `<tailscale-ip>`
  - Restricted Nameserver Domain: `server.priyme`

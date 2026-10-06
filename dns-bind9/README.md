# 🌐 BIND9 DNS & Split-DNS Konfiguration

Konfigurationsdateien für den lokalen BIND9-DNS-Server auf dem Debian-Host zur nahtlosen Domain-Auflösung sowohl im lokalen Heimnetz als auch weltweit über das Tailscale Mesh-VPN.

---

## 📌 Architektur & Funktionsweise

- **Forward Zones:**
  - `server.priyme` $\rightarrow$ Löst `mc.server.priyme` und `panel.server.priyme` auf.
  - `server.lan` $\rightarrow$ Lokale DNS-Zone für Spiel-Clients im Heimnetz.
- **SRV Records:**
  - Automatische Weiterleitung von Minecraft-Clients ohne manuelle Portangabe (`_minecraft._tcp.server.lan`).
- **Tailscale Split-DNS Integration:**
  - In der Tailscale Admin-Konsole wird der Host als Custom Nameserver (`100.x.y.z`) eingetragen mit "Restrict to search domain: `server.priyme` / `server.lan`".
  - Alle Clients im VPN-Mesh können direkt mit `mc.server.priyme` verbinden.

---

## 📁 Dateien

- `named.conf.local`: Zonen-Definitionen für BIND9.
- `named.conf.options`: Globale Optionen (Listen auf allen Interfaces, Upstream Forwarders 1.1.1.1 / 8.8.8.8).
- `zones/db.server.lan.example`: DNS-Zone mit A-Records und SRV-Record für Minecraft.
- `zones/db.server.priyme.example`: Primäre Forward-Zone.
- `nginx/pterodactyl.conf.example`: Nginx Reverse Proxy Konfiguration für Pterodactyl.

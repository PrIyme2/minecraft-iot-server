# 🌐 BIND9 DNS & Split-View Konfiguration

Konfigurationsdateien für den lokalen BIND9-DNS-Server auf dem Debian-Host zur nahtlosen Domain-Auflösung sowohl im lokalen Heimnetz als auch weltweit über das Tailscale Mesh-VPN.

---

## 📌 Architektur & Funktionsweise

- **Forward Zones:**
  - `server.priyme` $\rightarrow$ Löst `mc.server.priyme` und `panel.server.priyme` auf.
  - `server.lan` $\rightarrow$ Lokale DNS-Zone für Spiel-Clients im Heimnetz.
- **SRV Records:**
  - Automatische Weiterleitung von Minecraft-Clients ohne manuelle Portangabe (`_minecraft._tcp.server.priyme` / `_minecraft._tcp.server.lan`).
- **BIND9 Split-View Routing:**
  - BIND9 unterscheidet anhand von ACLs automatisch zwischen Anfragen aus dem lokalen Netz (`192.168.0.0/16`) und Anfragen über das Tailscale Mesh (`100.64.0.0/10`):
    - **Tailscale-Clients** erhalten die Tailscale-IP (`100.x.y.z`), sodass die Verbindung verschlüsselt von überall auf der Welt funktioniert.
    - **Lokale LAN-Clients** erhalten die Direkt-IP (`192.168.0.33`), wodurch 0ms Latenz und kein VPN-Overhead entsteht.

---

## 📁 Dateien

- `named.conf.split-view.example`: Konfiguration für BIND9-Views mit automatischer ACL-Erkennung.
- `named.conf.local`: Standard-Zonendefinitionen für das lokale Heimnetzwerk.
- `named.conf.options`: Globale Optionen (Listen auf allen Interfaces, Upstream Forwarders 1.1.1.1 / 8.8.8.8).
- `zones/db.server.lan.example`: DNS-Zone mit LAN-A-Records und SRV-Record für Minecraft.
- `zones/db.server.priyme.example`: Primäre Forward-Zone für lokales Netz.
- `zones/db.server.priyme.tailscale.example`: Forward-Zone für Tailscale-Clients.
- `zones/db.server.lan.tailscale.example`: LAN-Zone für Tailscale-Clients.
- `nginx/pterodactyl.conf.example`: Nginx Reverse Proxy Konfiguration für Pterodactyl.

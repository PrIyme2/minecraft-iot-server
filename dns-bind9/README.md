# BIND9 DNS & Split-View Konfiguration

Lokaler BIND9-DNS-Server für nahtlose Domain-Auflösung im Heimnetz und weltweit über Tailscale.

---

## 1. Split-View Routing

- **Tailscale-Clients (`100.64.0.0/10`):** Erhalten die VPN-IP (`100.111.45.61`) für verschlüsselten Fernzugriff.
- **Lokale LAN-Clients (`192.168.0.0/16`):** Erhalten die Direkt-IP (`192.168.0.33`) mit minimaler Latenz.
- **SRV Records:** Automatische Portweiterleitung für Minecraft-Clients ohne manuelle Portangabe (`25565`).

---

## 2. Dateien

- `named.conf.split-view.example`: BIND9-Views mit automatischer ACL-Erkennung.
- `named.conf.local`: Zonendefinitionen für das lokale Heimnetzwerk.
- `named.conf.options`: Globale Optionen und Upstream Forwarder (1.1.1.1 / 8.8.8.8).
- `zones/db.server.lan.example`: DNS-Zone mit LAN A- und SRV-Records.
- `zones/db.server.priyme.example`: Primäre Forward-Zone für lokales Netz.
- `zones/db.server.priyme.tailscale.example`: Forward-Zone für Tailscale-Clients.
- `zones/db.server.lan.tailscale.example`: LAN-Zone für Tailscale-Clients.
- `nginx/pterodactyl.conf.example`: Nginx Reverse Proxy Konfiguration.

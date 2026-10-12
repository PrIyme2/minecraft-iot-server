# Client-Netzwerkdiagnose & WLAN-Wechsel Troubleshooting

Fehlerbehebung bei Verbindungsabbrüchen nach WLAN-Wechsel oder Tailscale-Aktivierung.

---

## 1. Problem

Nach Wechsel des WLANs (z. B. Heimnetz -> Hotspot) schlägt der Aufruf von `panel.server.priyme` oder `mc.server.priyme` fehl.

**Ursache:**
- Veralteter DNS-Cache auf dem Client (aufgelöste LAN-IP `192.168.0.33` existiert im neuen Netz nicht).
- Serverseitig ist die TTL bereits auf 60 Sekunden optimiert.

---

## 2. Sofortmaßnahmen am Client

### Windows:
```cmd
# 1. DNS-Cache leeren
ipconfig /flushdns

# 2. DNS-Auflösung prüfen (Soll: Tailscale-IP)
nslookup panel.server.priyme

# 3. Verbindung testen
ping 100.111.45.61
```

### macOS:
```bash
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
dig panel.server.priyme +short
```

### Linux:
```bash
resolvectl flush-caches
resolvectl query panel.server.priyme
```

---

## 3. Diagnose-Vorlage für KI-Assistenten

```markdown
Setup:
- Minecraft- & Pterodactyl-Server auf Debian mit Tailscale.
- Tailscale-IP: 100.111.45.61, LAN-IP: 192.168.0.33.
- BIND9 Split-DNS auf Port 53 liefert via Tailscale 100.111.45.61 zurück.
- Domains: panel.server.priyme (Port 80) und mc.server.priyme (Port 25565).
- Tailscale Split-DNS ist auf 100.111.45.61 für *.server.priyme konfiguriert.

Problem:
Nach WLAN-Wechsel wird panel.server.priyme oder mc.server.priyme nicht mehr erreicht.

Aufgabe:
Prüfe DNS-Adapter-Metrik, Tailscale-Verbindung und DNS-Cache auf diesem Client.
```

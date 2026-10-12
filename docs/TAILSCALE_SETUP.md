# Tailscale Mesh VPN, Funnel & Remote Access Architecture

Dieses Dokument beschreibt die Netzwerkanbindung für weltweiten Zugriff, Remote-SSH-Administration und öffentlichen HTTPS-Ingress ohne Port-Forwarding am Router.

---

## 1. Zero-Trust Mesh Networking

Klassisches Server-Hosting erfordert Port-Weiterleitungen im Router (z. B. Port `25565` oder `80`), wodurch die private IP-Adresse öffentlich exponiert wird.

Stattdessen nutzt dieses Projekt **Tailscale** auf Basis des WireGuard-Protokolls:
1. **Peer-to-Peer Verschlüsselung:** Alle teilnehmenden Endgeräte (Host, Administrations-Clients, Minecraft-Spieler) kommunizieren über verschlüsselte WireGuard-Tunnel mit 256-Bit-Verschlüsselung.
2. **Feste private IP:** Der Host erhält eine feste IP-Adresse aus dem Bereich `100.64.0.0/10` (`100.111.45.61`), die unabhängig von Router-Neustarts oder ISP-Wechseln stabil bleibt.

---

## 2. Tailscale Funnel für ESP32 Mobile Ingress

Mikrocontroller wie der ESP32 können im Mobilfunknetz keinen vollständigen WireGuard-Stack betreiben. Ebenso erfordern Web-Clients gültige TLS-Zertifikate.

Hierfür wird **Tailscale Funnel** auf dem Host genutzt:
```bash
# Leitet öffentlichen HTTPS-Traffic auf den lokalen Nginx Webserver weiter:
tailscale funnel --bg 443 on
```
- Tailscale stellt automatisch ein Let's Encrypt TLS-Zertifikat für `prime.tail923f91.ts.net` bereit.
- Ingress-Traffic trifft auf globale Anycast-Knoten von Tailscale und wird über WireGuard verschlüsselt an Port 80 des Hosts weitergeleitet.
- Nginx leitet `/api/status`, `/start`, `/stop` und `/backup` an die Python-Bridge auf Port 5000 weiter und serviert Reviactyl auf `/`.
- Der ESP32 kann standardkonforme HTTPS-Anfragen an `https://prime.tail923f91.ts.net/api/status` aus jedem Mobilfunknetz absetzen.

---

## 3. Remote-SSH Administration

Port 22 ist an das Tailscale-Interface gebunden, wodurch verschlüsselter Shell-Zugriff weltweit möglich ist:

### Verbindung von PC / Laptop (Windows, macOS, Linux):
```bash
ssh prime@100.111.45.61
```

### Verbindung vom Smartphone (iOS / Android):
1. Tailscale-App auf dem Smartphone verbinden.
2. Beliebigen SSH-Client (z. B. Termius oder JuiceSSH) öffnen.
3. Verbindung zu Host `100.111.45.61` auf Port `22` herstellen.

---

## 4. BIND9 Split-DNS & Split-View

Um sprechende Domainnamen wie `mc.server.priyme` und `panel.server.priyme` aufzulösen:

1. **Lokaler BIND9 Dienst:** Lauscht auf `0.0.0.0:53`.
2. **Split-View Routing:**
   - Anfragen aus dem Tailscale-Netz (`100.64.0.0/10`) erhalten `100.111.45.61`.
   - Anfragen aus dem lokalen Heimnetz (`192.168.0.0/24`) erhalten `192.168.0.33`.
3. **Tailscale Split-DNS Konfiguration:**
   - In der Tailscale Admin-Konsole unter *DNS -> Nameservers*:
     - Custom Nameserver: `100.111.45.61`.
     - Suchdomäne beschränken auf: `server.priyme`.
   - Ergebnis: Regulärer Internetverkehr nutzt den Standard-DNS des Providers, Anfragen an `*.server.priyme` werden direkt vom Host aufgelöst.

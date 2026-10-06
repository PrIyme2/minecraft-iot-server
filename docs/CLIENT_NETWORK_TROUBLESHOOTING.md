# 🔍 Client-Netzwerkdiagnose & WLAN-Wechsel Troubleshooting

Leitfaden zur Diagnose und Behebung von Verbindungsabbrüchen, wenn Client-Geräte das WLAN wechseln oder sich mit Tailscale verbinden.

---

## 📌 Symptombeschreibung

Wenn ein Client-PC oder Laptop von einem Heim-WLAN in ein anderes Netzwerk wechselt (z. B. mobiler Hotspot, Gastnetzwerk, Uni-/Firmen-WLAN) oder Tailscale aktiviert:
- Die Website `panel.server.priyme` lädt nicht mehr (*„Website nicht erreichbar“*).
- Minecraft kann sich nicht mehr mit `mc.server.priyme` verbinden (*„Connection timed out“*).

---

## 🧠 Ursachenanalyse

1. **Veralteter DNS-Zwischenspeicher (DNS-Cache):**
   - Windows und Mobilgeräte cachen die vom heimischen Router oder lokalen BIND9 aufgelöste IP-Adresse (`192.168.0.33`).
   - Im neuen WLAN existiert die private IP `192.168.0.33` nicht mehr. Solange der Client-Cache nicht abgelaufen ist, versucht das Betriebssystem weiterhin, die alte IP anzusprechen.
   - **Gegenmaßnahme auf Serverseite:** Die TTL (Time-To-Live) aller DNS-Zonen wurde auf **60 Sekunden** reduziert.
2. **DNS-Adapter-Priorität (Interface Metric):**
   - Nach einem WLAN-Wechsel überschreiben manche Systeme die DNS-Einstellungen des virtuellen Tailscale-Adapters mit den DNS-Servern des neuen physischen Routers.
   - Folglich landen Anfragen für `server.priyme` beim öffentlichen Router-DNS, der mit `NXDOMAIN` antwortet.

---

## 🛠️ Sofortmaßnahmen am Client

### Windows:
1. **DNS-Cache sofort leeren:**
   ```cmd
   ipconfig /flushdns
   ```
2. **Domain-Auflösung überprüfen:**
   ```cmd
   nslookup panel.server.priyme
   ```
   *Sollzustand bei aktivem Tailscale:* Muss `100.111.45.61` zurückgeben.
3. **Tailscale-Verbindung prüfen:**
   ```cmd
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

## 🤖 KI-Diagnose-Prompt für Client-Betriebssysteme

Kopiere diesen Prompt in einen KI-Assistenten auf deinem Client-Rechner, um automatisiert Netzwerk- und Adapterkonflikte zu analysieren:

```markdown
Ich habe ein Setup mit einem privaten Minecraft- und Pterodactyl-Server auf einem Debian-Laptop und nutze Tailscale für den Fernzugriff.

Mein Setup:
- Server-Laptop im Tailscale-Netzwerk:
  - Tailscale-IP: 100.111.45.61
  - Lokale LAN-IP: 192.168.0.33
  - Tailscale-Domain: prime.tail923f91.ts.net
  - BIND9 DNS-Server lauscht auf Port 53 auf LAN und Tailscale
  - BIND9 liefert bei Tailscale-Anfragen (Split-View) die IP 100.111.45.61 zurück
  - Eigene Domains: panel.server.priyme (Webpanel Port 80) und mc.server.priyme (Minecraft Port 25565)
- In der Tailscale Admin Console ist Split-DNS konfiguriert:
  - Nameserver: 100.111.45.61
  - Restrict to search domain: server.priyme

Mein Problem:
Sobald ich mich mit Tailscale verbinde oder das WLAN wechsle (z. B. von Heimnetz zu mobiler Hotspot / fremdes WLAN), kann mein Client-Gerät weder die Website "panel.server.priyme" noch den Minecraft-Server "mc.server.priyme" erreichen.

Deine Aufgabe:
1. Prüfe Schritt für Schritt meine Tailscale- und DNS-Konfiguration auf meinem aktuellen Client-Betriebssystem.
2. Zeige mir die genauen Befehle, um den DNS-Cache zu leeren und zu testen, welcher DNS-Server die Domain auflöst (z. B. via nslookup / Resolve-DnsName).
3. Stelle sicher, dass die Tailscale-Netzwerkkarte die richtige Priorität (Interface Metric) hat, damit Tailscale MagicDNS (100.100.100.100) auch nach einem WLAN-Wechsel bevorzugt wird.
4. Prüfe, ob die Verbindung zum Server-Knoten 100.111.45.61 über Tailscale aktiv und pingbar ist.
5. Führe mich Schritt für Schritt durch die Diagnose, bis "panel.server.priyme" und "mc.server.priyme" auch nach einem WLAN-Wechsel stabil funktionieren.
```

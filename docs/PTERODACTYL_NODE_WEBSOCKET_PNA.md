# 🔴 Fehlerbehebung: Roter Balken in der Serverkonsole (WebSocket & PNA)

Dokumentation zur Behebung des Verbindungsfehlers zur Live-Konsole (*„Keine Verbindung zum Server hergestellt“* / roter Balken oben rechts im Pterodactyl-Webpanel).

---

## 🔍 Ursachenanalyse

Wenn das Webpanel über eine benutzerdefinierte Domain wie `http://panel.server.priyme/` aufgerufen wird, greift die **Private Network Access (PNA)**-Richtlinie moderner Browser (Google Chrome, Microsoft Edge, Brave):

1. **Origin der Website:** `http://panel.server.priyme` (Öffentliche / benannte Domain-Zone)
2. **WebSocket-Ziel des Daemons:** `ws://192.168.0.33:8080/api/servers/<UUID>/ws` (Private IP-Adresse)
3. **Browser-Blockade:** Der Browser stuft den Verbindungsaufbau von einer Domain zu einer rohen internen IP-Adresse als potenzielles CSRF-Sicherheitsrisiko ein und blockiert den WebSocket-Handshake ohne vorherigen OPTIONS-Preflight.
4. **Symptom:** Im Panel erscheint oben rechts ein roter Balken: *„There was an error connecting to this daemon.“* Die Serverauslastung (CPU/RAM) wird nicht aktualisiert und die Konsole bleibt stumm.

---

## 🛠️ Lösungsschritte

### 1. Node FQDN in MariaDB aktualisieren
Der Node-FQDN muss auf den gleichen Domainnamen wie das Panel gesetzt werden:

```bash
sudo mariadb -e "UPDATE panel.nodes SET fqdn = 'panel.server.priyme', scheme = 'http', daemonListen = 8080 WHERE id = 1;"
```

### 2. Reviactyl / Wings Agent neu starten
Der Hintergrunddienst liest die geänderte Zuordnung neu ein:

```bash
sudo systemctl restart agent.service
```

### 3. Panel-Cache leeren
```bash
sudo -u www-data php /var/www/pterodactyl/artisan config:clear
sudo -u www-data php /var/www/pterodactyl/artisan cache:clear
```

### 4. Browser-Cache aktualisieren
Im Client-Browser die Seite mit `Strg + F5` neu laden. Der WebSocket verbindet sich nun mit `ws://panel.server.priyme:8080/...` und die Live-Konsole ist sofort grün und aktiv.

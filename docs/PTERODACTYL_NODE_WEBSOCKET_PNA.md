# Fehlerbehebung: WebSocket & Private Network Access (PNA)

Lösung für den roten Verbindungsbalken zur Serverkonsole im Webpanel.

---

## 1. Ursache

Browser blockieren WebSocket-Verbindungen von benannten Domains (`http://panel.server.priyme`) zu rohen privaten IP-Adressen (`ws://192.168.0.33:8080`) gemäß der PNA-Richtlinie (Private Network Access).

---

## 2. Lösung

### 1. Node-FQDN in MariaDB anpassen
```bash
sudo mariadb < backend-bridge/fix_node_fqdn.sql
# Oder manuell:
# sudo mariadb -e "UPDATE panel.nodes SET fqdn = 'panel.server.priyme', scheme = 'http', daemonListen = 8080 WHERE id = 1;"
```

### 2. Wings Agent neu starten
```bash
sudo systemctl restart agent.service
```

### 3. Panel-Cache leeren
```bash
sudo -u www-data php /var/www/pterodactyl/artisan config:clear
sudo -u www-data php /var/www/pterodactyl/artisan cache:clear
```

### 4. Browser neu laden
Seite mit `Strg + F5` neu laden. Die Konsole verbindet sich jetzt über `ws://panel.server.priyme:8080/`.

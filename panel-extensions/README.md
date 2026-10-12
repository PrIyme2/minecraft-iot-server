# Reviactyl Panel Extensions

Dieses Verzeichnis enthält die maßgeschneiderten Erweiterungen für das Reviactyl/Pterodactyl-Webpanel.

---

## 1. Übersicht der Erweiterungen

### mcjars-integration (`Server Software`)
- **ID:** `mcjars-integration` (Version 1.3.0, API RCYL_v26)
- **Funktion:** Ermöglicht das direkte Wechseln der Server-Software (Purpur, Paper, Folia, Fabric, Forge, NeoForge, Velocity, BungeeCord u. v. m. – insgesamt 28 Distributionen) direkt über die Web-Oberfläche.
- **Workflow:** 
  1. Fragt die offizielle MCJars-API (`https://mcjars.app`) nach verfügbaren Builds und Minecraft-Versionen ab.
  2. Lädt das gewählte JAR-Archiv herunter und ersetzt die Startdatei auf dem Server.
  3. Aktualisiert den Server-Startbefehl ohne manuellen SSH- oder SFTP-Eingriff.
- **Pfad im Panel:** Server -> `Server Software` (`/server/{id}/mcjars`)

### modrinth-plugin-installer (`Plugins`)
- **ID:** `modrinth-plugin-installer` (Version 1.2.5, API RCYL_v26)
- **Funktion:** Vollständiger 1-Klick Plugin-Manager für Spigot-, Paper- und Purpur-Server mit Anbindung an Modrinth, SpigotMC und Hangar.
- **Workflow:**
  1. Durchsucht Modrinth & Hangar nach kompatiblen Plugins für die laufende Minecraft-Version.
  2. Lädt die Plugin-JAR-Datei direkt in das Server-Verzeichnis `/plugins/`.
  3. Unterstützt Versions-Updates und Deinstallation direkt über das Panel.
- **Pfad im Panel:** Server -> `Plugins` (`/server/{id}/plugins/modrinth`)

---

## 2. Installation & Aktivierung

### Schritt 1: Dateien auf den Webserver kopieren
```bash
sudo cp -r panel-extensions/mcjars-integration /var/www/pterodactyl/extensions/
sudo cp -r panel-extensions/modrinth-plugin-installer /var/www/pterodactyl/extensions/
```

### Schritt 2: Berechtigungen setzen
```bash
sudo chown -R www-data:www-data /var/www/pterodactyl/extensions/
sudo chmod -R 755 /var/www/pterodactyl/extensions/
```

### Schritt 3: Cache leeren und optimieren
```bash
cd /var/www/pterodactyl
sudo -u www-data php artisan route:clear
sudo -u www-data php artisan config:clear
sudo -u www-data php artisan view:clear
```

Die Erweiterungen nutzen vorkompilierte Frontend-Bundles (`build_strategy: precompiled`) und binden sich automatisch in die Navigation von Reviactyl ein.

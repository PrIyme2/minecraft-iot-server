# Minecraft & Database Google Drive Backup Pipeline

Vollautomatische, containerisierte und verschlüsselte Backup-Pipeline für den Minecraft-Server und die MariaDB-Datenbank mit direktem Upload zu Google Drive sowie nativer Integration in das Reviactyl-Webpanel.

---

## 1. Funktionsübersicht

- **Unterbrechungsfreier Save-Flush:** Live-Datenkonsistenz über Minecraft RCON (`save-off`, `save-all flush`, `save-on`).
- **Symmetrische GPG-Verschlüsselung (AES-256):** Clientseitige Verschlüsselung vor dem Cloud-Upload.
- **Google Drive Upload:** Robuster Upload via Rclone mit 8 MB Chunks.
- **Reviactyl Webpanel-Integration:**
  - Manuelle Backups können direkt über den **Backups**-Tab im Webpanel ausgelöst werden (`Create Backup`).
  - Google Drive Archive werden automatisch synchronisiert und im Panel gelistet.
- **Aufbewahrungsfristen (Retention-Policy):** Lokale Vorhaltung (5 Archive) und Cloud-Vorhaltung (14 Tage).
- **Automatisierung:** Täglicher Systemd-Timer (`minecraft-backup.timer` um 03:30 Uhr) und periodischer Sync-Timer (`gdrive-backup-sync.timer` alle 5 Minuten).
- **Echtzeit-Alerting:** Discord-Webhook für Erfolgs- und Fehlermeldungen.

---

## 2. Dateistruktur

```text
backup-pipeline/
├── backup.conf.example        # Bereinigte Konfigurationsvorlage
├── backup.sh                  # Haupt-Backupskript (RCON-Lock, Dump, GPG, Rclone)
├── sync_gdrive_backups.py     # Synchronisation zwischen Google Drive und Reviactyl DB
├── restore.sh                 # Interaktives Wiederherstellungsskript
├── setup_rclone.sh            # Rclone Google Drive Einrichtungsassistent
├── rcon_cli.py                # Zero-Dependency Python RCON Client
├── send_discord.py            # Discord Webhook Notifier (Rich Embeds)
├── systemd/
│   ├── minecraft-backup.service   # Systemd Oneshot Service
│   └── minecraft-backup.timer     # Systemd Timer (03:30 Uhr)
└── README.md                  # Diese Dokumentation
```

---

## 3. Auslösemethoden für Backups

Das System unterstützt drei Wege zur Erstellung eines konsistenten Backups:

### A. Über das Reviactyl Webpanel (GUI)
1. Im Webpanel unter `Server -> Backups` auf **Create Backup** klicken.
2. Optional einen Namen vergeben (z. B. `Vor Nether-Update`) und bestätigen.
3. Der `BackupController` in Reviactyl sendet einen internen Trigger an `http://127.0.0.1:5000/backup`.
4. Die Pipeline startet im Hintergrund, zeigt im Panel sofort einen Lade-Status an und aktualisiert den Eintrag nach erfolgreichem Google Drive Upload.

### B. Über den physischen ESP32-Controller (Hardware-Taster)
1. Den Backup-Taster am ESP32 drücken (Pin GPIO 23 gegen GND).
2. Die Firmware sendet eine autorisierte Anfrage an `/backup`.
3. Der Server bestätigt den Start, die gelbe Status-LED signalisiert den Vorgang.

### C. Über die Linux-Konsole (CLI / Cron)
```bash
# Reales Backup manuell starten:
/home/prime/minecraft-backup/backup.sh

# Simulation (Trockenlauf ohne Schreibvorgänge):
/home/prime/minecraft-backup/backup.sh --dry-run
```

---

## 4. Wiederherstellung (Disaster Recovery)

```bash
# Verfügbare lokale und Google Drive Backups auflisten:
/home/prime/minecraft-backup/restore.sh --list

# Bestimmtes Backup aus Google Drive herunterladen:
/home/prime/minecraft-backup/restore.sh --download mc_backup_2026-10-09_17-46-42.tar.gz.gpg

# Vollständige Wiederherstellung von Welt und Datenbank:
sudo /home/prime/minecraft-backup/restore.sh /home/prime/backups/mc_backup_2026-10-09_17-46-42.tar.gz.gpg --restore-db
```

# Backup Pipeline & Disaster Recovery Spezifikation

Automatisierte Backup-Architektur mit Datenkonsistenz, GPG-Verschlüsselung und Google Drive Sync.

---

## 1. Pipeline-Ablauf

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 BACKUP PIPELINE ABLAUF                                 │
│                                                                                        │
│  ┌────────────────────────┐         ┌────────────────────────┐                         │
│  │     START-TRIGGER      │         │    1. RCON FREEZE      │                         │
│  │ Webpanel / D23 / Timer │ ──────> │ save-off & save-all    │                         │
│  └────────────────────────┘         └───────────┬────────────┘                         │
│                                                 │                                      │
│                                                 ▼                                      │
│  ┌────────────────────────┐         ┌────────────────────────┐                         │
│  │   3. VERSCHLÜSSELUNG   │         │    2. DUMP & ARCHIV    │                         │
│  │ GPG AES-256 Symmetrisch│ <────── │ mysqldump + tar Bundle │                         │
│  └───────────┬────────────┘         └────────────────────────┘                         │
│              │                                                                         │
│              ▼                                                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              4. CLOUD-UPLOAD & SYNC                              │  │
│  │          Rclone -> Google Drive (8M Chunks) + Panel MariaDB Sync                 │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Direkte Links zur Implementierung

| Komponente | Datei | Funktion |
| :--- | :--- | :--- |
| **Trigger-Endpunkte** | [`mc-control-service.py`](../backend-bridge/mc-control-service.py) | REST API `/backup` (Panel & ESP32 GPIO 23) |
| **Backup-Skript** | [`backup.sh`](../backup-pipeline/backup.sh) | RCON Freeze, MariaDB-Dump, tar, GPG & Upload |
| **Wiederherstellung** | [`restore.sh`](../backup-pipeline/restore.sh) | Cloud-Download und Restore von Welt & Datenbank |
| **Panel-Synchronisation** | [`sync_gdrive_backups.py`](../backup-pipeline/sync_gdrive_backups.py) | Abgleich der Cloud-Backups mit der Panel-Datenbank |
| **Discord Benachrichtigung** | [`send_discord.py`](../backup-pipeline/send_discord.py) | Status- und Fehler-Embeds |
| **Automatischer Timer** | [`minecraft-backup.timer`](../backup-pipeline/systemd/minecraft-backup.timer) | Täglicher Lauf um 03:30 Uhr |

---

## 2. Konsistenz: Der Save-Flush Zyklus

Server halten Chunks im RAM. Unkoordiniertes Kopieren erzeugt korrupte Welten. [`backup.sh`](../backup-pipeline/backup.sh) garantiert atomare Konsistenz:

1. `save-off`: Autosave pausieren.
2. `save-all flush`: Chunks aus dem RAM sofort auf Disk schreiben.
3. `mysqldump`: Panel-Datenbank sichern.
4. `save-on`: Autosave nach dem Lesen des Archivs direkt reaktivieren.

---

## 3. Verschlüsselung: Clientseitiges GPG AES-256

Archive werden vor dem Cloud-Upload lokal symmetrisch verschlüsselt:
- **Befehl:**
  ```bash
  gpg --batch --yes --symmetric --cipher-algo AES256 --passphrase "$GPG_PASSPHRASE" -o archive.tar.gz.gpg archive.tar.gz
  ```
- **Dateiname:** `mc_backup_YYYY-MM-DD_HH-MM-SS.tar.gz.gpg`
- Keine Plaintext-Daten auf Google Drive.

---

## 4. Webpanel-Synchronisation

[`sync_gdrive_backups.py`](../backup-pipeline/sync_gdrive_backups.py) gleicht Google Drive Backups mit dem Webpanel ab:
- Filtert strikt nach `mc_backup_*.tar.gz.gpg`.
- Löst ausstehende Web-Backups (Ladespinner) automatisch auf.
- Schreibt Größe, Zeitstempel und Checksum `Google Drive (GPG AES-256)` in die Tabelle `panel.backups`.
- Läuft nach jedem Backup und alle 5 Minuten per Timer.

---

## 5. Wiederherstellung (Disaster Recovery)

```bash
# 1. Backups auflisten:
/home/prime/minecraft-backup/restore.sh --list

# 2. Aus Google Drive laden:
/home/prime/minecraft-backup/restore.sh --download mc_backup_2026-10-09_17-46-42.tar.gz.gpg

# 3. Entpacken und Datenbank einspielen:
sudo /home/prime/minecraft-backup/restore.sh /home/prime/backups/mc_backup_2026-10-09_17-46-42.tar.gz.gpg --restore-db

# Trockenlauf (Test ohne Schreibvorgänge):
/home/prime/minecraft-backup/backup.sh --dry-run
```

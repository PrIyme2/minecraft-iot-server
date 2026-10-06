# 📦 Minecraft & Database Google Drive Backup Pipeline

Vollautomatische, containerisierte und verschlüsselte Backup-Pipeline für den Minecraft-Server und die MariaDB-Datenbank mit direktem Upload zu Google Drive.

Erfüllt die Kriterien aus dem Projektantrag (**GK541, GK631: Linux Systemadministration & CLI**):
- ✅ **Cronjob- / Systemd-gesteuerte Komprimierung** von Welten und Datenbank-Dumps
- ✅ **Symmetrische GPG-Verschlüsselung (AES-256)** vor dem Cloud-Upload
- ✅ **Google Drive Upload** mittels Rclone
- ✅ **Aufbewahrungsfristen (Retention-Policy)** für lokalen Speicher und Cloud
- ✅ **Live-Datenkonsistenz via Minecraft RCON** (`save-off`, `save-all flush`, `save-on`)
- ✅ **Echtzeit-Alerting via Discord-Webhook** (Erfolgs- und Fehlermeldungen)

---

## 📁 Dateistruktur

```text
/home/prime/minecraft-backup/
├── backup.conf                    # Zentrale Konfiguration (Pfade, Passwörter, Aufbewahrung)
├── backup.sh                      # Haupt-Backupskript
├── restore.sh                     # Wiederherstellungs- & Disaster-Recovery-Skript
├── setup_rclone.sh                # Assistent zur Google Drive Einrichtung in Rclone
├── rcon_cli.py                    # RCON-Steuerungstool (Zero-Dependencies)
├── send_discord.py                # Discord Webhook Notifier (Rich Embeds)
├── systemd/
│   ├── minecraft-backup.service   # Systemd-Service (Oneshot)
│   └── minecraft-backup.timer     # Systemd-Timer (Täglich um 03:30 Uhr)
└── README.md                      # Diese Dokumentation
```

---

## 🚀 Schnellstart

### 1. Berechtigungen setzen & Konfiguration prüfen
Die Passwörter in `backup.conf` sind vorkonfiguriert für das bestehende Pterodactyl- und Minecraft-Setup:
```bash
cd /home/prime/minecraft-backup
chmod +x backup.sh restore.sh setup_rclone.sh rcon_cli.py send_discord.py
chmod 600 backup.conf
```

### 2. Google Drive anbinden (Rclone)
Führe den Einrichtungsassistenten aus:
```bash
./setup_rclone.sh
```
*Oder manuell:* `rclone config` ausführen, neues Remote namens `gdrive` vom Typ `drive` erstellen und über den Google-Account autorisieren.

### 3. Erstes Test-Backup durchführen
```bash
# Trockenlauf (Simulation ohne Änderungen):
sudo ./backup.sh --dry-run

# Reales Backup erstellen:
sudo ./backup.sh
```

---

## ⚙️ Optionen von `backup.sh`

| Option | Beschreibung |
| :--- | :--- |
| *(keine)* | Erstellt ein volles Backup (Minecraft Serverordner + MariaDB Dumps), verschlüsselt und lädt hoch. |
| `-d, --dry-run` | Zeigt alle Einzelschritte an, ohne Daten zu verändern oder hochzuladen. |
| `--db-only` | Sichert ausschließlich die Datenbanken (`panel`, etc.). |
| `--world-only` | Sichert ausschließlich die Minecraft-Dateien ohne SQL-Dump. |
| `--full` | Sichert auch temporäre Ordner (`cache/`, `libraries/`), die standardmäßig ausgelassen werden. |
| `--no-encrypt` | Erstellt das Archiv ohne GPG-Verschlüsselung (`.tar.gz`). |
| `-c DATEI` | Nutzt eine alternative Konfigurationsdatei. |

---

## 🔄 Wiederherstellung (Disaster Recovery)

Mit `restore.sh` können Backups sowohl lokal als auch direkt aus Google Drive wiederhergestellt werden:

```bash
# 1. Alle verfügbaren Backups anzeigen:
./restore.sh --list

# 2. Ein Backup aus Google Drive herunterladen:
./restore.sh --download mc_backup_2026-10-02_19-30-00.tar.gz.gpg

# 3. Entschlüsseln und in ein Staging-Verzeichnis entpacken:
./restore.sh /home/prime/backups/mc_backup_2026-10-02_19-30-00.tar.gz.gpg

# 4. Entpacken und gleichzeitig MariaDB-Datenbank wiederherstellen:
./restore.sh /home/prime/backups/mc_backup_2026-10-02_19-30-00.tar.gz.gpg --restore-db
```

---

## ⏰ Automatische Zeitplanung (Systemd Timer)

Um das Backup jeden Morgen vollautomatisch um **03:30 Uhr** ausführen zu lassen:

```bash
# Service und Timer im System verlinken / kopieren:
sudo cp systemd/minecraft-backup.service /etc/systemd/system/
sudo cp systemd/minecraft-backup.timer /etc/systemd/system/

# Systemd neu laden und Timer aktivieren:
sudo systemctl daemon-reload
sudo systemctl enable --now minecraft-backup.timer

# Status prüfen:
systemctl list-timers | grep minecraft
```

---

## 🔒 Sicherheit & Verschlüsselung

- **GPG AES-256:** Die Archive werden lokal mit modernem AES-256 verschlüsselt, **bevor** sie die Maschine verlassen. Selbst wenn unbefugte Personen Zugriff auf das Google Drive erhalten, sind Welten und Zugangsdaten geschützt.
- **Passphrase:** Definiert in `backup.conf` (`GPG_PASSPHRASE`). Bitte sicher im Passwortmanager sichern!
- **Dateirechte:** `backup.conf` sollte immer Rechte `600` besitzen (`chmod 600 backup.conf`), damit nur `root` bzw. der autorisierte Benutzer sie lesen kann.

#!/usr/bin/env bash
# ==============================================================================
# Disaster Recovery & Restore Utility for Minecraft & Database Backups
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")"
CONFIG_FILE="${SCRIPT_DIR}/backup.conf"

if [[ -f "$CONFIG_FILE" ]]; then
    # shellcheck source=/dev/null
    source "$CONFIG_FILE"
fi

RESTORE_STAGING_DIR="/tmp/mc_restore_staging"

usage() {
    echo "Verwendung: $0 [OPTIONEN] [BACKUP_DATEI]"
    echo ""
    echo "Optionen:"
    echo "  -l, --list           Listet lokale und Google Drive Backups auf"
    echo "  -d, --download DATEI Lädt ein bestimmtes Backup von Google Drive herunter"
    echo "  -t, --target VERZ    Zielverzeichnis für extrahierte Dateien (Standard: $RESTORE_STAGING_DIR)"
    echo "  --restore-db         Stellt gefundene SQL-Dumps direkt in MariaDB wieder her"
    echo "  -h, --help           Zeigt diese Hilfe an"
    echo ""
    echo "Beispiel:"
    echo "  $0 --list"
    echo "  $0 /home/prime/backups/mc_backup_2026-10-02_19-00-00.tar.gz.gpg"
    exit 0
}

list_backups() {
    echo "=== LOKALE BACKUPS (${BACKUP_LOCAL_DIR}) ==="
    if [[ -d "$BACKUP_LOCAL_DIR" ]]; then
        ls -lh "$BACKUP_LOCAL_DIR"/mc_backup_* 2>/dev/null || echo "Keine lokalen Backups gefunden."
    else
        echo "Lokaler Backup-Ordner existiert noch nicht."
    fi

    echo ""
    echo "=== GOOGLE DRIVE BACKUPS (${RCLONE_REMOTE:-gdrive}:${RCLONE_FOLDER:-MinecraftBackups}) ==="
    if command -v rclone >/dev/null 2>&1 && rclone listremotes 2>/dev/null | grep -q "^${RCLONE_REMOTE:-gdrive}:"; then
        rclone lsl "${RCLONE_REMOTE}:${RCLONE_FOLDER}" 2>/dev/null || echo "Keine Cloud-Backups gefunden oder Fehler beim Abruf."
    else
        echo "Rclone Remote '${RCLONE_REMOTE:-gdrive}' ist noch nicht konfiguriert."
    fi
}

download_remote() {
    local REMOTE_FILE="$1"
    mkdir -p "$BACKUP_LOCAL_DIR"
    echo "Lade '$REMOTE_FILE' von Google Drive herunter..."
    rclone copy "${RCLONE_REMOTE}:${RCLONE_FOLDER}/${REMOTE_FILE}" "$BACKUP_LOCAL_DIR/" --progress
    echo "Download abgeschlossen: ${BACKUP_LOCAL_DIR}/${REMOTE_FILE}"
}

RESTORE_FILE=""
TARGET_DIR="$RESTORE_STAGING_DIR"
APPLY_DB=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        -l|--list)
            list_backups
            exit 0
            ;;
        -d|--download)
            download_remote "$2"
            exit 0
            ;;
        -t|--target)
            TARGET_DIR="$2"
            shift 2
            ;;
        --restore-db)
            APPLY_DB=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            if [[ -z "$RESTORE_FILE" ]]; then
                RESTORE_FILE="$1"
                shift
            else
                echo "Unbekannter Parameter: $1"
                usage
            fi
            ;;
    esac
done

if [[ -z "$RESTORE_FILE" ]]; then
    echo "FEHLER: Keine Backup-Datei angegeben."
    echo ""
    usage
fi

if [[ ! -f "$RESTORE_FILE" ]]; then
    # Suche im lokalen Backup-Ordner
    if [[ -f "${BACKUP_LOCAL_DIR}/${RESTORE_FILE}" ]]; then
        RESTORE_FILE="${BACKUP_LOCAL_DIR}/${RESTORE_FILE}"
    else
        echo "FEHLER: Datei '$RESTORE_FILE' existiert nicht!"
        exit 1
    fi
fi

echo "================================================================="
echo "Starte Wiederherstellung aus: $RESTORE_FILE"
echo "Zielverzeichnis:            $TARGET_DIR"
echo "================================================================="

mkdir -p "$TARGET_DIR"
TEMP_EXTRACT_DIR="/tmp/mc_restore_tmp_$$"
mkdir -p "$TEMP_EXTRACT_DIR"

cleanup_restore() {
    rm -rf "$TEMP_EXTRACT_DIR"
}
trap cleanup_restore EXIT

WORKING_ARCHIVE="$RESTORE_FILE"

# Prüfe auf GPG Verschlüsselung
if [[ "$RESTORE_FILE" == *.gpg ]]; then
    echo "Entschlüssele GPG-Archiv..."
    DECRYPTED_FILE="$TEMP_EXTRACT_DIR/decrypted_archive.tar.gz"
    if [[ -n "${GPG_PASSPHRASE:-}" ]]; then
        echo "$GPG_PASSPHRASE" | gpg --batch --yes --passphrase-fd 0 --decrypt --output "$DECRYPTED_FILE" "$RESTORE_FILE"
    else
        gpg --decrypt --output "$DECRYPTED_FILE" "$RESTORE_FILE"
    fi
    WORKING_ARCHIVE="$DECRYPTED_FILE"
    echo "Entschlüsselung erfolgreich."
fi

# Entpacken
echo "Entpacke Archiv nach $TARGET_DIR..."
if [[ "$WORKING_ARCHIVE" == *.zst || "$WORKING_ARCHIVE" == *.tar.zst ]]; then
    tar --zstd -xf "$WORKING_ARCHIVE" -C "$TARGET_DIR"
else
    tar -xzf "$WORKING_ARCHIVE" -C "$TARGET_DIR"
fi
echo "Dateien erfolgreich entpackt."

# Datenbank Wiederherstellung anbieten / durchführen
if [[ -d "$TARGET_DIR/database" ]]; then
    SQL_DUMPS=("$TARGET_DIR/database"/*.sql.gz "$TARGET_DIR/database"/*.sql)
    echo ""
    echo "Gefundene Datenbank-Dumps:"
    for dump in "${SQL_DUMPS[@]}"; do
        if [[ -f "$dump" ]]; then
            echo " - $(basename "$dump")"
            if [[ "$APPLY_DB" == true ]]; then
                DB_NAME=$(basename "$dump" | cut -d'_' -f1)
                echo "Spiele Dump in Datenbank '$DB_NAME' ein..."
                if [[ "$dump" == *.gz ]]; then
                    zcat "$dump" | mariadb -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME"
                else
                    mariadb -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$dump"
                fi
                echo "Datenbank '$DB_NAME' erfolgreich aktualisiert."
            fi
        fi
    done
fi

echo ""
echo "================================================================="
echo "Wiederherstellung abgeschlossen!"
echo "Dateien liegen bereit in: $TARGET_DIR"
if [[ "$APPLY_DB" == false && -d "$TARGET_DIR/database" ]]; then
    echo "TIPP: Um Datenbankdumps direkt einzuspielen, füge '--restore-db' hinzu."
fi
echo "================================================================="

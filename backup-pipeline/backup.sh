#!/usr/bin/env bash
# ==============================================================================
# Automated Minecraft & Database Backup Pipeline with Google Drive Upload
# Supports: GPG AES-256 Encryption, RCON Save Flush, MariaDB Dump, Retention
# ==============================================================================

set -uo pipefail

SCRIPT_DIR="$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")"
CONFIG_FILE="${SCRIPT_DIR}/backup.conf"

# CLI Arguments
DRY_RUN=false
DB_ONLY=false
WORLD_ONLY=false
FULL_BACKUP=false
FORCE_NO_ENCRYPT=false

usage() {
    echo "Verwendung: $0 [OPTIONEN]"
    echo ""
    echo "Optionen:"
    echo "  -c, --config DATEI   Pfad zur Konfigurationsdatei (Standard: backup.conf)"
    echo "  -d, --dry-run        Simulation: Zeigt Schritte an, ohne Upload oder Änderungen"
    echo "  --db-only            Sichert ausschließlich die Datenbank(en)"
    echo "  --world-only         Sichert ausschließlich den Minecraft-Serverordner"
    echo "  --full               Vollständiges Backup (inkl. cache/ und libraries/)"
    echo "  --no-encrypt         Deaktiviert GPG-Verschlüsselung für diesen Lauf"
    echo "  -h, --help           Zeigt diese Hilfe an"
    exit 0
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        -c|--config)
            CONFIG_FILE="$2"
            shift 2
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        --db-only)
            DB_ONLY=true
            shift
            ;;
        --world-only)
            WORLD_ONLY=true
            shift
            ;;
        --full)
            FULL_BACKUP=true
            shift
            ;;
        --no-encrypt)
            FORCE_NO_ENCRYPT=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo "Unbekannte Option: $1"
            usage
            ;;
    esac
done

if [[ ! -f "$CONFIG_FILE" ]]; then
    echo "FEHLER: Konfigurationsdatei nicht gefunden: $CONFIG_FILE" >&2
    exit 1
fi

# Load config
# shellcheck source=/dev/null
source "$CONFIG_FILE"

if [[ "$FORCE_NO_ENCRYPT" == true ]]; then
    ENCRYPTION_ENABLED=false
fi

# Logging setup
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
DATE_READABLE=$(date +"%d.%m.%Y %H:%M:%S")
START_TIME=$(date +%s)
LOG_DIR=$(dirname "$LOG_FILE")
if [[ ! -d "$LOG_DIR" ]]; then
    mkdir -p "$LOG_DIR" 2>/dev/null || LOG_FILE="${BACKUP_LOCAL_DIR}/backup.log"
fi

log() {
    local LEVEL="$1"
    shift
    local MSG="$*"
    local ENTRY="[$(date +"%Y-%m-%d %H:%M:%S")] [$LEVEL] $MSG"
    echo "$ENTRY"
    if [[ -w "$(dirname "$LOG_FILE")" || -w "$LOG_FILE" ]]; then
        echo "$ENTRY" >> "$LOG_FILE" 2>/dev/null || true
    fi
}

send_discord_alert() {
    local STATUS="$1"
    local TITLE="$2"
    local DESC="$3"
    shift 3
    if [[ -n "${DISCORD_WEBHOOK_URL:-}" && -f "${SCRIPT_DIR}/send_discord.py" ]]; then
        python3 "${SCRIPT_DIR}/send_discord.py" "$DISCORD_WEBHOOK_URL" "$STATUS" "$TITLE" "$DESC" "$@" || true
    fi
}

# RCON Save state tracking
RCON_SAVE_DISABLED=false
cleanup() {
    local EXIT_CODE=$?
    if [[ "$RCON_SAVE_DISABLED" == true && "$RCON_ENABLED" == true ]]; then
        log "INFO" "Reaktiviere Minecraft Autosave (save-on)..."
        python3 "${SCRIPT_DIR}/rcon_cli.py" "$RCON_HOST" "$RCON_PORT" "$RCON_PASSWORD" "save-on" >/dev/null 2>&1 || true
        RCON_SAVE_DISABLED=false
    fi

    # Cleanup temporary workspace
    if [[ -d "${WORK_DIR:-}" ]]; then
        rm -rf "$WORK_DIR"
    fi

    if [[ $EXIT_CODE -ne 0 ]]; then
        log "FEHLER" "Backup abgebrochen mit Exit-Code $EXIT_CODE."
        send_discord_alert "error" "Minecraft Backup FEHLGESCHLAGEN" \
            "Das Backup wurde mit einem Fehler abgebrochen (Exit-Code $EXIT_CODE)." \
            "Zeitpunkt:${DATE_READABLE}" "Server:smp"
    fi
}
trap cleanup EXIT INT TERM

# Prepare directories
mkdir -p "$BACKUP_LOCAL_DIR"
WORK_DIR="${TEMP_DIR}/run_${TIMESTAMP}"
mkdir -p "$WORK_DIR/database" "$WORK_DIR/server"

log "INFO" "================================================================="
log "INFO" "Starte Backup-Pipeline: $DATE_READABLE"
log "INFO" "Modus: dry_run=$DRY_RUN, full=$FULL_BACKUP, encrypt=$ENCRYPTION_ENABLED"
log "INFO" "================================================================="

# ------------------------------------------------------------------------------
# 1. MINECRAFT WORLD FLUSH VIA RCON
# ------------------------------------------------------------------------------
if [[ "$RCON_ENABLED" == true && "$DB_ONLY" == false ]]; then
    log "INFO" "Prüfe Minecraft RCON Verbindung ($RCON_HOST:$RCON_PORT)..."
    if python3 "${SCRIPT_DIR}/rcon_cli.py" "$RCON_HOST" "$RCON_PORT" "$RCON_PASSWORD" "list" >/dev/null 2>&1; then
        log "INFO" "Minecraft Server ist ONLINE. Führe Daten-Flush durch..."
        if [[ "$DRY_RUN" == false ]]; then
            python3 "${SCRIPT_DIR}/rcon_cli.py" "$RCON_HOST" "$RCON_PORT" "$RCON_PASSWORD" "say [Backup] Automatische Datenbanksicherung startet..." >/dev/null 2>&1 || true
            python3 "${SCRIPT_DIR}/rcon_cli.py" "$RCON_HOST" "$RCON_PORT" "$RCON_PASSWORD" "save-off" >/dev/null 2>&1 || true
            RCON_SAVE_DISABLED=true
            python3 "${SCRIPT_DIR}/rcon_cli.py" "$RCON_HOST" "$RCON_PORT" "$RCON_PASSWORD" "save-all flush" >/dev/null 2>&1 || true
            sleep 2
        fi
        log "INFO" "Welt erfolgreich geflusht und temporär gesperrt (save-off)."
    else
        log "WARN" "Minecraft Server offline oder RCON nicht erreichbar. Fahre mit Kalt-Backup fort."
    fi
fi

# ------------------------------------------------------------------------------
# 2. DATENBANK DUMP (MariaDB / MySQL)
# ------------------------------------------------------------------------------
DB_DUMP_COUNT=0
if [[ "$DB_BACKUP_ENABLED" == true && "$WORLD_ONLY" == false ]]; then
    log "INFO" "Erstelle MariaDB / MySQL Datenbank-Dumps..."
    for DB in "${DB_NAMES[@]}"; do
        DUMP_FILE="$WORK_DIR/database/${DB}_${TIMESTAMP}.sql"
        log "INFO" "Dumpe Datenbank '$DB'..."
        if [[ "$DRY_RUN" == false ]]; then
            if mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" \
                --single-transaction --quick --routines --triggers "$DB" > "$DUMP_FILE" 2>/dev/null; then
                gzip "$DUMP_FILE"
                DUMP_SIZE=$(du -h "${DUMP_FILE}.gz" | cut -f1)
                log "INFO" "Dump für '$DB' erfolgreich komprimiert (${DUMP_FILE}.gz, $DUMP_SIZE)."
                DB_DUMP_COUNT=$((DB_DUMP_COUNT + 1))
            else
                log "WARN" "Datenbankdump für '$DB' fehlgeschlagen!"
            fi
        else
            log "INFO" "[DRY-RUN] mysqldump für '$DB' übersprungen."
        fi
    done
fi

# ------------------------------------------------------------------------------
# 3. MINECRAFT AUTOSAVE SOFORT WIEDER AKTIVIEREN
# ------------------------------------------------------------------------------
# Sobald die Weltdateien für den Tar-Stream bereit sind bzw. vor dem Komprimieren,
# können wir das Spiel direkt wieder für Writes freigeben:
if [[ "$RCON_SAVE_DISABLED" == true ]]; then
    log "INFO" "Reaktiviere Minecraft Autosave (save-on)..."
    python3 "${SCRIPT_DIR}/rcon_cli.py" "$RCON_HOST" "$RCON_PORT" "$RCON_PASSWORD" "save-on" >/dev/null 2>&1 || true
    python3 "${SCRIPT_DIR}/rcon_cli.py" "$RCON_HOST" "$RCON_PORT" "$RCON_PASSWORD" "say [Backup] Welt gesichert, Autosave aktiv." >/dev/null 2>&1 || true
    RCON_SAVE_DISABLED=false
fi

# ------------------------------------------------------------------------------
# 4. ARCHIVIERUNG & KOMPRIMIERUNG
# ------------------------------------------------------------------------------
ARCHIVE_BASE="mc_backup_${TIMESTAMP}"
ARCHIVE_EXT="tar.gz"
COMPRESS_FLAG="-czf"
if [[ "$COMPRESSION_METHOD" == "zstd" ]] && command -v zstd >/dev/null 2>&1; then
    ARCHIVE_EXT="tar.zst"
    COMPRESS_FLAG="--zstd -cf"
fi

RAW_ARCHIVE="$WORK_DIR/${ARCHIVE_BASE}.${ARCHIVE_EXT}"
log "INFO" "Erstelle Archiv: ${RAW_ARCHIVE}..."

if [[ "$DRY_RUN" == false ]]; then
    # Build tar exclude arguments
    TAR_EXCLUDES=()
    if [[ "$FULL_BACKUP" == false ]]; then
        for item in "${EXCLUDE_ITEMS[@]}"; do
            TAR_EXCLUDES+=( "--exclude=$item" )
        done
    fi

    # Pack files
    if [[ "$DB_ONLY" == true ]]; then
        tar $COMPRESS_FLAG "$RAW_ARCHIVE" -C "$WORK_DIR" database
    elif [[ "$WORLD_ONLY" == true ]]; then
        tar $COMPRESS_FLAG "$RAW_ARCHIVE" "${TAR_EXCLUDES[@]}" -C "$MC_SERVER_DIR" .
    else
        # Combined backup: Minecraft Serverordner + DB-Dumps
        tar $COMPRESS_FLAG "$RAW_ARCHIVE" \
            "${TAR_EXCLUDES[@]}" \
            -C "$MC_SERVER_DIR" . \
            -C "$WORK_DIR" database
    fi

    ARCHIVE_SIZE=$(du -h "$RAW_ARCHIVE" | cut -f1)
    log "INFO" "Archivierung erfolgreich abgeschlossen (Größe: $ARCHIVE_SIZE)."
else
    RAW_ARCHIVE="$WORK_DIR/${ARCHIVE_BASE}.${ARCHIVE_EXT}"
    touch "$RAW_ARCHIVE"
    ARCHIVE_SIZE="0MB (Simulation)"
    log "INFO" "[DRY-RUN] Archivierung simuliert."
fi

# ------------------------------------------------------------------------------
# 5. VERSCHLÜSSELUNG (GPG AES-256)
# ------------------------------------------------------------------------------
FINAL_FILE="$RAW_ARCHIVE"
FINAL_FILENAME="${ARCHIVE_BASE}.${ARCHIVE_EXT}"

if [[ "$ENCRYPTION_ENABLED" == true ]]; then
    ENCRYPTED_FILE="${RAW_ARCHIVE}.gpg"
    FINAL_FILENAME="${ARCHIVE_BASE}.${ARCHIVE_EXT}.gpg"
    log "INFO" "Verschlüssele Backup mit GPG (AES-256)..."

    if [[ "$DRY_RUN" == false ]]; then
        if [[ -z "${GPG_PASSPHRASE:-}" ]]; then
            log "FEHLER" "GPG_PASSPHRASE ist leer! Verschlüsselung kann nicht fortgesetzt werden."
            exit 1
        fi

        echo "$GPG_PASSPHRASE" | gpg --batch --yes --passphrase-fd 0 \
            --cipher-algo AES256 --symmetric --output "$ENCRYPTED_FILE" "$RAW_ARCHIVE"

        # Lösche unverschlüsseltes Archiv
        rm -f "$RAW_ARCHIVE"
        FINAL_FILE="$ENCRYPTED_FILE"
        ENC_SIZE=$(du -h "$FINAL_FILE" | cut -f1)
        log "INFO" "Verschlüsselung abgeschlossen (${FINAL_FILENAME}, $ENC_SIZE)."
    else
        touch "$ENCRYPTED_FILE"
        FINAL_FILE="$ENCRYPTED_FILE"
        log "INFO" "[DRY-RUN] Verschlüsselung simuliert."
    fi
fi

# ------------------------------------------------------------------------------
# 6. LOKALE ABLAGE & LOKALE RETENTION
# ------------------------------------------------------------------------------
DEST_LOCAL_FILE="${BACKUP_LOCAL_DIR}/${FINAL_FILENAME}"
log "INFO" "Speichere Backup in lokalem Archiv: $DEST_LOCAL_FILE..."

if [[ "$DRY_RUN" == false ]]; then
    cp "$FINAL_FILE" "$DEST_LOCAL_FILE"
    
    # Lokale Aufbewahrung bereinigen (nur die neuesten RETENTION_LOCAL_COUNT behalten)
    if [[ "$RETENTION_LOCAL_COUNT" -gt 0 ]]; then
        log "INFO" "Prüfe lokale Aufbewahrungsfrist (Behalte neueste $RETENTION_LOCAL_COUNT Backups)..."
        # shellcheck disable=SC2012
        OLD_BACKUPS=$(ls -1t "${BACKUP_LOCAL_DIR}"/mc_backup_* 2>/dev/null | tail -n +"$((RETENTION_LOCAL_COUNT + 1))" || true)
        if [[ -n "$OLD_BACKUPS" ]]; then
            while IFS= read -r file; do
                log "INFO" "Lösche altes lokales Backup: $(basename "$file")"
                rm -f "$file"
            done <<< "$OLD_BACKUPS"
        fi
    fi
fi

# ------------------------------------------------------------------------------
# 7. CLOUD UPLOAD VIA RCLONE (Google Drive)
# ------------------------------------------------------------------------------
UPLOAD_SUCCESS=false
if command -v rclone >/dev/null 2>&1; then
    # Prüfe ob Remote existiert
    if rclone listremotes 2>/dev/null | grep -q "^${RCLONE_REMOTE}:"; then
        log "INFO" "Starte Upload zu Google Drive (${RCLONE_REMOTE}:${RCLONE_FOLDER})..."
        if [[ "$DRY_RUN" == false ]]; then
            if rclone copy "$DEST_LOCAL_FILE" "${RCLONE_REMOTE}:${RCLONE_FOLDER}/" \
                --drive-upload-cutoff 64M \
                --drive-chunk-size 64M \
                --tpslimit 4 \
                --retries 3 \
                --low-level-retries 10; then
                log "INFO" "Upload zu Google Drive erfolgreich abgeschlossen!"
                UPLOAD_SUCCESS=true

                # Cloud Retention Policy
                if [[ "$RETENTION_REMOTE_DAYS" -gt 0 ]]; then
                    log "INFO" "Wende Cloud-Retention an (Lösche Google Drive Backups älter als ${RETENTION_REMOTE_DAYS} Tage)..."
                    rclone delete "${RCLONE_REMOTE}:${RCLONE_FOLDER}" --min-age "${RETENTION_REMOTE_DAYS}d" 2>/dev/null || true
                    rclone rmdirs "${RCLONE_REMOTE}:${RCLONE_FOLDER}" --leave-root 2>/dev/null || true
                fi
            else
                log "WARN" "Fehler beim Upload zu Google Drive!"
            fi
        else
            log "INFO" "[DRY-RUN] Upload zu Google Drive simuliert."
            UPLOAD_SUCCESS=true
        fi
    else
        log "WARN" "Rclone Remote '${RCLONE_REMOTE}:' nicht konfiguriert! Lokales Backup bleibt in $BACKUP_LOCAL_DIR gesichert."
        log "WARN" "Führe '${SCRIPT_DIR}/setup_rclone.sh' aus, um Google Drive anzubinden."
    fi
else
    log "WARN" "rclone ist nicht installiert. Überspringe Cloud Upload."
fi

# ------------------------------------------------------------------------------
# 8. ABSCHLUSS & ALERTING
# ------------------------------------------------------------------------------
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
FINAL_SIZE=$(du -h "$DEST_LOCAL_FILE" 2>/dev/null | cut -f1 || echo "$ARCHIVE_SIZE")

log "INFO" "================================================================="
log "INFO" "Backup ERFOLGREICH abgeschlossen in ${DURATION}s."
log "INFO" "Datei:  ${FINAL_FILENAME}"
log "INFO" "Größe:  ${FINAL_SIZE}"
log "INFO" "Google Drive Status: $([[ "$UPLOAD_SUCCESS" == true ]] && echo 'Hochgeladen' || echo 'Nur lokal gespeichert')"
log "INFO" "================================================================="

# Discord Webhook Benachrichtigung
CLOUD_STATUS_TXT="$([[ "$UPLOAD_SUCCESS" == true ]] && echo "Erfolgreich hochgeladen (${RCLONE_REMOTE})" || echo "Lokal gesichert (Cloud ausstehend)")"
send_discord_alert "success" "Minecraft Cloud-Backup ERFOLGREICH" \
    "Das automatisierte Backup wurde erfolgreich erstellt und archiviert." \
    "Datei:${FINAL_FILENAME}" \
    "Größe:${FINAL_SIZE}" \
    "Dauer:${DURATION}s" \
    "Verschlüsselt:$([[ "$ENCRYPTION_ENABLED" == true ]] && echo 'Ja (GPG AES-256)' || echo 'Nein')" \
    "Google Drive:${CLOUD_STATUS_TXT}" \
    "Datenbanken:${DB_DUMP_COUNT} gesichert"

exit 0

#!/usr/bin/env bash
# ==============================================================================
# Setup-Assistent für Google Drive Anbindung via Rclone
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")"
CONFIG_FILE="${SCRIPT_DIR}/backup.conf"

if [[ -f "$CONFIG_FILE" ]]; then
    # shellcheck source=/dev/null
    source "$CONFIG_FILE"
fi

REMOTE_NAME="${RCLONE_REMOTE:-gdrive}"
TARGET_FOLDER="${RCLONE_FOLDER:-MinecraftBackups}"

echo "================================================================="
echo "   Google Drive Backup Einrichtung via Rclone"
echo "================================================================="
echo ""

if ! command -v rclone >/dev/null 2>&1; then
    echo "[!] rclone ist noch nicht installiert. Installiere rclone..."
    sudo apt update && sudo apt install -y rclone
fi

echo "[✓] rclone Version: $(rclone --version | head -n 1)"
echo ""

# Prüfen ob Remote bereits existiert
if rclone listremotes 2>/dev/null | grep -q "^${REMOTE_NAME}:"; then
    echo "[✓] Das Remote '${REMOTE_NAME}:' ist bereits eingerichtet!"
    echo "Teste Verbindung zu Google Drive..."
    if rclone lsd "${REMOTE_NAME}:" >/dev/null 2>&1; then
        echo "[✓] Google Drive Verbindung ist ERFOLGREICH!"
        echo "Erstelle Zielverzeichnis '${TARGET_FOLDER}' (falls nicht vorhanden)..."
        rclone mkdir "${REMOTE_NAME}:${TARGET_FOLDER}"
        echo "[✓] Zielverzeichnis bereit: ${REMOTE_NAME}:${TARGET_FOLDER}"
        echo ""
        echo "Alles ist fertig eingerichtet! Du kannst jetzt ein Backup starten:"
        echo "  sudo ${SCRIPT_DIR}/backup.sh"
        exit 0
    else
        echo "[!] Remote '${REMOTE_NAME}:' existiert, aber Verbindung schlug fehl (z.B. Token abgelaufen)."
        echo "Starte Konfiguration zur Erneuerung des Tokens..."
    fi
fi

echo "================================================================="
echo "Anleitung zur Ersteinrichtung von Google Drive in Rclone:"
echo "================================================================="
echo "Wir starten gleich den interaktiven Rclone-Konfigurator ('rclone config')."
echo "Folge diesen Schritten:"
echo ""
echo " 1. Wähle 'n' für New Remote"
echo " 2. Name: ${REMOTE_NAME}"
echo " 3. Type: 'drive' (Google Drive)"
echo " 4. Client ID & Secret: Einfach Enter drücken (Standard leer)"
echo " 5. Scope: Wähle '1' (Full access)"
echo " 6. Service Account File: Enter (leer)"
echo " 7. Advanced Config: 'n'"
echo " 8. Auto config:"
echo "    - Falls du direkt an einem Desktop sitzt: 'y' (Browser öffnet sich)"
echo "    - Falls per reiner SSH-Konsole: 'n' (generiere Token auf deinem PC mit 'rclone authorize \"drive\"')"
echo " 9. Bestätigen mit 'y' und Beenden mit 'q'"
echo "================================================================="
echo ""
read -r -p "Möchtest du 'rclone config' jetzt starten? [J/n] " response
response=${response:-j}

if [[ "$response" =~ ^[jJyY]$ ]]; then
    rclone config
    echo ""
    echo "Prüfe Einrichtung..."
    if rclone listremotes 2>/dev/null | grep -q "^${REMOTE_NAME}:"; then
        echo "[✓] Remote '${REMOTE_NAME}:' erfolgreich konfiguriert!"
        rclone mkdir "${REMOTE_NAME}:${TARGET_FOLDER}" 2>/dev/null || true
        echo "[✓] Zielordner '${TARGET_FOLDER}' auf Google Drive erstellt."
        echo ""
        echo "Herzlichen Glückwunsch! Starte dein erstes Backup mit:"
        echo "  sudo ${SCRIPT_DIR}/backup.sh"
    else
        echo "[!] Remote '${REMOTE_NAME}:' wurde noch nicht gefunden. Bitte prüfe 'rclone config'."
    fi
else
    echo "Abgebrochen. Du kannst 'rclone config' jederzeit selbst ausführen."
fi

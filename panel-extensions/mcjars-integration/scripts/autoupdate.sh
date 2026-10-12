#!/usr/bin/env bash
# ==============================================================================
# Auto-Core-Update Script for Minecraft Servers (Pterodactyl & Reviactyl)
# Version: 1.2.0
# Description: Queries the official API of the active server software (PaperMC Fill v3,
#              Purpur API v2, or Universal MCJars API for all 28 engines) and updates
#              server.jar automatically to the latest stable build before server boot.
# ==============================================================================

set -u

SCRIPT_VERSION="1.2.0"
CONFIG_FILE=".server_core.json"
STATE_FILE=".current_build"
USER_AGENT="AutoCoreUpdater/${SCRIPT_VERSION} (pterodactyl-server)"

# --- Color Output Helpers ---
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log_info()  { echo -e "${BLUE}[Auto-Core-Update]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[Auto-Core-Update]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[Auto-Core-Update] WARNUNG:${NC} $1"; }
log_error() { echo -e "${RED}[Auto-Core-Update] FEHLER:${NC} $1"; }

# --- Portable JSON Extraction Helpers (No jq dependency required) ---
get_json_value() {
    local key="$1"
    local json="$2"
    if command -v jq >/dev/null 2>&1; then
        echo "$json" | jq -r ".$key // empty" 2>/dev/null
    else
        echo "$json" | grep -o "\"$key\"[ ]*:[ ]*\"[^\"]*\"" | head -n 1 | sed -e "s/\"$key\"[ ]*:[ ]*\"//" -e 's/"$//'
    fi
}

# --- 1. Load Configuration & Defaults ---
SOFTWARE="${SERVER_SOFTWARE:-}"
MC_VERSION="${MINECRAFT_VERSION:-${SERVER_VERSION:-${MC_VERSION:-}}}"
TARGET_JAR="${SERVER_JARFILE:-server.jar}"
BACKUP="true"
CURRENT_BUILD=""

if [ -f "$CONFIG_FILE" ]; then
    CONFIG_CONTENT=$(cat "$CONFIG_FILE" 2>/dev/null || true)
    CFG_SW=$(get_json_value "software" "$CONFIG_CONTENT")
    CFG_VER=$(get_json_value "version" "$CONFIG_CONTENT")
    CFG_JAR=$(get_json_value "target_jar" "$CONFIG_CONTENT")
    CFG_BAK=$(get_json_value "backup" "$CONFIG_CONTENT")
    CFG_BUILD=$(get_json_value "installed_build" "$CONFIG_CONTENT")
    
    [ -n "$CFG_SW" ] && SOFTWARE="$CFG_SW"
    [ -n "$CFG_VER" ] && MC_VERSION="$CFG_VER"
    [ -n "$CFG_JAR" ] && TARGET_JAR="$CFG_JAR"
    [ -n "$CFG_BAK" ] && BACKUP="$CFG_BAK"
    [ -n "$CFG_BUILD" ] && CURRENT_BUILD="$CFG_BUILD"
fi

# Fallback: check state file for current build
if [ -z "$CURRENT_BUILD" ] && [ -f "$STATE_FILE" ]; then
    CURRENT_BUILD=$(head -n 1 "$STATE_FILE" 2>/dev/null | tr -d ' \r\n')
fi

# Fallback auto-detection if software is not specified
if [ -z "$SOFTWARE" ]; then
    if [ -f "purpur.yml" ]; then
        SOFTWARE="purpur"
    elif [ -f "paper.yml" ] || [ -f "config/paper-global.yml" ]; then
        SOFTWARE="paper"
    elif [ -f "velocity.toml" ]; then
        SOFTWARE="velocity"
    elif [ -f "waterfall.yml" ]; then
        SOFTWARE="waterfall"
    else
        SOFTWARE="paper"
    fi
fi

# Normalize software name to lowercase
SOFTWARE=$(echo "$SOFTWARE" | tr '[:upper:]' '[:lower:]' | tr -d ' ')

# Fallback Minecraft version if empty
if [ -z "$MC_VERSION" ]; then
    MC_VERSION="1.21.4"
fi

log_info "=================================================="
log_info "Minecraft Server Auto-Core-Updater v${SCRIPT_VERSION}"
log_info "Software: ${SOFTWARE} | Version: ${MC_VERSION} | Target: ${TARGET_JAR}"
log_info "Aktuell installierter Build: #${CURRENT_BUILD:-unbekannt}"
log_info "=================================================="

# --- 2. Query API based on Software ---
LATEST_BUILD=""
DOWNLOAD_URL=""
API_NAME=""

fetch_url() {
    local url="$1"
    if command -v curl >/dev/null 2>&1; then
        curl -sSL --connect-timeout 8 --max-time 15 -H "User-Agent: $USER_AGENT" "$url"
    elif command -v wget >/dev/null 2>&1; then
        wget -qO- --timeout=15 --user-agent="$USER_AGENT" "$url"
    else
        return 1
    fi
}

case "$SOFTWARE" in
    paper|folia|velocity|waterfall)
        API_NAME="PaperMC API (Fill v3)"
        log_info "Frage ${API_NAME} fuer ${SOFTWARE} ${MC_VERSION} ab..."
        
        API_RES=$(fetch_url "https://fill.papermc.io/v3/projects/${SOFTWARE}/versions/${MC_VERSION}")
        if [ -n "$API_RES" ]; then
            if command -v jq >/dev/null 2>&1; then
                LATEST_BUILD=$(echo "$API_RES" | jq -r '.builds[0] // empty' 2>/dev/null)
            else
                LATEST_BUILD=$(echo "$API_RES" | grep -o '"builds"[ ]*:[ ]*\[[0-9, ]*\]' | grep -o '[0-9]\+' | head -n 1)
            fi
            
            if [ -n "$LATEST_BUILD" ]; then
                BUILD_RES=$(fetch_url "https://fill.papermc.io/v3/projects/${SOFTWARE}/versions/${MC_VERSION}/builds/${LATEST_BUILD}")
                if command -v jq >/dev/null 2>&1; then
                    DOWNLOAD_URL=$(echo "$BUILD_RES" | jq -r '.downloads["server:default"].url // empty' 2>/dev/null)
                else
                    DOWNLOAD_URL=$(echo "$BUILD_RES" | grep -o '"url"[ ]*:[ ]*"https://[^"]*"' | head -n 1 | cut -d'"' -f4)
                fi
            fi
        fi
        ;;
        
    purpur)
        API_NAME="Purpur API (v2)"
        log_info "Frage ${API_NAME} fuer Purpur ${MC_VERSION} ab..."
        
        API_RES=$(fetch_url "https://api.purpurmc.org/v2/purpur/${MC_VERSION}")
        if [ -n "$API_RES" ]; then
            if command -v jq >/dev/null 2>&1; then
                LATEST_BUILD=$(echo "$API_RES" | jq -r '.builds.latest // empty' 2>/dev/null)
            else
                LATEST_BUILD=$(echo "$API_RES" | grep -o '"latest"[ ]*:[ ]*"[^"]*"' | head -n 1 | cut -d'"' -f4)
            fi
            
            if [ -n "$LATEST_BUILD" ]; then
                DOWNLOAD_URL="https://api.purpurmc.org/v2/purpur/${MC_VERSION}/${LATEST_BUILD}/download"
            fi
        fi
        ;;
esac

# Fallback: Query Universal MCJars API if native API failed or for any other server software (Leaf, Fabric, NeoForge, etc.)
if [ -z "$DOWNLOAD_URL" ] || [ -z "$LATEST_BUILD" ]; then
    API_NAME="MCJars Universal API (v3)"
    log_info "Frage ${API_NAME} fuer ${SOFTWARE} ${MC_VERSION} ab..."
    
    API_RES=$(fetch_url "https://mcjars.app/api/v3/builds/types/${SOFTWARE}/versions/${MC_VERSION}/latest")
    if [ -n "$API_RES" ]; then
        if command -v jq >/dev/null 2>&1; then
            LATEST_BUILD=$(echo "$API_RES" | jq -r '.build.name // .build.uuid // empty' 2>/dev/null | tr -d '#')
            DOWNLOAD_URL=$(echo "$API_RES" | jq -r '.build.installation[0][0].url // .build.download_url // empty' 2>/dev/null)
        else
            LATEST_BUILD=$(echo "$API_RES" | grep -o '"name"[ ]*:[ ]*"[^"]*"' | head -n 1 | cut -d'"' -f4 | tr -d '#')
            DOWNLOAD_URL=$(echo "$API_RES" | grep -o '"url"[ ]*:[ ]*"https://[^"]*"' | head -n 1 | cut -d'"' -f4)
        fi
    fi
fi

# --- 3. Validate API Response ---
if [ -z "$DOWNLOAD_URL" ] || [ -z "$LATEST_BUILD" ]; then
    log_warn "Konnte neuesten Build nicht ueber API ermitteln oder Verbindung fehlgeschlagen."
    if [ -f "$TARGET_JAR" ]; then
        log_info "Bestehende ${TARGET_JAR} vorhanden. Serverstart wird fortgesetzt..."
        exit 0
    else
        log_error "Keine ${TARGET_JAR} vorhanden und API nicht erreichbar!"
        exit 1
    fi
fi

log_ok "Neuester stabiler Build laut API (${API_NAME}): #${LATEST_BUILD}"

# --- 4. Check if Update is Needed ---
if [ -f "$TARGET_JAR" ] && [ -n "$CURRENT_BUILD" ] && [ "$CURRENT_BUILD" = "$LATEST_BUILD" ]; then
    log_ok "${TARGET_JAR} ist bereits auf dem neuesten Stand (Build #${LATEST_BUILD}). Kein Update noetig."
    exit 0
fi

# --- 5. Perform Update ---
log_info "Update verfuegbar: #${CURRENT_BUILD:-keiner} -> #${LATEST_BUILD}"

# Backup existing JAR
if [ -f "$TARGET_JAR" ] && [ "$BACKUP" = "true" ]; then
    log_info "Erstelle Backup: ${TARGET_JAR} -> ${TARGET_JAR}.bak..."
    cp -f "$TARGET_JAR" "${TARGET_JAR}.bak" 2>/dev/null || true
fi

# Atomic Download to Temporary File
TMP_JAR="${TARGET_JAR}.tmp.$$"
log_info "Lade Build #${LATEST_BUILD} herunter..."

DOWNLOAD_SUCCESS=false
if command -v curl >/dev/null 2>&1; then
    if curl -sSL --connect-timeout 10 -H "User-Agent: $USER_AGENT" "$DOWNLOAD_URL" -o "$TMP_JAR"; then
        DOWNLOAD_SUCCESS=true
    fi
elif command -v wget >/dev/null 2>&1; then
    if wget -qO "$TMP_JAR" --timeout=30 --user-agent="$USER_AGENT" "$DOWNLOAD_URL"; then
        DOWNLOAD_SUCCESS=true
    fi
fi

# Validate download size (> 1MB)
FILE_SIZE=0
if [ -f "$TMP_JAR" ]; then
    FILE_SIZE=$(wc -c < "$TMP_JAR" 2>/dev/null || echo 0)
fi

if [ "$DOWNLOAD_SUCCESS" = "true" ] && [ "$FILE_SIZE" -gt 1048576 ]; then
    mv -f "$TMP_JAR" "$TARGET_JAR"
    chmod +x "$TARGET_JAR" 2>/dev/null || true
    
    echo "$LATEST_BUILD" > "$STATE_FILE"
    
    # Update config file
    NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date)
    cat <<EOF > "$CONFIG_FILE"
{
  "software": "${SOFTWARE}",
  "version": "${MC_VERSION}",
  "target_jar": "${TARGET_JAR}",
  "installed_build": "${LATEST_BUILD}",
  "backup": ${BACKUP},
  "last_updated": "${NOW}"
}
EOF

    SIZE_MB=$(( FILE_SIZE / 1048576 ))
    log_ok "Update erfolgreich abgeschlossen! ${TARGET_JAR} (${SIZE_MB} MB) ist nun auf Build #${LATEST_BUILD}."
else
    log_error "Download fehlgeschlagen oder unvollstaendig (Groesse: ${FILE_SIZE} Bytes)."
    rm -f "$TMP_JAR" 2>/dev/null || true
    if [ -f "$TARGET_JAR" ]; then
        log_warn "Behalte vorhandene ${TARGET_JAR} bei. Serverstart wird fortgesetzt..."
    fi
fi

log_info "Serverstart wird jetzt fortgesetzt..."
exit 0

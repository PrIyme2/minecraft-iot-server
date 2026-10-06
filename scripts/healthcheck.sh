#!/usr/bin/env bash
# ==============================================================================
# 🩺 Minecraft & IoT Ecosystem Health Check Diagnostic Tool
# ==============================================================================
# Comprehensive automated diagnosis of all services, network ports, DNS views,
# Tailscale tunnels, and microservices in the infrastructure.
# ==============================================================================

set -u

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

pass_count=0
fail_count=0
warn_count=0

check_service() {
    local svc="$1"
    local desc="$2"
    if systemctl is-active --quiet "$svc" 2>/dev/null; then
        echo -e "  [${GREEN}OK${NC}] $desc ($svc) is running"
        ((pass_count++))
    else
        echo -e "  [${RED}FAIL${NC}] $desc ($svc) is NOT running"
        ((fail_count++))
    fi
}

check_port() {
    local host="$1"
    local port="$2"
    local desc="$3"
    if nc -z -w 2 "$host" "$port" 2>/dev/null; then
        echo -e "  [${GREEN}OK${NC}] $desc ($host:$port) is listening"
        ((pass_count++))
    else
        echo -e "  [${RED}FAIL${NC}] $desc ($host:$port) is unreachable"
        ((fail_count++))
    fi
}

check_http() {
    local url="$1"
    local desc="$2"
    local code
    code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 "$url" 2>/dev/null || echo "000")
    if [[ "$code" =~ ^(200|301|302)$ ]]; then
        echo -e "  [${GREEN}OK${NC}] $desc ($url) returned HTTP $code"
        ((pass_count++))
    else
        echo -e "  [${YELLOW}WARN${NC}] $desc ($url) returned HTTP $code"
        ((warn_count++))
    fi
}

echo -e "\n${BLUE}==================================================================${NC}"
echo -e "${BLUE}       🩺 Minecraft Server & IoT Ecosystem Health Check         ${NC}"
echo -e "${BLUE}==================================================================${NC}\n"

# 1. System Services
echo -e "${BLUE}▶ 1. Core System Services${NC}"
check_service "named" "BIND9 DNS Server"
check_service "nginx" "Nginx Reverse Proxy"
check_service "agent.service" "Pterodactyl / Reviactyl Agent"
check_service "mc-control.service" "ESP32 IoT Bridge Service"
check_service "tailscaled" "Tailscale Mesh VPN Daemon"

# 2. Port Listeners
echo -e "\n${BLUE}▶ 2. Network Sockets & Port Reachability${NC}"
check_port "127.0.0.1" 53 "DNS (Localhost)"
check_port "127.0.0.1" 80 "Nginx Webserver"
check_port "127.0.0.1" 5000 "IoT Bridge REST API"
check_port "127.0.0.1" 8080 "Agent WebSocket Daemon"
check_port "127.0.0.1" 25565 "Minecraft Server Port"

# 3. DNS Resolution
echo -e "\n${BLUE}▶ 3. BIND9 Split-View DNS Resolution${NC}"
lan_res=$(dig @127.0.0.1 mc.server.priyme +short 2>/dev/null || echo "NONE")
if [[ "$lan_res" == "192.168.0.33" ]]; then
    echo -e "  [${GREEN}OK${NC}] LAN View: mc.server.priyme -> $lan_res"
    ((pass_count++))
else
    echo -e "  [${RED}FAIL${NC}] LAN View resolution failed: expected 192.168.0.33, got $lan_res"
    ((fail_count++))
fi

if ip addr show tailscale0 >/dev/null 2>&1; then
    ts_ip=$(tailscale ip -4 2>/dev/null || echo "")
    if [[ -n "$ts_ip" ]]; then
        ts_res=$(dig -b "$ts_ip" @"$ts_ip" mc.server.priyme +short 2>/dev/null || echo "NONE")
        if [[ "$ts_res" == "$ts_ip" ]]; then
            echo -e "  [${GREEN}OK${NC}] Tailscale View: mc.server.priyme -> $ts_res"
            ((pass_count++))
        else
            echo -e "  [${YELLOW}WARN${NC}] Tailscale View resolution: expected $ts_ip, got $ts_res"
            ((warn_count++))
        fi
    fi
fi

# 4. HTTP / REST Endpoints
echo -e "\n${BLUE}▶ 4. HTTP Endpoints & API Health${NC}"
check_http "http://127.0.0.1/api/status" "Local IoT Bridge Status"
check_http "http://127.0.0.1/" "Pterodactyl Web Panel"
check_http "https://prime.tail923f91.ts.net/api/status" "Tailscale Funnel IoT Status"

# 5. Docker Containers
echo -e "\n${BLUE}▶ 5. Docker Minecraft Container Status${NC}"
if docker ps --format '{{.Names}}' | grep -q "15978df8-7342-4713-8d50-3f15de6cc95d"; then
    echo -e "  [${GREEN}OK${NC}] Minecraft Container (15978df8...) is running"
    ((pass_count++))
else
    echo -e "  [${RED}FAIL${NC}] Minecraft Container is NOT running"
    ((fail_count++))
fi

# Summary
echo -e "\n${BLUE}==================================================================${NC}"
echo -e "  Diagnose abgeschlossen: ${GREEN}$pass_count Erfolgreich${NC} | ${YELLOW}$warn_count Warnungen${NC} | ${RED}$fail_count Fehler${NC}"
echo -e "${BLUE}==================================================================${NC}\n"

if [[ $fail_count -gt 0 ]]; then
    exit 1
fi
exit 0

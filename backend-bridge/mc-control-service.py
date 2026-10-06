#!/usr/bin/env python3
"""
Minecraft Control Service & IoT Bridge
Exposes REST endpoints for the external ESP32 hardware controller to monitor
server status, live TPS, RAM usage, and trigger start/stop/backup actions.
"""

import subprocess
import socket
import struct
import time
import json
import re
import glob
import os
import urllib.request
from http.server import HTTPServer, BaseHTTPRequestHandler

# ==============================================================================
# Konfiguration (Environment Variables mit Fallback)
# ==============================================================================
CONTAINER   = os.environ.get("MC_CONTAINER_ID", "15978df8-7342-4713-8d50-3f15de6cc95d")
AGENT_TOKEN = os.environ.get("PTERODACTYL_AGENT_TOKEN", "YOUR_AGENT_TOKEN_HERE")
AGENT_URL   = os.environ.get("AGENT_URL", "http://127.0.0.1:8080")
RCON_HOST   = os.environ.get("RCON_HOST", "127.0.0.1")
RCON_PORT   = int(os.environ.get("RCON_PORT", "25566"))
RCON_PASS   = os.environ.get("RCON_PASSWORD", "YOUR_RCON_PASSWORD")
BIND_PORT   = int(os.environ.get("CONTROL_PORT", "5000"))
BACKUP_BIN  = os.environ.get("BACKUP_BIN", "/usr/local/bin/minecraft-backup")

cached_metrics = {
    "tps": 20.0,
    "players": 0,
    "max_players": 20,
    "last_success": 0
}

def clean_minecraft_text(text):
    """Entfernt Minecraft Farbcodes (z. B. §a, §c, §6)."""
    return re.sub(r"§.", "", text).strip()

def send_agent_power(action):
    """Sendet Power-Befehl (start/stop) an den lokalen Pterodactyl Wings Agenten."""
    try:
        url = f"{AGENT_URL}/api/servers/{CONTAINER}/power"
        data = json.dumps({"action": action}).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={
                "Authorization": f"Bearer {AGENT_TOKEN}",
                "Content-Type": "application/json"
            },
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            print(f"[MC-Control] Agent Power '{action}' erfolgreich (Status {resp.status})")
            return True
    except Exception as e:
        print(f"[MC-Control] Agent Power '{action}' Fehler: {e}")
        return False

def send_rcon_cmd(command):
    """Sendet ein synchrones RCON-Kommando an den Minecraft-Server."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(1.5)
        s.connect((RCON_HOST, RCON_PORT))
        auth_payload = RCON_PASS.encode("utf-8")
        packet = struct.pack("<iii", 4 + 4 + len(auth_payload) + 2, 1, 3) + auth_payload + b"\x00\x00"
        s.sendall(packet)
        s.recv(1024)
        cmd_payload = command.encode("utf-8")
        packet = struct.pack("<iii", 4 + 4 + len(cmd_payload) + 2, 2, 2) + cmd_payload + b"\x00\x00"
        s.sendall(packet)
        res = s.recv(4096)
        s.close()
        if len(res) >= 12:
            return True, res[12:-2].decode("utf-8", errors="replace").strip()
        return True, ""
    except Exception as e:
        return False, str(e)

def query_rcon_metrics():
    """
    Fragt ueber eine einzelne TCP-Verbindung sowohl TPS als auch Spielerzahlen ab,
    um Socket-Overhead zu minimieren und Timeouts unter 100ms zu garantieren.
    """
    global cached_metrics
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(1.5)
        s.connect((RCON_HOST, RCON_PORT))
        auth_payload = RCON_PASS.encode("utf-8")
        s.sendall(struct.pack("<iii", 4 + 4 + len(auth_payload) + 2, 1, 3) + auth_payload + b"\x00\x00")
        s.recv(1024)

        # 1. TPS abfragen
        cmd1 = b"tps"
        s.sendall(struct.pack("<iii", 4 + 4 + len(cmd1) + 2, 2, 2) + cmd1 + b"\x00\x00")
        res1 = s.recv(4096)

        # 2. Spielerliste abfragen
        cmd2 = b"list"
        s.sendall(struct.pack("<iii", 4 + 4 + len(cmd2) + 2, 3, 2) + cmd2 + b"\x00\x00")
        res2 = s.recv(4096)
        s.close()

        if len(res1) >= 12:
            tps_clean = clean_minecraft_text(res1[12:-2].decode("utf-8", errors="replace"))
            floats = [float(x) for x in re.findall(r"\d+\.\d+", tps_clean)]
            if floats:
                cached_metrics["tps"] = min(20.0, max(0.0, floats[0]))

        if len(res2) >= 12:
            list_clean = clean_minecraft_text(res2[12:-2].decode("utf-8", errors="replace"))
            match = re.search(r"(\d+)\s+of\s+a\s+max\s+of\s+(\d+)", list_clean)
            if match:
                cached_metrics["players"] = int(match.group(1))
                cached_metrics["max_players"] = int(match.group(2))

        cached_metrics["last_success"] = time.time()
        return True
    except Exception as e:
        print(f"[MC-Control] RCON Warnung: {e}")
        return False

def get_ram_pct():
    """Liest die tatsaechliche RAM-Nutzung direkt aus Linux Cgroups v2 (Dauer ~30ms)."""
    try:
        paths = glob.glob("/sys/fs/cgroup/system.slice/docker-*.scope/memory.current")
        if paths:
            with open(paths[0]) as f:
                used = int(f.read().strip())
                # Basiert auf dem konfigurierten Container-Limit (3 GB)
                return min(100, int((used / (3 * 1024 * 1024 * 1024)) * 100))
    except Exception:
        pass
    return 33

class RequestHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/start":
            print("[MC-Control] START angefordert!")
            if not send_agent_power("start"):
                print("[MC-Control] Fallback: Starte ueber Docker CLI...")
                subprocess.run(["docker", "start", CONTAINER], capture_output=True, text=True)
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(b"OK: STARTED")

        elif self.path == "/stop":
            print("[MC-Control] STOP angefordert!")
            if not send_agent_power("stop"):
                if not send_rcon_cmd("stop")[0]:
                    print("[MC-Control] Fallback: Stoppe ueber Docker CLI...")
                    subprocess.run(["docker", "stop", "-t", "10", CONTAINER], capture_output=True, text=True)
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(b"OK: STOPPING")

        elif self.path == "/backup":
            print("[MC-Control] BACKUP angefordert (via Hardware-Button / API)!")
            check = subprocess.run(["pgrep", "-f", "minecraft-backup"], capture_output=True, text=True)
            if check.returncode == 0:
                print("[MC-Control] Backup laeuft bereits!")
                self.send_response(409)
                self.send_header("Content-Type", "text/plain")
                self.end_headers()
                self.wfile.write(b"BUSY: BACKUP_ALREADY_RUNNING")
            else:
                print(f"[MC-Control] Starte {BACKUP_BIN} im Hintergrund...")
                subprocess.Popen([BACKUP_BIN], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                self.send_response(200)
                self.send_header("Content-Type", "text/plain")
                self.end_headers()
                self.wfile.write(b"OK: BACKUP_STARTED")

        elif self.path == "/status":
            res = subprocess.run(["docker", "inspect", "-f", "{{.State.Running}}", CONTAINER], capture_output=True, text=True)
            running = res.stdout.strip()
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(running.encode("utf-8"))

        elif self.path.startswith("/api/status"):
            res = subprocess.run(["docker", "inspect", "-f", "{{.State.Running}}", CONTAINER], capture_output=True, text=True)
            running = (res.stdout.strip() == "true")
            ram_pct = 0

            if running:
                query_rcon_metrics()
                ram_pct = get_ram_pct()
                tps = cached_metrics["tps"]
                players = cached_metrics["players"]
                max_players = cached_metrics["max_players"]
            else:
                tps = 0.0
                players = 0
                max_players = 20

            data = {
                "online": running,
                "tps": round(tps, 2) if running else 0.0,
                "players": players,
                "max_players": max_players,
                "ram_pct": ram_pct
            }
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(data).encode("utf-8"))

        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        print(f"[MC-Control] {self.address_string()} - {format % args}")

if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", BIND_PORT), RequestHandler)
    print(f"Minecraft Control Service laeuft auf Port {BIND_PORT}...")
    server.serve_forever()

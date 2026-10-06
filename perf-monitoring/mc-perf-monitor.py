#!/usr/bin/env python3
"""
Minecraft Performance-Monitoring & Discord-Alerting Daemon
Zyklische Ueberwachung von TPS, RAM, CPU und Online-Status mit Discord-Embeds.
"""

import os
import sys
import time
import socket
import struct
import json
import re
import subprocess
import urllib.request
from datetime import datetime, timezone

SCRIPT_DIR = os.path.dirname(os.path.realpath(__file__))
CONFIG_FILE = os.path.join(SCRIPT_DIR, "monitor.conf")

def load_config(path: str) -> dict:
    config = {
        "DISCORD_WEBHOOK_URL": "",
        "CONTAINER_NAME": "15978df8-7342-4713-8d50-3f15de6cc95d",
        "SERVER_NAME": "smp",
        "RCON_HOST": "127.0.0.1",
        "RCON_PORT": 25566,
        "RCON_PASSWORD": "your_rcon_password",
        "CHECK_INTERVAL_SECONDS": 20,
        "TPS_WARN_THRESHOLD": 17.0,
        "TPS_CRITICAL_THRESHOLD": 14.0,
        "RAM_WARN_PERCENT": 85.0,
        "RAM_CRITICAL_PERCENT": 95.0,
        "ALERT_COOLDOWN_SECONDS": 600,
        "NOTIFY_RECOVERY": True,
        "NOTIFY_ON_STARTUP": False,
    }

    if not os.path.exists(path):
        return config

    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                k, v = line.split("=", 1)
                k = k.strip()
                v = v.strip().strip('"').strip("'")
                if k in config:
                    if isinstance(config[k], bool):
                        config[k] = v.lower() in ("true", "1", "yes")
                    elif isinstance(config[k], int):
                        config[k] = int(v)
                    elif isinstance(config[k], float):
                        config[k] = float(v)
                    else:
                        config[k] = v
    return config

def run_rcon(host: str, port: int, password: str, cmd: str, timeout: float = 3.0) -> tuple[bool, str]:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(timeout)
        s.connect((host, int(port)))

        # Auth
        auth_data = password.encode("utf-8")
        packet = struct.pack("<iii", 4 + 4 + len(auth_data) + 2, 1, 3) + auth_data + b"\x00\x00"
        s.sendall(packet)
        res = s.recv(1024)

        if len(res) < 12:
            s.close()
            return False, "Auth packet too short"

        size, req_id, p_type = struct.unpack("<iii", res[:12])
        if req_id == -1:
            s.close()
            return False, "Bad RCON password"

        # Command
        cmd_data = cmd.encode("utf-8")
        packet = struct.pack("<iii", 4 + 4 + len(cmd_data) + 2, 2, 2) + cmd_data + b"\x00\x00"
        s.sendall(packet)
        res = s.recv(4096)
        s.close()

        output = ""
        if len(res) >= 12:
            output = res[12:-2].decode("utf-8", errors="replace").strip()
        return True, output
    except Exception as e:
        return False, str(e)

def parse_tps(raw_text: str) -> dict:
    # Strip Minecraft formatting codes §a, §6, etc.
    clean = re.sub(r"§[0-9a-fk-or]", "", raw_text)
    # The string typically looks like: "TPS from last 5s, 1m, 5m, 15m: 20.0, 20.1, 20.1, 20.1"
    content = clean
    if ":" in clean:
        content = clean.split(":", 1)[1]

    numbers = re.findall(r"(\d+(?:\.\d+)?)", content)
    floats = []
    for n in numbers:
        try:
            val = float(n)
            floats.append(val)
        except ValueError:
            pass

    return {
        "5s": floats[0] if len(floats) > 0 else 20.0,
        "1m": floats[1] if len(floats) > 1 else (floats[0] if len(floats) > 0 else 20.0),
        "5m": floats[2] if len(floats) > 2 else 20.0,
        "15m": floats[3] if len(floats) > 3 else 20.0,
        "raw": clean
    }

def parse_players(raw_text: str) -> tuple[int, int]:
    # Example: "There are 2 of a max of 20 players online:"
    m = re.search(r"(\d+)\s+of\s+(?:a\s+max\s+of\s+)?(\d+)", raw_text, re.IGNORECASE)
    if m:
        return int(m.group(1)), int(m.group(2))
    return 0, 20

def get_container_metrics(container_name: str) -> dict:
    res = {
        "running": False,
        "mem_used": "N/A",
        "mem_limit": "N/A",
        "mem_percent": 0.0,
        "cpu_percent": "0.0%",
        "uptime": "N/A"
    }

    try:
        # Check running state and uptime
        inspect = subprocess.run(
            ["docker", "inspect", "-f", "{{.State.Running}}|{{.State.StartedAt}}", container_name],
            capture_output=True, text=True, timeout=5
        )
        if inspect.returncode == 0:
            parts = inspect.stdout.strip().split("|")
            res["running"] = parts[0].lower() == "true"
            if len(parts) > 1 and parts[1]:
                res["started_at"] = parts[1]
    except Exception:
        return res

    if not res["running"]:
        return res

    try:
        # Docker stats
        stat = subprocess.run(
            ["docker", "stats", "--no-stream", "--format", "{{.MemUsage}}|{{.MemPerc}}|{{.CPUPerc}}", container_name],
            capture_output=True, text=True, timeout=5
        )
        if stat.returncode == 0 and "|" in stat.stdout:
            parts = stat.stdout.strip().split("|")
            mem_raw = parts[0].strip()
            if "/" in mem_raw:
                used, limit = mem_raw.split("/", 1)
                res["mem_used"] = used.strip()
                res["mem_limit"] = limit.strip()

            perc_str = parts[1].replace("%", "").strip()
            try:
                res["mem_percent"] = float(perc_str)
            except ValueError:
                res["mem_percent"] = 0.0

            res["cpu_percent"] = parts[2].strip()
    except Exception:
        pass

    return res

def send_discord_embed(webhook_url: str, title: str, description: str, color: int, fields: list = None) -> bool:
    if not webhook_url or not webhook_url.strip():
        print(f"[Discord] Kein Webhook konfiguriert. Ueberspringe Nachricht: '{title}'")
        return False

    payload = {
        "username": "Minecraft Monitoring Daemon",
        "avatar_url": "https://raw.githubusercontent.com/inventivetalentdev/minecraft-assets/1.20/assets/minecraft/textures/item/comparator.png",
        "embeds": [
            {
                "title": title,
                "description": description,
                "color": color,
                "fields": fields or [],
                "footer": {
                    "text": "Minecraft IoT & DevOps Infrastructure"
                },
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        ]
    }

    try:
        req = urllib.request.Request(
            webhook_url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "User-Agent": "MC-Perf-Monitor/1.0"
            },
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=8) as resp:
            return resp.status in (200, 204)
    except Exception as e:
        print(f"[Discord Error] Konnte Webhook nicht absenden: {e}", file=sys.stderr)
        return False

def main():
    config = load_config(CONFIG_FILE)

    if "--test" in sys.argv:
        print("Sende Test-Embed an Discord...")
        ok = send_discord_embed(
            config["DISCORD_WEBHOOK_URL"],
            "🧪 Minecraft Monitoring Test",
            "Dies ist eine Testnachricht des Performance-Monitoring-Daemons. Die Webhook-Verbindung funktioniert einwandfrei!",
            0x3498DB,
            [
                {"name": "Server", "value": config["SERVER_NAME"], "inline": True},
                {"name": "Status", "value": "Aktiv", "inline": True},
                {"name": "Intervall", "value": f"{config['CHECK_INTERVAL_SECONDS']}s", "inline": True},
            ]
        )
        if ok:
            print("Erfolgreich an Discord gesendet!")
            sys.exit(0)
        else:
            print("Fehler beim Senden! Bitte pruefe DISCORD_WEBHOOK_URL in monitor.conf", file=sys.stderr)
            sys.exit(1)

    print("==================================================")
    print("Minecraft Performance-Monitoring Daemon gestartet")
    print(f"Server: {config['SERVER_NAME']} | Container: {config['CONTAINER_NAME'][:12]}")
    print(f"RCON: {config['RCON_HOST']}:{config['RCON_PORT']}")
    print(f"Schwellwerte: TPS Warn < {config['TPS_WARN_THRESHOLD']} | RAM Warn > {config['RAM_WARN_PERCENT']}%")
    print("==================================================")

    # State tracking
    last_state = "OK"  # "OK", "WARN", "CRITICAL", "OFFLINE"
    last_alert_time = 0.0

    if config.get("NOTIFY_ON_STARTUP", False):
        send_discord_embed(
            config["DISCORD_WEBHOOK_URL"],
            "🟢 Monitoring Daemon gestartet",
            f"Die kontinuierliche Performance-Ueberwachung fuer Server `{config['SERVER_NAME']}` wurde aktiviert.",
            0x2ECC71,
            [
                {"name": "Pruefintervall", "value": f"{config['CHECK_INTERVAL_SECONDS']} Sek.", "inline": True},
                {"name": "TPS-Warnschwelle", "value": f"< {config['TPS_WARN_THRESHOLD']} TPS", "inline": True},
                {"name": "RAM-Warnschwelle", "value": f"> {config['RAM_WARN_PERCENT']} %", "inline": True},
            ]
        )

    while True:
        try:
            # 1. Container metrics
            metrics = get_container_metrics(config["CONTAINER_NAME"])
            now = time.time()

            current_state = "OK"
            reasons = []

            if not metrics["running"]:
                current_state = "OFFLINE"
                reasons.append("Docker-Container laeuft nicht (Server offline oder gecrasht)")
            else:
                # 2. RCON Query
                rcon_ok, tps_raw = run_rcon(
                    config["RCON_HOST"], config["RCON_PORT"], config["RCON_PASSWORD"], "tps"
                )

                tps_data = {"5s": 20.0, "1m": 20.0, "5m": 20.0, "15m": 20.0}
                if rcon_ok:
                    tps_data = parse_tps(tps_raw)
                else:
                    # RCON connection failed while container running
                    reasons.append(f"RCON nicht erreichbar ({tps_raw})")

                # Player count
                players_online, players_max = 0, 20
                list_ok, list_raw = run_rcon(
                    config["RCON_HOST"], config["RCON_PORT"], config["RCON_PASSWORD"], "list"
                )
                if list_ok:
                    players_online, players_max = parse_players(list_raw)

                # Check thresholds
                tps_current = tps_data["5s"]
                tps_1m = tps_data["1m"]
                ram_perc = metrics["mem_percent"]

                if tps_current < config["TPS_CRITICAL_THRESHOLD"] or tps_1m < config["TPS_CRITICAL_THRESHOLD"]:
                    current_state = "CRITICAL"
                    reasons.append(f"Kritischer TPS-Einbruch: {tps_current:.1f} TPS (1m: {tps_1m:.1f})")
                elif ram_perc >= config["RAM_CRITICAL_PERCENT"]:
                    current_state = "CRITICAL"
                    reasons.append(f"Kritischer RAM-Verbrauch: {ram_perc:.1f}% ({metrics['mem_used']} / {metrics['mem_limit']})")
                elif tps_current < config["TPS_WARN_THRESHOLD"] or tps_1m < config["TPS_WARN_THRESHOLD"]:
                    if current_state != "CRITICAL":
                        current_state = "WARN"
                    reasons.append(f"Performance-Einbruch: {tps_current:.1f} TPS (1m: {tps_1m:.1f})")
                elif ram_perc >= config["RAM_WARN_PERCENT"]:
                    if current_state != "CRITICAL":
                        current_state = "WARN"
                    reasons.append(f"Hoher RAM-Verbrauch: {ram_perc:.1f}% ({metrics['mem_used']} / {metrics['mem_limit']})")

            # Logging to stdout
            timestamp_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            if metrics["running"]:
                print(f"[{timestamp_str}] [STATUS: {current_state}] TPS: {tps_data['5s']:.1f} | RAM: {metrics['mem_used']} ({metrics['mem_percent']:.1f}%) | CPU: {metrics['cpu_percent']} | Spieler: {players_online}/{players_max}")
            else:
                print(f"[{timestamp_str}] [STATUS: {current_state}] Server ist gestoppt.")

            # Alert evaluation
            state_changed = (current_state != last_state)
            cooldown_expired = (now - last_alert_time) >= config["ALERT_COOLDOWN_SECONDS"]

            if current_state in ("WARN", "CRITICAL", "OFFLINE"):
                if state_changed or cooldown_expired:
                    color = 0xE74C3C if current_state in ("CRITICAL", "OFFLINE") else 0xF1C40F
                    icon = "🚨" if current_state in ("CRITICAL", "OFFLINE") else "⚠️"
                    title = f"{icon} Minecraft Server Alarm: {current_state}"
                    desc = "\n".join([f"• {r}" for r in reasons])

                    fields = [
                        {"name": "Server", "value": config["SERVER_NAME"], "inline": True},
                        {"name": "CPU-Last", "value": metrics["cpu_percent"], "inline": True},
                        {"name": "RAM", "value": f"{metrics['mem_used']} ({metrics['mem_percent']:.1f}%)", "inline": True},
                    ]
                    if metrics["running"]:
                        fields.insert(1, {"name": "TPS (5s / 1m)", "value": f"{tps_data['5s']:.1f} / {tps_data['1m']:.1f}", "inline": True})
                        fields.append({"name": "Spieler", "value": f"{players_online} / {players_max}", "inline": True})

                    send_discord_embed(config["DISCORD_WEBHOOK_URL"], title, desc, color, fields)
                    last_alert_time = now

            elif current_state == "OK" and last_state in ("WARN", "CRITICAL", "OFFLINE"):
                # Recovery notification
                if config.get("NOTIFY_RECOVERY", True):
                    send_discord_embed(
                        config["DISCORD_WEBHOOK_URL"],
                        "✅ Entwarnung: Minecraft Server stabilisiert",
                        f"Die Server-Performance fuer `{config['SERVER_NAME']}` hat sich normalisiert. Alle Metriken liegen wieder im Sollbereich.",
                        0x2ECC71,
                        [
                            {"name": "Live-TPS", "value": f"{tps_data['5s']:.1f}", "inline": True},
                            {"name": "RAM", "value": f"{metrics['mem_used']} ({metrics['mem_percent']:.1f}%)", "inline": True},
                            {"name": "CPU-Last", "value": metrics["cpu_percent"], "inline": True},
                        ]
                    )

            last_state = current_state

        except Exception as e:
            print(f"[Loop Exception] {e}", file=sys.stderr)

        time.sleep(config["CHECK_INTERVAL_SECONDS"])

if __name__ == "__main__":
    main()

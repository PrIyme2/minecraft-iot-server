#!/usr/bin/env python3
"""
Discord Webhook Notifier for Minecraft Backup Pipeline.
Sends rich embed messages on backup success or failure.
"""
import sys
import json
import urllib.request
from datetime import datetime, timezone

def send_embed(webhook_url: str, title: str, description: str, color: int, fields: list = None):
    if not webhook_url or not webhook_url.strip():
        return True

    payload = {
        "username": "Minecraft Backup Pipeline",
        "avatar_url": "https://raw.githubusercontent.com/inventivetalentdev/minecraft-assets/1.20/assets/minecraft/textures/item/ender_chest.png",
        "embeds": [
            {
                "title": title,
                "description": description,
                "color": color,
                "fields": fields or [],
                "footer": {
                    "text": "Minecraft Automated Infrastructure"
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
                "User-Agent": "MinecraftBackupPipeline/1.0"
            },
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status in (200, 204)
    except Exception as e:
        print(f"[Discord Webhook Error] {e}", file=sys.stderr)
        return False

if __name__ == "__main__":
    if len(sys.argv) < 5:
        print(f"Usage: {sys.argv[0]} <webhook_url> <status:success|error> <title> <description> [field_name:field_value ...]", file=sys.stderr)
        sys.exit(1)

    url = sys.argv[1]
    status = sys.argv[2].lower()
    title = sys.argv[3]
    description = sys.argv[4]

    color = 0x2ECC71 if status == "success" else 0xE74C3C  # Green or Red

    fields = []
    for arg in sys.argv[5:]:
        if ":" in arg:
            k, v = arg.split(":", 1)
            fields.append({"name": k.strip(), "value": v.strip(), "inline": True})

    send_embed(url, title, description, color, fields)

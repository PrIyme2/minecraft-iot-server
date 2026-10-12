#!/usr/bin/env python3
"""
Sync Google Drive Minecraft Backups into Reviactyl / Pterodactyl Database.
Filters strictly for Minecraft backups (mc_backup_*.tar.gz.gpg) and updates
the 'panel.backups' table for server_id = 1 using the local mariadb client.
Reads DB credentials dynamically from /var/www/pterodactyl/.env or environment.
"""

import subprocess
import re
import uuid
import datetime
import os
import sys

def get_db_credentials():
    """Reads DB credentials dynamically from .env or environment variables."""
    creds = {
        "user": os.environ.get("DB_USERNAME", "pterodactyl"),
        "pass": os.environ.get("DB_PASSWORD", ""),
        "host": os.environ.get("DB_HOST", "127.0.0.1"),
        "name": os.environ.get("DB_DATABASE", "panel"),
    }
    env_file = "/var/www/pterodactyl/.env"
    if os.path.exists(env_file):
        try:
            with open(env_file, "r") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("DB_USERNAME="):
                        creds["user"] = line.split("=", 1)[1].strip('"\'')
                    elif line.startswith("DB_PASSWORD="):
                        creds["pass"] = line.split("=", 1)[1].strip('"\'')
                    elif line.startswith("DB_HOST="):
                        creds["host"] = line.split("=", 1)[1].strip('"\'')
                    elif line.startswith("DB_DATABASE="):
                        creds["name"] = line.split("=", 1)[1].strip('"\'')
        except Exception:
            pass
    return creds

SERVER_ID = 1
RCLONE_TARGET = "gdrive:MinecraftBackups/"
BACKUP_REGEX = re.compile(r"^mc_backup_(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2})\.tar\.gz\.gpg$")

def run_db_query(query, fetch_json=False):
    """Executes a MariaDB SQL query."""
    creds = get_db_credentials()
    cmd = [
        "mariadb",
        "-u", creds["user"],
        f"-p{creds['pass']}",
        "-h", creds["host"],
        creds["name"],
        "-e", query
    ]
    if fetch_json:
        cmd.insert(-2, "--batch")
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return res.stdout
    except subprocess.CalledProcessError as e:
        print(f"[DB Error] {e.stderr}", file=sys.stderr)
        return None

def fetch_gdrive_backups():
    """Fetches and parses Minecraft backup files from Google Drive."""
    try:
        res = subprocess.run(
            ["rclone", "lsl", RCLONE_TARGET],
            capture_output=True,
            text=True,
            check=True,
            timeout=30
        )
    except Exception as e:
        print(f"[Error] Failed to execute rclone: {e}", file=sys.stderr)
        return []

    backups = []
    # Line format: '  128873806 2026-10-09 17:46:49.013000000 mc_backup_2026-10-09_17-46-42.tar.gz.gpg'
    for line in res.stdout.strip().splitlines():
        parts = line.strip().split(None, 3)
        if len(parts) < 4:
            continue
        size_str, date_str, time_str, filename = parts[0], parts[1], parts[2], parts[3]
        
        # Strictly filter ONLY minecraft backups
        match = BACKUP_REGEX.match(filename)
        if not match:
            continue
        
        try:
            size_bytes = int(size_str)
            clean_time = time_str.split(".")[0]
            dt_str = f"{date_str} {clean_time}"
        except Exception:
            continue

        backups.append({
            "name": filename,
            "bytes": size_bytes,
            "datetime": dt_str,
        })

    return backups

def sync_to_database(gdrive_backups):
    """Synchronizes Google Drive backup entries with the MariaDB backups table."""
    raw_existing = run_db_query(
        f"SELECT id, uuid, name, bytes, completed_at, deleted_at FROM backups WHERE server_id = {SERVER_ID};",
        fetch_json=True
    )
    existing = {}
    if raw_existing:
        lines = raw_existing.strip().splitlines()
        if len(lines) > 1:
            headers = lines[0].split("\t")
            for line in lines[1:]:
                row = dict(zip(headers, line.split("\t")))
                existing[row["name"]] = row

    gdrive_names = set()
    inserted = 0
    updated = 0

    for b in gdrive_backups:
        name = b["name"]
        gdrive_names.add(name)
        b_bytes = b["bytes"]
        b_dt = b["datetime"]

        if name not in existing:
            new_uuid = str(uuid.uuid4())
            sql = f"""
            INSERT INTO backups (
                server_id, uuid, is_successful, is_locked, name,
                ignored_files, disk, checksum, bytes, completed_at,
                created_at, updated_at
            ) VALUES (
                {SERVER_ID}, '{new_uuid}', 1, 0, '{name}',
                '[]', 'agent', 'Google Drive (GPG AES-256)', {b_bytes}, '{b_dt}',
                '{b_dt}', '{b_dt}'
            );
            """
            run_db_query(sql)
            inserted += 1
        else:
            row = existing[name]
            if str(row.get("bytes")) != str(b_bytes) or row.get("deleted_at") != "NULL":
                sql = f"UPDATE backups SET bytes = {b_bytes}, deleted_at = NULL, completed_at = '{b_dt}', updated_at = NOW() WHERE id = {row['id']};"
                run_db_query(sql)
                updated += 1

    # Remove backups from DB that no longer exist on Google Drive
    for name, row in existing.items():
        if BACKUP_REGEX.match(name) and name not in gdrive_names:
            run_db_query(f"DELETE FROM backups WHERE id = {row['id']};")

    print(f"[Sync] Google Drive Backups synchronisiert: {len(gdrive_backups)} aktiv ({inserted} neu, {updated} aktualisiert).")

if __name__ == "__main__":
    backups = fetch_gdrive_backups()
    sync_to_database(backups)

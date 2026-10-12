# Minecraft Performance Monitoring & Discord Alerting

Hintergrunddienst zur Überwachung der Servergesundheit mit automatischen Discord-Webhooks.

---

## 1. Funktionen

- **Live-TPS:** RCON-Abfrage für 5s, 1m und 5m Durchschnitt.
- **RAM- & CPU:** Echtzeit-Messung des Docker-Containers.
- **Crash-Erkennung:** Alarmierung bei unerwartetem Container-Stopp.
- **Discord-Embeds:** Farbige Meldungen (Gelb = Warnung, Rot = Kritisch, Grün = Entwarnung).
- **Spam-Schutz:** 10 Minuten Cooldown je Vorfall.

---

## 2. Konfiguration (`monitor.conf.example`)

```ini
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
TPS_WARN_THRESHOLD=17.0
TPS_CRITICAL_THRESHOLD=14.0
RAM_WARN_PERCENT=85.0
RAM_CRITICAL_PERCENT=95.0
CHECK_INTERVAL_SECONDS=20
```

---

## 3. Befehle

```bash
# Webhook testen:
python3 mc-perf-monitor.py --test

# Service-Status:
systemctl status mc-perf-monitor.service

# Live-Logs:
journalctl -u mc-perf-monitor.service -f
```

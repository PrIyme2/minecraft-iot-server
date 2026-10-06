# 📊 Minecraft Performance-Monitoring & Discord-Alerting Daemon

Leichtgewichtiger Hintergrunddienst zur kontinuierlichen Überwachung der Minecraft-Servergesundheit und automatischen Alarmierung über Discord-Webhooks.

Erfüllt die Kriterien aus dem Projektantrag (**GK531, GK647: Netzwerke, Vernetzung & Alerting**):
- ✅ **Zyklische Überwachung von Live-TPS:** Abfrage über RCON (5s, 1m, 5m Durchschnitt).
- ✅ **RAM- & CPU-Messung:** Live-Abfrage des Docker-Containers in Echtzeit.
- ✅ **Crash-Erkennung:** Sofortige Erkennung von unerwarteten Server-Stopps oder Container-Abstürzen.
- ✅ **Discord-Alerting mit Rich Embeds:** Formatierte Meldungen mit Schwellwertfarben (Gelb = Warnung, Rot = Kritisch/Crash, Grün = Entwarnung).
- ✅ **Spam-Schutz (Cooldown):** Verhindert Benachrichtigungs-Spam bei anhaltenden Performance-Drops (standardmäßig max. 1x alle 10 Minuten pro Vorfall).
- ✅ **Systemd-Daemon:** Läuft als nativer Hintergrunddienst mit automatischem Neustart bei System-Boot.

---

## ⚙️ Konfiguration (`monitor.conf`)

In [`monitor.conf`](file:///home/prime/minecraft-monitor/monitor.conf) kannst du deine Discord Webhook URL und Schwellwerte anpassen:

```ini
# Trage hier deine Discord Webhook URL ein:
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."

# Schwellwerte fuer TPS-Alerts (Normal: 20.0 TPS)
TPS_WARN_THRESHOLD=17.0
TPS_CRITICAL_THRESHOLD=14.0

# Schwellwerte fuer RAM-Alerts (in %)
RAM_WARN_PERCENT=85.0
RAM_CRITICAL_PERCENT=95.0

# Pruefintervall (in Sekunden)
CHECK_INTERVAL_SECONDS=20
```

---

## 🧪 Test & Steuerung

```bash
# 1. Webhook-Verbindung testen (sendet ein Test-Embed an deinen Discord-Kanal):
python3 /home/prime/minecraft-monitor/mc-perf-monitor.py --test

# 2. Status des Systemd-Dienstes ansehen:
systemctl status mc-perf-monitor.service

# 3. Live-Logs der Überwachung im Terminal verfolgen:
journalctl -u mc-perf-monitor.service -f
```

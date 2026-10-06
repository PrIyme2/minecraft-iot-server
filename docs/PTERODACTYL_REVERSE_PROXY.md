# 🖥️ Pterodactyl / Reviactyl Multi-Domain Reverse Proxy & Asset Setup

Dokumentation zur Konfiguration von Nginx, Tailscale Funnel HTTPS und Laravel-Umgebungseinstellungen für Pterodactyl/Reviactyl, um Asset-Ladefehler und Mixed-Content-Blockaden zu verhindern.

---

## 📌 Problemstellung

Wenn ein Pterodactyl-Panel über mehrere Domains und Interfaces aufgerufen werden soll (z. B. `http://panel.server.priyme`, `http://192.168.0.33`, `http://100.111.45.61` und Tailscale Funnel `https://prime.tail923f91.ts.net`), treten standardmäßig zwei Probleme auf:

1. **Starrer `APP_URL` in Laravel:**
   - Wenn `APP_URL="http://panel.server.priyme"` fest in `/var/www/pterodactyl/.env` steht, generiert das Panel alle CSS- und JS-Dateien mit dieser absoluten Domain.
   - Ruft man das Panel über Tailscale Funnel (`https://...`) auf, blockiert der Browser die Skripte als **Mixed Content** (unsichere HTTP-Skripte auf einer HTTPS-Seite) $\rightarrow$ weißer Bildschirm.
2. **Ignorierte `X-Forwarded-Proto`-Header:**
   - Tailscale Funnel beendet TLS am Rand und leitet Anfragen als HTTP an Port 80 weiter.
   - Da Laravel standardmäßig keinen Reverse-Proxies vertraut, erkennt PHP den Request als unsicheres HTTP, sofern `TRUSTED_PROXIES` nicht konfiguriert ist.

---

## 🛠️ Die Lösung

### 1. Trusted Proxies in `.env` aktivieren
In `/var/www/pterodactyl/.env`:
```dotenv
TRUSTED_PROXIES=*
```

Dadurch vertraut die Laravel-Middleware `TrustProxies` den Headern `X-Forwarded-Proto: https`, die von Tailscale Funnel übermittelt werden.

---

### 2. Dynamische Asset-URLs in `config/app.php`
In `/var/www/pterodactyl/config/app.php`:
```php
// Dynamische Asset-Auflösung basierend auf dem aufrufenden Host
'asset_url' => env('ASSET_URL', null),
```

---

### 3. Scheme-Preservation in `AppServiceProvider.php`
In `/var/www/pterodactyl/app/Providers/AppServiceProvider.php`:
```php
if ($this->app->runningInConsole()) {
    $appUrl = config('app.url') ?? '';
    if ($appUrl !== '') {
        URL::forceRootUrl($appUrl);
    }
    if (Str::startsWith($appUrl, 'https://')) {
        URL::forceScheme('https');
    }
} else {
    // Bei eingehenden Web-Requests das Schema des Aufrufers respektieren
    if (request()->secure() || request()->header('x-forwarded-proto') === 'https') {
        URL::forceScheme('https');
    }
}
```

---

### 4. Cache bereinigen
Nach jeder Anpassung den Laravel-Cache leeren:
```bash
sudo -u www-data php /var/www/pterodactyl/artisan config:clear
sudo -u www-data php /var/www/pterodactyl/artisan cache:clear
sudo -u www-data php /var/www/pterodactyl/artisan view:clear
```

---

## 🔒 Ergebnis
- `http://panel.server.priyme/` $\rightarrow$ Assets laden als `http://panel.server.priyme/build/...`
- `http://192.168.0.33/` $\rightarrow$ Assets laden als `http://192.168.0.33/build/...`
- `https://prime.tail923f91.ts.net/` $\rightarrow$ Assets laden als `https://prime.tail923f91.ts.net/build/...` (kein Mixed Content!)

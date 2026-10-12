# Pterodactyl Multi-Domain Reverse Proxy & Asset Setup

Konfiguration gegen Mixed-Content-Fehler bei Zugriff über LAN, VPN und Tailscale Funnel.

---

## 1. Problem

Zugriff über HTTPS (Tailscale Funnel) erzeugt weißen Bildschirm (Mixed Content), wenn Laravel feste HTTP-URLs (`APP_URL`) für CSS/JS ausgibt und `X-Forwarded-Proto` ignoriert.

---

## 2. Lösung

### 1. Trusted Proxies in `/var/www/pterodactyl/.env`
```dotenv
TRUSTED_PROXIES=*
```

### 2. Dynamische Asset-URLs in `/var/www/pterodactyl/config/app.php`
```php
'asset_url' => env('ASSET_URL', null),
```

### 3. Schema-Anpassung in `/var/www/pterodactyl/app/Providers/AppServiceProvider.php`
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
    if (request()->secure() || request()->header('x-forwarded-proto') === 'https') {
        URL::forceScheme('https');
    }
}
```

### 4. Cache leeren
```bash
sudo -u www-data php /var/www/pterodactyl/artisan config:clear
sudo -u www-data php /var/www/pterodactyl/artisan cache:clear
sudo -u www-data php /var/www/pterodactyl/artisan view:clear
```

---

## 3. Ergebnis
- Assets laden auf HTTP (`http://panel.server.priyme/`) und HTTPS (`https://<tailnet-node>.ts.net/`) ohne Fehler.

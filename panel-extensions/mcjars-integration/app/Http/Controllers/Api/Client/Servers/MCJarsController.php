<?php

namespace Reviactyl\Extensions\MCJars\Http\Controllers\Api\Client\Servers;

use Exception;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Models\Server;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;

class MCJarsController extends ClientApiController
{
    private const MCJARS_API_BASE = 'https://api.mcjars.app/v2';
    private const CACHE_TTL_SECONDS = 3600;

    private DaemonFileRepository $fileRepository;

    public function __construct(DaemonFileRepository $fileRepository)
    {
        parent::__construct();
        $this->fileRepository = $fileRepository;
    }

    public function getTypes(Request $request, Server $server): JsonResponse
    {
        $types = Cache::remember('mcjars_types_list', self::CACHE_TTL_SECONDS, function () {
            try {
                $response = Http::timeout(10)
                    ->withHeaders(['User-Agent' => 'Reviactyl-MCJars-Extension/1.2.0'])
                    ->get(self::MCJARS_API_BASE . '/types');

                if ($response->successful()) {
                    return $response->json();
                }
            } catch (Exception $e) {
                Log::warning('MCJars API nicht erreichbar, nutze Fallback: ' . $e->getMessage());
            }

            return [
                'types' => [
                    ['id' => 'paper', 'name' => 'Paper', 'category' => 'server', 'compatibility' => 'Plugins (Bukkit/Spigot/Paper)'],
                    ['id' => 'purpur', 'name' => 'Purpur', 'category' => 'server', 'compatibility' => 'High-Performance Paper Fork'],
                    ['id' => 'vanilla', 'name' => 'Vanilla', 'category' => 'server', 'compatibility' => 'Official Mojang'],
                    ['id' => 'fabric', 'name' => 'Fabric', 'category' => 'modded', 'compatibility' => 'Lightweight Modding'],
                    ['id' => 'neoforge', 'name' => 'NeoForge', 'category' => 'modded', 'compatibility' => 'Modern Forge Fork'],
                    ['id' => 'folia', 'name' => 'Folia', 'category' => 'server', 'compatibility' => 'Multi-threaded Regionized Paper'],
                    ['id' => 'velocity', 'name' => 'Velocity', 'category' => 'proxy', 'compatibility' => 'Modern High-Perf Proxy'],
                    ['id' => 'waterfall', 'name' => 'Waterfall', 'category' => 'proxy', 'compatibility' => 'BungeeCord Fork by PaperMC'],
                ]
            ];
        });

        return response()->json($types);
    }

    public function getTypeDetails(Request $request, Server $server, string $type): JsonResponse
    {
        $data = Cache::remember("mcjars_type_{$type}", 1800, function () use ($type) {
            try {
                $response = Http::timeout(10)
                    ->withHeaders(['User-Agent' => 'Reviactyl-MCJars-Extension/1.2.0'])
                    ->get(self::MCJARS_API_BASE . "/types/{$type}");

                if ($response->successful()) {
                    return $response->json();
                }
            } catch (Exception $e) {
                Log::error("Fehler beim Abrufen von MCJars Typ {$type}: " . $e->getMessage());
            }
            return null;
        });

        if (!$data) {
            return response()->json(['error' => 'Typ nicht gefunden oder API nicht erreichbar.'], 404);
        }

        return response()->json($data);
    }

    public function getBuildDetails(Request $request, Server $server, string $type, string $version): JsonResponse
    {
        $data = Cache::remember("mcjars_build_{$type}_{$version}", 600, function () use ($type, $version) {
            try {
                $response = Http::timeout(10)
                    ->withHeaders(['User-Agent' => 'Reviactyl-MCJars-Extension/1.2.0'])
                    ->get(self::MCJARS_API_BASE . "/builds/{$type}/{$version}/latest");

                if ($response->successful()) {
                    return $response->json();
                }
            } catch (Exception $e) {
                Log::error("Fehler beim Abrufen des Builds fuer {$type} {$version}: " . $e->getMessage());
            }
            return null;
        });

        if (!$data) {
            return response()->json(['error' => 'Kein Build fuer diese Version gefunden.'], 404);
        }

        return response()->json($data);
    }

    public function installJar(Request $request, Server $server): JsonResponse
    {
        $request->validate([
            'download_url' => 'required|url',
            'target_filename' => 'nullable|string|regex:/^[\w\.-]+\.jar$/',
            'backup_existing' => 'nullable|boolean',
            'software' => 'nullable|string',
            'version' => 'nullable|string',
            'build' => 'nullable|string',
        ]);

        $downloadUrl = $request->input('download_url');
        $targetFilename = $request->input('target_filename', 'server.jar');
        $backupExisting = $request->boolean('backup_existing', true);
        $software = strtolower(trim((string)$request->input('software', '')));
        $version = trim((string)$request->input('version', ''));
        $build = trim((string)$request->input('build', ''));

        try {
            $this->fileRepository->setServer($server);

            if ($backupExisting) {
                try {
                    $existingFiles = $this->fileRepository->getDirectory('/');
                    foreach ($existingFiles as $file) {
                        if ($file['name'] === $targetFilename) {
                            $backupName = $targetFilename . '.bak-' . date('Ymd-His');
                            $this->fileRepository->renameFiles('/', [
                                ['from' => $targetFilename, 'to' => $backupName]
                            ]);
                            Log::info("Backup erstellt: {$targetFilename} -> {$backupName} fuer Server {$server->uuid}");
                            break;
                        }
                    }
                } catch (Exception $e) {
                    Log::warning("Backup von {$targetFilename} uebersprungen: " . $e->getMessage());
                }
            }

            $this->fileRepository->pullFile($downloadUrl, '/', $targetFilename);

            // Record active core metadata
            if ($software && $version) {
                try {
                    $coreConfig = json_encode([
                        'software' => $software,
                        'version' => $version,
                        'target_jar' => $targetFilename,
                        'installed_build' => $build ?: 'latest',
                        'backup' => $backupExisting,
                        'installed_at' => now()->toIso8601String(),
                    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

                    $this->fileRepository->writeFile('/', '.server_core.json', $coreConfig);
                    if ($build) {
                        $this->fileRepository->writeFile('/', '.current_build', $build);
                    }
                } catch (Exception $e) {
                    Log::warning("Konnte .server_core.json nicht speichern: " . $e->getMessage());
                }
            }

            return response()->json([
                'success' => true,
                'message' => "Die Server-Software ({$targetFilename}) wird im Hintergrund heruntergeladen.",
                'target_file' => $targetFilename,
            ]);
        } catch (Exception $e) {
            Log::error("Fehler beim Installieren der JAR fuer Server {$server->uuid}: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Download konnte nicht initiiert werden: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get auto-update status, current core config, and available updates.
     */
    public function getAutoUpdateStatus(Request $request, Server $server): JsonResponse
    {
        $this->fileRepository->setServer($server);

        $status = [
            'autoupdate_installed' => false,
            'has_core_config' => false,
            'software' => null,
            'version' => null,
            'installed_build' => null,
            'target_jar' => 'server.jar',
            'backup' => true,
            'latest_build' => null,
            'is_up_to_date' => null,
        ];

        try {
            $files = $this->fileRepository->getDirectory('/');
            $filenames = array_column($files, 'name');

            $status['autoupdate_installed'] = in_array('autoupdate.sh', $filenames, true);

            if (in_array('.server_core.json', $filenames, true)) {
                try {
                    $raw = $this->fileRepository->getContent('.server_core.json');
                    $cfg = json_decode($raw, true);
                    if (is_array($cfg)) {
                        $status['has_core_config'] = true;
                        $status['software'] = $cfg['software'] ?? null;
                        $status['version'] = $cfg['version'] ?? null;
                        $status['installed_build'] = $cfg['installed_build'] ?? null;
                        $status['target_jar'] = $cfg['target_jar'] ?? 'server.jar';
                        $status['backup'] = $cfg['backup'] ?? true;
                    }
                } catch (Exception $e) {}
            }

            if (!$status['installed_build'] && in_array('.current_build', $filenames, true)) {
                try {
                    $raw = trim($this->fileRepository->getContent('.current_build'));
                    if ($raw) {
                        $status['installed_build'] = $raw;
                    }
                } catch (Exception $e) {}
            }

            // Auto-detect software if still null
            if (!$status['software']) {
                if (in_array('purpur.yml', $filenames, true)) {
                    $status['software'] = 'purpur';
                } elseif (in_array('paper.yml', $filenames, true)) {
                    $status['software'] = 'paper';
                } elseif (in_array('velocity.toml', $filenames, true)) {
                    $status['software'] = 'velocity';
                }
            }

            // Try to fetch latest build for detected software
            if ($status['software'] && $status['version']) {
                $latest = $this->fetchLatestBuildNumber($status['software'], $status['version']);
                if ($latest) {
                    $status['latest_build'] = $latest;
                    if ($status['installed_build']) {
                        $status['is_up_to_date'] = ((string)$status['installed_build'] === (string)$latest);
                    }
                }
            }

        } catch (Exception $e) {
            Log::warning("Fehler beim Abrufen des AutoUpdate-Status: " . $e->getMessage());
        }

        return response()->json($status);
    }

    /**
     * Install or update the autoupdate.sh script and .server_core.json config.
     */
    public function installAutoUpdate(Request $request, Server $server): JsonResponse
    {
        $request->validate([
            'software' => 'required|string|max:64',
            'version' => 'required|string|max:32',
            'target_jar' => 'nullable|string|regex:/^[\w\.-]+\.jar$/',
            'backup' => 'nullable|boolean',
        ]);

        $software = strtolower(trim($request->input('software')));
        $version = trim($request->input('version'));
        $targetJar = $request->input('target_jar', 'server.jar');
        $backup = $request->boolean('backup', true);

        try {
            $this->fileRepository->setServer($server);

            // 1. Get autoupdate.sh script content
            $scriptContent = $this->getScriptContent();

            // 2. Write autoupdate.sh to server root
            $this->fileRepository->writeFile('/', 'autoupdate.sh', $scriptContent);
            try {
                $this->fileRepository->chmodFiles('/', [
                    ['file' => 'autoupdate.sh', 'mode' => '0755']
                ]);
            } catch (Exception $e) {}

            // 3. Write .server_core.json config
            $coreConfig = [
                'software' => $software,
                'version' => $version,
                'target_jar' => $targetJar,
                'backup' => $backup,
                'installed_build' => null,
                'updated_at' => now()->toIso8601String(),
            ];

            // Check if .current_build already exists to preserve it
            try {
                $existingFiles = array_column($this->fileRepository->getDirectory('/'), 'name');
                if (in_array('.current_build', $existingFiles, true)) {
                    $coreConfig['installed_build'] = trim($this->fileRepository->getContent('.current_build'));
                }
            } catch (Exception $e) {}

            $this->fileRepository->writeFile('/', '.server_core.json', json_encode($coreConfig, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

            return response()->json([
                'success' => true,
                'message' => 'Auto-Core-Update-Skript (autoupdate.sh) und Konfiguration erfolgreich auf dem Server installiert!',
                'command' => "bash autoupdate.sh && java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar {$targetJar}",
                'software' => $software,
                'version' => $version,
            ]);
        } catch (Exception $e) {
            Log::error("Fehler beim Installieren von autoupdate.sh: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Installation fehlgeschlagen: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Return the autoupdate.sh script text.
     */
    public function getAutoUpdateScript(Request $request, Server $server): JsonResponse
    {
        return response()->json([
            'script' => $this->getScriptContent(),
            'startup_command' => 'bash autoupdate.sh && java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar {{SERVER_JARFILE}}',
        ]);
    }

    private function fetchLatestBuildNumber(string $software, string $version): ?string
    {
        try {
            $software = strtolower(trim($software));
            if (in_array($software, ['paper', 'folia', 'velocity', 'waterfall'], true)) {
                $res = Http::timeout(6)
                    ->withHeaders(['User-Agent' => 'AutoCoreUpdater/1.2.0'])
                    ->get("https://fill.papermc.io/v3/projects/{$software}/versions/{$version}");
                if ($res->successful()) {
                    $builds = $res->json('builds');
                    if (!empty($builds) && is_array($builds)) {
                        return (string)$builds[0];
                    }
                }
            } elseif ($software === 'purpur') {
                $res = Http::timeout(6)
                    ->withHeaders(['User-Agent' => 'AutoCoreUpdater/1.2.0'])
                    ->get("https://api.purpurmc.org/v2/purpur/{$version}");
                if ($res->successful()) {
                    $latest = $res->json('builds.latest');
                    if ($latest) return (string)$latest;
                }
            }

            // Universal MCJars fallback
            $res = Http::timeout(6)
                ->withHeaders(['User-Agent' => 'AutoCoreUpdater/1.2.0'])
                ->get("https://mcjars.app/api/v3/builds/types/{$software}/versions/{$version}/latest");
            if ($res->successful()) {
                $build = $res->json('build');
                if ($build) {
                    $name = $build['name'] ?? $build['id'] ?? null;
                    return $name ? ltrim((string)$name, '#') : null;
                }
            }
        } catch (Exception $e) {}

        return null;
    }

    private function getScriptContent(): string
    {
        $scriptPath = __DIR__ . '/../../../../../../scripts/autoupdate.sh';
        if (file_exists($scriptPath)) {
            return (string)file_get_contents($scriptPath);
        }

        $altPath = dirname(__DIR__, 6) . '/scripts/autoupdate.sh';
        if (file_exists($altPath)) {
            return (string)file_get_contents($altPath);
        }

        // Fallback embedded script
        return file_get_contents(__DIR__ . '/autoupdate.sh') ?: '';
    }
}

<?php

namespace Reviactyl\Extensions\Modrinth\Http\Controllers\Api\Client\Servers;

use Exception;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Models\Server;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\Repositories\Wings\DaemonPowerRepository;

class ModrinthController extends ClientApiController
{
    private const MODRINTH_API = 'https://api.modrinth.com/v2';
    private const USER_AGENT = 'Reviactyl-Modrinth-Installer/1.0.0 (contact@reviactyl.dev)';

    private DaemonFileRepository $fileRepository;
    private DaemonPowerRepository $powerRepository;

    public function __construct(
        DaemonFileRepository $fileRepository,
        DaemonPowerRepository $powerRepository
    ) {
        parent::__construct();
        $this->fileRepository = $fileRepository;
        $this->powerRepository = $powerRepository;
    }

    public function search(Request $request, Server $server): JsonResponse
    {
        $query = $request->query('query', '');
        $loader = $request->query('loader', 'paper');
        $version = $request->query('version', '');
        $limit = min((int) $request->query('limit', 20), 50);
        $offset = (int) $request->query('offset', 0);
        $index = $request->query('sort', 'downloads');

        $facets = [
            ['project_type:plugin']
        ];

        if (!empty($loader) && $loader !== 'all') {
            $facets[] = ["categories:{$loader}"];
        }

        if (!empty($version) && $version !== 'all') {
            $facets[] = ["versions:{$version}"];
        }

        $cacheKey = 'modrinth_s_' . md5($query . json_encode($facets) . $limit . $offset . $index);

        $results = Cache::remember($cacheKey, 300, function () use ($query, $facets, $limit, $offset, $index) {
            try {
                $response = Http::timeout(10)
                    ->withHeaders(['User-Agent' => self::USER_AGENT])
                    ->get(self::MODRINTH_API . '/search', [
                        'query' => $query,
                        'facets' => json_encode($facets),
                        'limit' => $limit,
                        'offset' => $offset,
                        'index' => $index,
                    ]);

                if ($response->successful()) {
                    return $response->json();
                }
            } catch (Exception $e) {
                Log::error('Modrinth Search Error: ' . $e->getMessage());
            }
            return ['hits' => [], 'total_hits' => 0];
        });

        return response()->json($results);
    }

    public function getVersions(Request $request, Server $server, string $id): JsonResponse
    {
        $loader = $request->query('loader');
        $gameVersion = $request->query('version');

        $params = [];
        if (!empty($loader) && $loader !== 'all') {
            $params['loaders'] = json_encode([$loader]);
        }
        if (!empty($gameVersion) && $gameVersion !== 'all') {
            $params['game_versions'] = json_encode([$gameVersion]);
        }

        try {
            $response = Http::timeout(10)
                ->withHeaders(['User-Agent' => self::USER_AGENT])
                ->get(self::MODRINTH_API . "/project/{$id}/version", $params);

            if ($response->successful()) {
                return response()->json($response->json());
            }
        } catch (Exception $e) {
            Log::error("Modrinth Versions Error for {$id}: " . $e->getMessage());
        }

        return response()->json([], 500);
    }

    public function getInstalledPlugins(Request $request, Server $server): JsonResponse
    {
        try {
            $this->fileRepository->setServer($server);
            $files = $this->fileRepository->getDirectory('/plugins');

            $jars = [];
            foreach ($files as $file) {
                if (!$file['is_directory'] && str_ends_with(strtolower($file['name']), '.jar')) {
                    $jars[] = [
                        'name' => $file['name'],
                        'size' => $file['size'],
                        'modified_at' => $file['modified_at'] ?? null,
                    ];
                }
            }

            return response()->json(['installed' => $jars]);
        } catch (Exception $e) {
            return response()->json(['installed' => []]);
        }
    }

    public function installPlugin(Request $request, Server $server): JsonResponse
    {
        $request->validate([
            'download_url' => 'required|url',
            'filename' => 'required|string|regex:/^[\w\.-+]+(\.jar)?$/',
            'restart_server' => 'nullable|boolean',
        ]);

        $url = $request->input('download_url');
        $filename = $request->input('filename');
        if (!str_ends_with(strtolower($filename), '.jar')) {
            $filename .= '.jar';
        }
        $restart = $request->boolean('restart_server', false);

        try {
            $this->fileRepository->setServer($server);

            try {
                $this->fileRepository->createDirectory('plugins', '/');
            } catch (Exception $ignored) {
            }

            $this->fileRepository->pullFile($url, '/plugins', $filename);
            Log::info("Modrinth Plugin {$filename} auf Server {$server->uuid} installiert.");

            if ($restart) {
                $this->powerRepository->setServer($server);
                $this->powerRepository->send('restart');
                Log::info("Server {$server->uuid} wird nach Plugin-Installation neu gestartet.");
            }

            return response()->json([
                'success' => true,
                'message' => "Plugin {$filename} wurde erfolgreich in den plugins-Ordner installiert!" . ($restart ? ' Server wird neu gestartet.' : ''),
            ]);
        } catch (Exception $e) {
            Log::error("Fehler beim Installieren von {$filename}: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Installation fehlgeschlagen: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function uninstallPlugin(Request $request, Server $server): JsonResponse
    {
        $request->validate([
            'filename' => 'required|string|regex:/^[\w\.-+]+\.jar$/',
        ]);

        $filename = $request->input('filename');

        try {
            $this->fileRepository->setServer($server);
            $this->fileRepository->deleteFiles('/plugins', [$filename]);

            return response()->json([
                'success' => true,
                'message' => "Plugin {$filename} wurde geloescht.",
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Loeschen fehlgeschlagen: ' . $e->getMessage(),
            ], 500);
        }
    }
}

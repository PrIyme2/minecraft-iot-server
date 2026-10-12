import React, { useState, useEffect, useCallback } from 'react';
import { ServerContext } from '@/state/server';
import http from '@/api/http';
import Spinner from '@/components/elements/Spinner';
import Button from '@/components/elements/Button';
import Input from '@/components/elements/Input';
import Switch from '@/components/elements/Switch';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faSearch, faDownload, faTrash, faExternalLinkAlt, 
    faSyncAlt, faBoxes, faFolderOpen 
} from '@fortawesome/free-solid-svg-icons';
import FlashMessageRender from '@/components/FlashMessageRender';
import useFlash from '@/plugins/useFlash';

interface ModrinthHit {
    project_id: string;
    slug: string;
    title: string;
    description: string;
    icon_url: string;
    downloads: number;
    follows: number;
    categories: string[];
    versions: string[];
    latest_version: string;
}

interface InstalledPlugin {
    name: string;
    size: number;
    modified_at: string;
}

export default () => {
    const server = ServerContext.useStoreState(state => state.server.data!);
    const { addFlash, clearFlashes } = useFlash();

    const [tab, setTab] = useState<'store' | 'installed'>('store');
    const [plugins, setPlugins] = useState<ModrinthHit[]>([]);
    const [installed, setInstalled] = useState<InstalledPlugin[]>([]);
    
    const [query, setQuery] = useState<string>('');
    const [loader, setLoader] = useState<string>('paper');
    const [gameVersion, setGameVersion] = useState<string>('1.20.4');
    const [sortBy, setSortBy] = useState<string>('downloads');

    const [loading, setLoading] = useState<boolean>(true);
    const [installingId, setInstallingId] = useState<string | null>(null);
    const [restartOnInstall, setRestartOnInstall] = useState<boolean>(false);

    const fetchInstalled = useCallback(() => {
        http.get(`/api/client/servers/${server.uuid}/modrinth/installed`)
            .then(({ data }) => setInstalled(data.installed || []))
            .catch(console.error);
    }, [server.uuid]);

    const searchPlugins = useCallback(() => {
        setLoading(true);
        http.get(`/api/client/servers/${server.uuid}/modrinth/search`, {
            params: {
                query,
                loader,
                version: gameVersion,
                sort: sortBy,
                limit: 24,
            },
        })
            .then(({ data }) => setPlugins(data.hits || []))
            .catch(err => {
                addFlash({
                    key: 'modrinth',
                    type: 'error',
                    message: 'Modrinth-Suche fehlgeschlagen: ' + err.message,
                });
            })
            .finally(() => setLoading(false));
    }, [server.uuid, query, loader, gameVersion, sortBy, addFlash]);

    useEffect(() => {
        searchPlugins();
        fetchInstalled();
    }, [searchPlugins, fetchInstalled]);

    const handleInstall = async (hit: ModrinthHit) => {
        clearFlashes('modrinth');
        setInstallingId(hit.project_id);

        try {
            const { data: versions } = await http.get(
                `/api/client/servers/${server.uuid}/modrinth/project/${hit.project_id}/versions`,
                { params: { loader, version: gameVersion } }
            );

            if (!versions || versions.length === 0) {
                throw new Error('Keine kompatible Version fuer diesen Loader/Version gefunden.');
            }

            const targetVersion = versions[0];
            const targetFile = targetVersion.files.find((f: any) => f.primary) || targetVersion.files[0];

            if (!targetFile?.url) {
                throw new Error('Download-Link im Release nicht gefunden.');
            }

            const { data } = await http.post(`/api/client/servers/${server.uuid}/modrinth/install`, {
                download_url: targetFile.url,
                filename: targetFile.filename,
                restart_server: restartOnInstall,
            });

            addFlash({
                key: 'modrinth',
                type: 'success',
                message: data.message,
            });

            fetchInstalled();
        } catch (err: any) {
            addFlash({
                key: 'modrinth',
                type: 'error',
                message: 'Fehler beim Installieren: ' + (err.response?.data?.error || err.message),
            });
        } finally {
            setInstallingId(null);
        }
    };

    const handleUninstall = (filename: string) => {
        if (!confirm(`Moechtest du ${filename} wirklich aus /plugins loeschen?`)) return;

        http.delete(`/api/client/servers/${server.uuid}/modrinth/uninstall`, {
            data: { filename },
        })
            .then(() => {
                addFlash({
                    key: 'modrinth',
                    type: 'success',
                    message: `${filename} wurde erfolgreich geloescht.`,
                });
                fetchInstalled();
            })
            .catch(err => {
                addFlash({
                    key: 'modrinth',
                    type: 'error',
                    message: 'Loeschen fehlgeschlagen: ' + err.message,
                });
            });
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return num.toString();
    };

    return (
        <div className={'my-10'}>
            <FlashMessageRender byKey={'modrinth'} className={'mb-4'} />

            <div className={'bg-gray-800 border border-gray-700 p-6 rounded-lg mb-6 shadow-md'}>
                <div className={'flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0'}>
                    <div>
                        <h1 className={'text-2xl font-bold text-white flex items-center'}>
                            Modrinth Plugin Installer
                            <span className={'ml-3 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/40'}>
                                BuiltByBit Style
                            </span>
                        </h1>
                        <p className={'text-sm text-gray-400 mt-1'}>
                            Entdecke tausende gepruefte Minecraft-Plugins und installiere sie mit einem Klick direkt in deinen Server.
                        </p>
                    </div>

                    <div className={'flex items-center space-x-3'}>
                        <button
                            type={'button'}
                            onClick={() => setTab('store')}
                            className={`px-4 py-2 rounded-md text-sm font-semibold transition ${
                                tab === 'store'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                        >
                            <FontAwesomeIcon icon={faBoxes} className={'mr-2'} /> Store
                        </button>
                        <button
                            type={'button'}
                            onClick={() => setTab('installed')}
                            className={`px-4 py-2 rounded-md text-sm font-semibold transition ${
                                tab === 'installed'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                        >
                            <FontAwesomeIcon icon={faFolderOpen} className={'mr-2'} /> Installiert ({installed.length})
                        </button>
                    </div>
                </div>

                {tab === 'store' && (
                    <div className={'mt-6 pt-6 border-t border-gray-700 grid grid-cols-1 md:grid-cols-4 gap-4'}>
                        <div className={'relative'}>
                            <Input
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder={'Plugin suchen (z. B. EssentialsX, WorldEdit)...'}
                                className={'pr-8'}
                            />
                            <button
                                type={'button'}
                                onClick={searchPlugins}
                                className={'absolute right-2.5 top-2.5 text-gray-400 hover:text-white'}
                            >
                                <FontAwesomeIcon icon={faSearch} />
                            </button>
                        </div>

                        <div>
                            <select
                                value={loader}
                                onChange={e => setLoader(e.target.value)}
                                className={'w-full bg-gray-900 border border-gray-700 rounded-md p-2.5 text-white text-sm'}
                            >
                                <option value={'paper'}>Paper / Purpur</option>
                                <option value={'spigot'}>Spigot / Bukkit</option>
                                <option value={'velocity'}>Velocity Proxy</option>
                                <option value={'bungeecord'}>BungeeCord</option>
                                <option value={'fabric'}>Fabric (Server)</option>
                                <option value={'all'}>Alle Loader</option>
                            </select>
                        </div>

                        <div>
                            <select
                                value={gameVersion}
                                onChange={e => setGameVersion(e.target.value)}
                                className={'w-full bg-gray-900 border border-gray-700 rounded-md p-2.5 text-white text-sm'}
                            >
                                <option value={'1.20.4'}>MC 1.20.4</option>
                                <option value={'1.20.2'}>MC 1.20.2</option>
                                <option value={'1.20.1'}>MC 1.20.1</option>
                                <option value={'1.19.4'}>MC 1.19.4</option>
                                <option value={'1.18.2'}>MC 1.18.2</option>
                                <option value={'1.16.5'}>MC 1.16.5</option>
                                <option value={'all'}>Alle Versionen</option>
                            </select>
                        </div>

                        <div className={'flex items-center justify-between bg-gray-900 px-3 py-1.5 rounded-md border border-gray-700'}>
                            <span className={'text-xs text-gray-300'}>Auto-Restart bei Install</span>
                            <Switch
                                name={'restart_on_install'}
                                defaultChecked={restartOnInstall}
                                onChange={() => setRestartOnInstall(!restartOnInstall)}
                            />
                        </div>
                    </div>
                )}
            </div>

            {tab === 'store' && (
                loading ? (
                    <Spinner size={'large'} centered />
                ) : plugins.length === 0 ? (
                    <div className={'bg-gray-800 border border-gray-700 p-12 rounded-lg text-center text-gray-400'}>
                        Keine Plugins fuer diese Suchkriterien gefunden.
                    </div>
                ) : (
                    <div className={'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'}>
                        {plugins.map(plugin => {
                            const isInstalling = installingId === plugin.project_id;
                            return (
                                <div
                                    key={plugin.project_id}
                                    className={'bg-gray-800 border border-gray-700 rounded-lg p-5 flex flex-col justify-between hover:border-gray-600 transition shadow'}
                                >
                                    <div>
                                        <div className={'flex items-start space-x-3 mb-3'}>
                                            <img
                                                src={plugin.icon_url || 'https://assets.modrinth.com/placeholder.svg'}
                                                alt={plugin.title}
                                                className={'w-12 h-12 rounded-lg bg-gray-900 object-cover flex-shrink-0'}
                                                onError={e => {
                                                    (e.target as HTMLElement).style.display = 'none';
                                                }}
                                            />
                                            <div className={'overflow-hidden'}>
                                                <h3 className={'text-base font-bold text-white truncate'}>{plugin.title}</h3>
                                                <div className={'flex items-center space-x-2 text-xs text-gray-400 mt-1'}>
                                                    <span>⬇ {formatNumber(plugin.downloads)}</span>
                                                    <span>•</span>
                                                    <span>♥ {formatNumber(plugin.follows)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <p className={'text-xs text-gray-300 line-clamp-2 mb-4 leading-relaxed'}>
                                            {plugin.description}
                                        </p>

                                        <div className={'flex flex-wrap gap-1 mb-4'}>
                                            {plugin.categories.slice(0, 3).map(cat => (
                                                <span key={cat} className={'text-[10px] bg-gray-900 text-gray-400 px-2 py-0.5 rounded'}>
                                                    {cat}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className={'flex items-center space-x-2 pt-3 border-t border-gray-700'}>
                                        <Button
                                            size={'small'}
                                            color={'primary'}
                                            disabled={isInstalling}
                                            onClick={() => handleInstall(plugin)}
                                            className={'w-full flex items-center justify-center'}
                                        >
                                            <FontAwesomeIcon icon={isInstalling ? faSyncAlt : faDownload} spin={isInstalling} className={'mr-1.5'} />
                                            {isInstalling ? 'Installiere...' : 'Installieren'}
                                        </Button>
                                        <a
                                            href={`https://modrinth.com/plugin/${plugin.slug}`}
                                            target={'_blank'}
                                            rel={'noreferrer'}
                                            className={'p-2 text-gray-400 hover:text-white bg-gray-900 rounded-md border border-gray-700'}
                                            title={'Auf Modrinth anzeigen'}
                                        >
                                            <FontAwesomeIcon icon={faExternalLinkAlt} size={'sm'} />
                                        </a>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            )}

            {tab === 'installed' && (
                <div className={'bg-gray-800 border border-gray-700 rounded-lg overflow-hidden'}>
                    <div className={'p-4 bg-gray-900/50 border-b border-gray-700 flex justify-between items-center'}>
                        <span className={'text-sm font-semibold text-gray-300'}>Gefundene JARs im Ordner /plugins</span>
                        <Button size={'xsmall'} color={'grey'} onClick={fetchInstalled}>
                            <FontAwesomeIcon icon={faSyncAlt} className={'mr-1'} /> Aktualisieren
                        </Button>
                    </div>

                    {installed.length === 0 ? (
                        <div className={'p-10 text-center text-gray-400'}>
                            Keine Plugins im Ordner <code className={'text-blue-400'}>/plugins</code> gefunden.
                        </div>
                    ) : (
                        <div className={'divide-y divide-gray-700'}>
                            {installed.map(p => (
                                <div key={p.name} className={'p-4 flex items-center justify-between hover:bg-gray-700/50 transition'}>
                                    <div className={'flex items-center space-x-3'}>
                                        <div className={'p-2 bg-blue-500/10 text-blue-400 rounded'}>
                                            <FontAwesomeIcon icon={faBoxes} />
                                        </div>
                                        <div>
                                            <div className={'text-sm font-semibold text-white'}>{p.name}</div>
                                            <div className={'text-xs text-gray-400 font-mono'}>
                                                {(p.size / (1024 * 1024)).toFixed(2)} MB
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        size={'small'}
                                        color={'red'}
                                        onClick={() => handleUninstall(p.name)}
                                    >
                                        <FontAwesomeIcon icon={faTrash} className={'mr-1'} /> Loeschen
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

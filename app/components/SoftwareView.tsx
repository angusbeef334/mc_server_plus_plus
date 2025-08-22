'use client'

import { useState, useEffect } from 'react';

interface SoftwareViewProps {
  serverData: any;
  onServerUpdate: (updatedServer: Partial<any>) => void;
  onPluginsUpdate: (plugins: any[]) => void;
}

export default function SoftwareView({serverData, onServerUpdate, onPluginsUpdate}: SoftwareViewProps) {
  const [server, setServer] = useState(JSON.parse(serverData));
  const [plugins, setPlugins] = useState<any[]>(server.plugins || []);
  const [status, setStatus] = useState<Record<string, { updating?: boolean; removing?: boolean; msg?: string; err?: string }>>({});
  const [addStatus, setAddStatus] = useState<{ adding?: boolean; removing?: boolean; msg?: string; err?: string }>({});
  const [serverStatus, setServerStatus] = useState<{updating?: boolean; msg?: string, err?: string}>({});

  const [addOpen, setAddOpen] = useState(false);
  const [addSource, setAddSource] = useState<'spigot' | 'github' | 'hangar' | 'bukkit' | 'direct'>('spigot');

  const setPluginStatus = (name: string, patch: Partial<{ updating: boolean; removing: boolean; msg: string; err: string }>) =>
    setStatus((s) => ({ ...s, [name]: { ...(s[name] || {}), ...patch } }));

  useEffect(() => {
    const newServer = JSON.parse(serverData);
    setServer(newServer);
    setPlugins(newServer.plugins || []);
  }, [serverData]);

  const handleAddPlugin = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = (document.getElementById('in-name') as HTMLInputElement).value;
    const source = (document.getElementById('in-source') as HTMLInputElement).value;
    const location = (document.getElementById('in-location') as HTMLInputElement).value;
    console.info(`add plugin ${name} from ${source} ${location}`);
    setAddStatus({adding: true, err: undefined, msg: undefined});

    const plugin = {
      name: name,
      source: source,
      location: location,
      version: '-1',
    }
    
    const res = await fetch(`/api/servers/${server.name}/plugins`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({server, plugin})
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setAddStatus({adding: false, err: data?.error || 'unknown error'});
      return;
    }

    const { version } = await res.json();

    setAddStatus({adding: false, msg: 'successfully added plugin'});
    
    plugin.version = version;
    const newPlugins = plugins;
    newPlugins.push(plugin)

    setPlugins(newPlugins);
    onPluginsUpdate(newPlugins);
  }

  const handlePluginUpdate = async (plugin: any) => {
    try {
      setPluginStatus(plugin.name, { updating: true, err: undefined, msg: undefined });
      
      const res = await fetch(`/api/servers/${server.name}/plugins`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ server, plugin }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'unknown error');
      }

      const { version } = await res.json();

      setPluginStatus(plugin.name, { msg: (version !== plugin.version || plugin.source == "direct" || plugin.source == "bukkit") ? 'successful update' : 'no new version', updating: false });
      
      const newPlugins = plugins.map(p => 
        p.name === plugin.name ? { ...p, version } : p
      );
      setPlugins(newPlugins);
      
      onPluginsUpdate(newPlugins);
    } catch (err: any) {
      setPluginStatus(plugin.name, { err: err?.message || 'unknown error', updating: false });
    }
  };

  const handleServerUpdate = async () => {
    try {
      setServerStatus({updating: true, err: undefined, msg: undefined});

      const res = await fetch (`/api/servers/${server.name}/server`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ server, build: server.build.toString() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'unknown error');
      }

      const { newVersion } = await res.json();

      setServerStatus({ updating: false, msg: (newVersion !== server.build)? 'successful update' :  'no new version' })
      
      const updatedServer = { ...server, build: newVersion };
      setServer(updatedServer);
      
      onServerUpdate({ build: newVersion });
    } catch (err: any) {
      setServerStatus({ updating: false, err: err?.message || 'unknown error'})
    }
  }

  const handleRemove = async (plugin: any) => {
    if (!confirm(`Remove ${plugin.name}?`)) return;
    try {
      setPluginStatus(plugin.name, { removing: true, err: undefined, msg: undefined });
      
      const res = await fetch(`/api/servers/${server.name}/plugins`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ server, plugin: plugin.name }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'unknown error');
      }

      setPluginStatus(plugin.name, { removing: false, err: undefined, msg: undefined })

      const newPlugins = plugins.filter((p) => p.name !== plugin.name);
      
      setPlugins(newPlugins); 
      onPluginsUpdate(newPlugins);
    } catch (e: any) {
      setPluginStatus(plugin.name, { err: e?.message || String(e), removing: false });
    }
  };

  const handlePluginUpdateAll = async () => {
    for (const p of plugins) {
      await handlePluginUpdate(p);
    }
  };

  return (
    <div className="view bg-gray-900">
      <div>
        <h3 className="text-lg text-white font-semibold">Server</h3>
        <label>Minecraft: {server.version}</label>
        <br/>
        <label>{server.software}: {server.build}</label>
        <br/>
        <div className="flex flex-row items-center">
          <button 
            className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 p-2 m-1 rounded-md m-2"
            onClick={() =>
              handleServerUpdate()
            }
            disabled={serverStatus.updating}
          >
            {serverStatus.updating? 'Updating...' : 'Update'}
          </button>
          {(serverStatus.msg || serverStatus.err) && (
            <div className="w-full m-1 text-sm">
              {serverStatus.msg && <span className="text-green-400">{serverStatus.msg}</span>}
              {serverStatus.err && <span className="text-red-400">{serverStatus.err}</span>}
            </div>
          )}
        </div>
      </div>
      <div>
        <h3 className="text-lg text-white font-semibold">Plugins</h3>

        <button className="bg-gray-800 hover:bg-gray-700 p-2 m-1 rounded-md" onClick={() => {setAddOpen(true);setAddStatus({adding: true, err: undefined, msg: undefined});}}>
          Add Plugin
        </button>

        <button className="bg-gray-800 hover:bg-gray-700 p-2 m-1 rounded-md" onClick={handlePluginUpdateAll}>
          Update All
        </button>

        {plugins && plugins.length > 0 ? (
          <div className="flex flex-col space-y-2">
            {plugins.map((plugin: any) => {
              const st = status[plugin.name] || {};
              return (
                <div key={plugin.name} className="flex flex-col bg-gray-800/40 p-2 rounded-md border border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-medium">{plugin.name}</span>
                      {plugin.version && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-200">v{plugin.version}</span>
                      )}
                    </div>
                    <div className="flex items-center">
                      <button
                        className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 p-2 m-1 rounded-md"
                        disabled={st.updating || st.removing}
                        onClick={() => handlePluginUpdate(plugin)}
                      >
                        {st.updating ? 'Updating…' : 'Update'}
                      </button>
                      <button
                        className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 p-2 m-1 rounded-md"
                        disabled={st.updating || st.removing}
                        onClick={() => handleRemove(plugin)}
                      >
                        {st.removing ? 'Removing…' : 'Remove'}
                      </button>
                    </div>
                  </div>
                  {(st.msg || st.err) && (
                    <div className="w-full mt-1 text-sm">
                      {st.msg && <span className="text-green-400">{st.msg}</span>}
                      {st.err && <span className="text-red-400">{st.err}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <label className="text-white">No plugins installed</label>
        )}
        {addOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-md relative border border-gray-700 mx-2">
              <button
                onClick={() => setAddOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <h2 className="text-lg sm:text-xl mb-4 text-white">Add Plugin</h2>
              <form onSubmit={handleAddPlugin}>
                <input
                  type="text"
                  id="in-name"
                  placeholder="Name"
                  className="bg-gray-700 p-2 m-1 rounded-md"
                />
                <select id="in-source" className="bg-gray-700 hover:bg-gray-600 p-2 m-1 rounded-md" value={addSource} onChange={(e) => setAddSource(e.target.value as any)}>
                  <option value="spigot">Spigot</option>
                  <option value="github">GitHub</option>
                  <option value="bukkit">Bukkit</option>
                  <option value="hangar">Hangar</option>
                  <option value="direct">Direct</option>
                </select>
                <input 
                  type="text" 
                  id="in-location"
                  placeholder={addSource === 'spigot' ? 'Plugin ID' : addSource === 'github' ? 'Repository name' : 'Direct download URL'}
                  className="bg-gray-700 p-2 m-1 rounded-md"
                />
                <br/>
                <input type="submit" value="Add" className="bg-blue-700 rounded-md p-2 m-1"/>
              </form>
              {(addStatus.msg || addStatus.err) && (
                <div className="w-full m-1 text-sm">
                  {addStatus.msg && <span className="text-green-400">{addStatus.msg}</span>}
                  {addStatus.err && <span className="text-red-400">{addStatus.err}</span>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
'use client'

import { useState } from 'react';

interface SoftwareViewProps {
  server: any;
}

export default function SoftwareView({server}: SoftwareViewProps) {
  server = JSON.parse(server);
  const [plugins, setPlugins] = useState<any[]>(server.plugins || []);
  const [status, setStatus] = useState<Record<string, { updating?: boolean; removing?: boolean; msg?: string; err?: string }>>({});
  const [serverStatus, setServerStatus] = useState<{updating?: boolean; msg?: string, err?: string}>({});

  const setPluginStatus = (name: string, patch: Partial<{ updating: boolean; removing: boolean; msg: string; err: string }>) =>
    setStatus((s) => ({ ...s, [name]: { ...(s[name] || {}), ...patch } }));

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

      setPluginStatus(plugin.name, { msg: (version !== plugin.version) ? 'successful update' : 'no new version', updating: false });
      plugin.version = version;
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
        body: JSON.stringify({ server, version: server.build }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'unknown error');
      }

      const { newVersion } = await res.json();

      setServerStatus({ updating: false, msg: (newVersion !== server.build)? 'successful update' :  'no new version' })
      server.build = newVersion;
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

      setPlugins((prev) => prev.filter((p) => p.name !== plugin.name));
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
        <h3 className="text-lg text-white">Server</h3>
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
        <h3 className="text-lg text-white">Plugins</h3>

        <button className="bg-gray-800 hover:bg-gray-700 p-2 m-1 rounded-md">
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
                      <button className="bg-gray-800 hover:bg-gray-700 p-2 m-1 rounded-md">
                        Configure
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
      </div>
    </div>
  )
}
'use client'

import { useState } from 'react';

interface SoftwareViewProps {
  server: any;
}

export default function SoftwareView({server}: SoftwareViewProps) {
  server = JSON.parse(server);
  const [plugins, setPlugins] = useState<any[]>(server.plugins || []);
  const [status, setStatus] = useState<Record<string, { updating?: boolean; removing?: boolean; msg?: string; err?: string }>>({});

  const setPluginStatus = (name: string, patch: Partial<{ updating: boolean; removing: boolean; msg: string; err: string }>) =>
    setStatus((s) => ({ ...s, [name]: { ...(s[name] || {}), ...patch } }));

  const handleUpdate = async (plugin: any) => {
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

      setPluginStatus(plugin.name, { msg: 'successful update', updating: false });
    } catch (e: any) {
      setPluginStatus(plugin.name, { err: e?.message || String(e), updating: false });
    }
  };

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

  const handleUpdateAll = async () => {
    for (const p of plugins) {
      await handleUpdate(p);
    }
  };

  return (
    <div className="view bg-gray-900">
      <div>
        <h3 className="text-lg text-white">Server</h3>
        <label>{server.software}{server.version ? ` v${server.version}` : ''}</label>
        <button className="bg-gray-800 hover:bg-gray-700 p-2 m-1 rounded-md">
          Update
        </button>
      </div>

      <div>
        <h3 className="text-lg text-white">Plugins</h3>

        <button className="bg-gray-800 hover:bg-gray-700 p-2 m-1 rounded-md">
          Add Plugin
        </button>

        <button className="bg-gray-800 hover:bg-gray-700 p-2 m-1 rounded-md" onClick={handleUpdateAll}>
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
                        onClick={() => handleUpdate(plugin)}
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
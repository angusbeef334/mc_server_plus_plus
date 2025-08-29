"use client";

import { useEffect, useState } from "react";

interface SettingsCardProps {
  serverData: string;
  onServerUpdate: (updatedServer: Partial<any>) => void;
}

export default function SettingsView({ serverData, onServerUpdate }: SettingsCardProps) {
  const [server, setServer] = useState(JSON.parse(serverData));
  const [versions, setVersions] = useState<any[]>([]);
  const [serverStatus, setServerStatus] = useState<{updating?: boolean; msg?: string, err?: string}>({});

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

  useEffect(() => {
    const getVersions = async () => {
      try {
        const res = await fetch(
          "https://fill.papermc.io/v3/projects/paper/versions"
        );
        if (!res.ok) return;
        const data = await res.json();
        setVersions(data.versions || []);
      } catch (e) {
        console.error("failed to fetch versions", e);
      }
    };
    getVersions();
  }, []);

  const handleVersionChange = async () => {
    const version = (document.getElementById('in-version') as HTMLInputElement).value;
    const res = await fetch(`/api/servers/${server.name}/server`, {
      method: "PATCH",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({server: server, version: version })
    });

    if (!res.ok) {
      alert(`Failed to update server version: ${res.statusText || 'unknown error'}`);
    }

    let newServer = server;
    newServer.version = version;
    setServer(newServer);
    onServerUpdate(newServer);
    handleServerUpdate();
  }

  return (
    <div className="view">
      <div className="flex flex-col">
        <h3 className="text-lg text-white font-semibold">Server</h3>
        <label>Minecraft: {server.version}</label>
        <section className="flex flex-row items-center">
          {versions.length === 0 && (
              <>Loading versions...</>
          )}
          <select className="bg-gray-800 m-1 p-2 rounded-md hover:bg-gray-700" id="in-version">
            {versions.map((version) => (
              <option key={version.version.id} value={version.version.id} className="text-sm text-gray-300">
                {version.version.id}
              </option>
            ))}
          </select>
          <button
            className="bg-blue-700 m-1 p-2 rounded-md"
            onClick={handleVersionChange}
          >
            Save
          </button>
          <div className="flex flex-col">
            {serverStatus.updating && (
              <label>Updating...</label>
            )}
            {serverStatus.msg && (
              <label className="text-green-400">{serverStatus.msg}</label>
            )}
            {serverStatus.err && (
              <label className="text-red-400">{serverStatus.err}</label>
            )}
          </div>
        </section>
        <label>
          {server.software}: {server.build}
        </label>
        <label>Location: {server.location}</label>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";

interface SettingsCardProps {
  serverData: string;
  onServerUpdate: (updatedServer: Partial<any>) => void;
}

export default function SettingsView({ serverData, onServerUpdate }: SettingsCardProps) {
  const [server, setServer] = useState<Server>(JSON.parse(serverData));
  const [versions, setVersions] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [tempProps, setTempProps] = useState<any[]>([]);
  const [serverStatus, setServerStatus] = useState<{updating?: boolean; msg?: string, err?: string}>({});
  const [propsOpen, setPropsOpen] = useState(false);
  const [mappings, setMappings] = useState<any>();
  const [javaOpen, setJavaOpen] = useState(false);

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
  };

  const convertProps = (keyValueProps: any[]) => {
    let ret = "";
    {Object.entries(keyValueProps).map(([key, value]) => {
        ret += `${key}: ${value}\n`
    })};
    return ret;
  };

  useEffect(() => {
    const getVersionsPaper = async () => {
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
    const getVersionsFabric = async () => {
      try {
        const res = await fetch('https://meta.fabricmc.net/v2/versions/game');
        if (!res.ok) return;
        const data = await res.json();
        setVersions(data);
      } catch (e) {
        console.error(`Failed to fetch versions: ${e}`)
      }
    }

    if (server.software === 'paper') {
      getVersionsPaper();
    } else if (server.software === 'fabric') {
      getVersionsFabric();
    }
  }, []);

  useEffect(() => {
    const getProperties = async () => {
      try {
        const res = await fetch(
          `/api/servers/${server.name}/server?action=properties`
        );
        if (!res.ok) return;
        const data = await res.json();
        setProperties(data.log);
      } catch (e) {
        console.error("failed to fetch properties", e)
      }
    }
    getProperties();
  }, []);

  useEffect(() => {
    const fetchMappings = async () => {
      try {
        const res = await fetch(`/api/servers/${server.name}/server?action=mappings`);
        if (!res.ok) {
          console.error(`failed to fetch props mappings: ${res.statusText}`);
        }

        setMappings(JSON.parse((await res.json()).mapping));
      } catch (e) {
        console.error(`failed to fetch props mappings: ${e}`)
      }
    }
    fetchMappings();
  }, []);

  const handleVersionChange = async () => {
    const version = (document.getElementById('in-version') as HTMLInputElement).value;
    const res = await fetch(`/api/servers/${server.name}/server`, {
      method: "PATCH",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({server: server, param: version })
    });

    if (!res.ok) {
      alert(`Failed to update server version: ${res.statusText || 'unknown error'}`);
    }

    let newServer = server;
    newServer.version = version;
    setServer(newServer);
    onServerUpdate(newServer);
    handleServerUpdate();
  };

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
            {server.software === 'paper' && versions.map((version) => (
              <option key={version.version.id} value={version.version.id} className="text-sm text-gray-300">
                {version.version.id}
              </option>
            ))}
            {server.software === 'fabric' && versions.map(version => (
              <option key={version.version} value={version.version} className="text-sm text-gray-300">
                {version.version}
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

        <h3 className="text-lg text-white font-semibold">Properties</h3>
        <div className="flex flex-row items-center">
          <button 
            className="bg-gray-800 hover:bg-gray-700 rounded-md p-2 m-1 w-min"
            onClick={() => {setTempProps(properties); setPropsOpen(true)}}
          >
            Edit
          </button>
          <label className="p-2">Change the values in the server.properties file</label>
        </div>

        <h3 className="text-lg text-white font-semibold">Java</h3>
        <div className="flex flex-row items-center">
          <button
            className="bg-gray-800 hover:bg-gray-700 rounded-md p-2 m-1 w-min"
            onClick={() => setJavaOpen(true)}
          >
            Change
          </button>
          <label className="p-2">Select another installation of Java to use</label>
        </div>
      </div>
      {propsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl max-h-[75vh] p-4 sm:p-6 w-full max-w-md relative border border-gray-700 mx-2">
            <button
              onClick={() => setPropsOpen(false)}
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
            <h2 className="text-lg sm:text-xl mb-4 text-white">Server Properties</h2>
            <div className="overflow-auto max-h-[50vh] relative">
              {Object.entries(properties).map(([key, value]) => (
                <div key={key} className="flex flex-row p-1 items-center">
                  <span className="cursor-help" title={mappings[key][2]}>{mappings[key][1]}:</span>
                  <input 
                    type={mappings[key][0] === 'bool' ? 'checkbox' : mappings[key][0] === 'int'? 'number' : 'text'} 
                    id={`${key}-input`}
                    onChange={(e) => {
                      setTempProps(prev => ({
                        ...prev,
                        [key]: e.target.value
                      }));
                    }}
                    className="p-1 m-1 bg-gray-700 rounded-sm"
                    defaultValue={value}
                  />
                </div>
              ))}
            </div>
            <button
              className="bg-blue-700 p-2 rounded-md"
              onClick={async () => {
                const props = convertProps(tempProps);
                const res = await fetch(`/api/servers/${server.name}/server`, {
                  method: "PATCH",
                  body: JSON.stringify({server, param: props, action: "properties"})
                });
                if (!res.ok) alert("Failed to set new props");
                else setProperties(tempProps);
                setPropsOpen(false);
              }}
            >
              Save
            </button>
          </div>
        </div>
      )}
      {javaOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl max-h-[75vh] p-4 sm:p-6 w-full max-w-md relative border border-gray-700 mx-2">
            <button
              onClick={() => setJavaOpen(false)}
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
            <div className="flex flex-col">
              <h2 className="text-lg sm:text-xl mb-4 text-white">Java</h2>
              <label>Auto-detected Java installs:</label>
              <select className="bg-gray-700 hover:bg-gray-600 p-2 m-1 rounded-md">
                
              </select>
              <label>You can choose another Java binary manually:</label>
              <input type="file"/>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
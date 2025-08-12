'use client'

interface SoftwareViewProps {
  server: any;
}

export default function SoftwareView({server}: SoftwareViewProps) {
  server = JSON.parse(server);

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

        <button className="bg-gray-800 hover:bg-gray-700 p-2 m-1 rounded-md">
          Update All
        </button>

        {server.plugins && server.plugins.length > 0 ? (
          <div className="flex flex-col space-y-2">
            {server.plugins.map((plugin: any, index: number) => (
              <div>
                <span key={index} className="text-white">
                  {plugin.name} {plugin.version ? `v${plugin.version}` : ''}
                </span>
                <button className="bg-gray-800 hover:bg-gray-700 p-2 m-1 rounded-md">
                  Update
                </button>
                <button className="bg-gray-800 hover:bg-gray-700 p-2 m-1 rounded-md">
                  Remove
                </button>
                <button className="bg-gray-800 hover:bg-gray-700 p-2 m-1 rounded-md">
                  Configure
                </button>
              </div>
            ))}
          </div>
        ) : (
          <label className="text-white">No plugins installed</label>
        )}
      </div>
    </div>
  )
}
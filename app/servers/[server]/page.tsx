'use client'
import SoftwareView from '@/app/components/SoftwareView'
import DashboardView from '@/app/components/DashboardView'
import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Server } from '@/lib/servers'
import SettingsCard from '@/app/components/SettingsView'

export default function ServerPage() {
  const params = useParams()
  const serverName = params?.server

  const [activeView, setActiveView] = useState<'dashboard' | 'software' | 'status' | 'settings'>('dashboard')
  const [server, setServer] = useState<Server | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getServers = async () => {
      try {
        const res = await fetch('/api/servers')
        const data = await res.json()
        setServer(data.find((s: Server) => s.name === serverName) || null)
      } catch (err) {
        console.error(`failed to fetch server data: ${err || 'unknown error'}`)
      } finally {
        setLoading(false)
      }
    }

    if (serverName) {
      getServers()
    }
  }, [serverName])

  const updateServerData = (updatedServer: Partial<Server>) => {
    setServer(prev => prev ? { ...prev, ...updatedServer } : null)
  }

  const updatePlugins = (plugins: any[]) => {
    setServer(prev => prev ? { ...prev, plugins } : null)
  }

  if (loading) {
    return (
      <label>
        Loading server data...
      </label>
    )
  }

  if (!server) {
    return (
      <div>
        <label>Server "{serverName}" does not exist</label>
        <br/>
        <a href="/servers" className="text-blue-500 hover:underline">Return</a>
      </div>
    )
  }

  return (
    <div className="view bg-gray-900 min-h-screen w-full">
      <header className="flex flex-row items-center justify-between p-2">
        <div className="flex flex-row items-center">
          <Link href="/servers">
            <button 
              className="flex bg-gray-800 p-2 rounded-[50%] hover:bg-gray-700 items-center justify-center m-2"
            >
              <svg width="24" height="24" viewBox="0 0 24 24">
                <polyline
                  points="16,4 8,12 16,20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </Link>
        </div>
        <span className="text-xl text-white m-2">{server.name}</span>
      </header>

      <div className="flex flex-row min-h-0 flex-grow min-h-[100vh]">
        <nav className="flex flex-col p-2">
          {[
            "Dashboard",
            "Software",
            "Status",
            "Settings"
          ].map((item) => (
            <button
              key={item.toLowerCase()}
              onClick={() => setActiveView(item.toLowerCase() as any)}
              className={`flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                activeView === item.toLowerCase()? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span>{item}</span>
            </button>
          ))}
        </nav>
        <div className="w-full flex-grow min-h-0 overflow-hidden">
          {activeView == 'dashboard' && (
            <DashboardView server={server}/>
          )}
          {activeView == 'software' && (
            <SoftwareView 
              serverData={JSON.stringify(server)}
              onServerUpdate={updateServerData}
              onPluginsUpdate={updatePlugins}
            />
          )}
          {activeView == 'status' && (
            <div/>
          )}
          {activeView == 'settings' && (
            <SettingsCard
              serverData={JSON.stringify(server)}
              onServerUpdate={updateServerData}
            />
          )}
        </div>
      </div>
    </div>
  )
}
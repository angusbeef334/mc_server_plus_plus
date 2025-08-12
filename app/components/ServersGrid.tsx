'use client'
import { useState, useEffect } from "react";
import ServerCard from "./ServerCard";
import { Server } from "@/lib/servers";

export function ServersGrid() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServers = async () => {
      try {
        const res = await fetch('/api/data/servers');
        const data = await res.json();
        setServers(data);
      } catch (err) {
        console.error(`failed to fetch servers: ${err || 'unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchServers();
  }, []);

  if (loading) {
    return (
      <div className="view flex items-center justify-center">
        <label className="text-white">Loading servers...</label>
      </div>
    );
  }

  return (
    <div className="view grid lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-4">
      {servers.map(server => (
        <ServerCard key={server.name} name={server.name} id={server.name}/>
      ))}
    </div>
  );
}
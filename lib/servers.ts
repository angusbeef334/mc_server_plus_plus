import fs from 'fs';
import path from 'path';

export interface Plugin {
  name: string;
  version: string;
  source: string;
  location: string;
}

export interface Server {
  name: string;
  location: string;
  software: string;
  plugins: Plugin[];
}

export function getAllServers(): Server[] {
  const dataPath = path.join(process.cwd(), 'data', 'servers.json');
  try {
    const data = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(data) as Server[];
  } catch (error) {
    console.error('Failed to load servers data:', error);
    return [];
  }
}

export function getServerByName(name: string): Server | null {
  const servers = getAllServers();
  return servers.find(server => server.name === name) || null;
}

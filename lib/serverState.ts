import { ChildProcess, spawn } from "child_process"
import fs from "fs"
import path from "path";

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

let servers: { key: string, process: ChildProcess, status: string, log: string }[] = [];

function getKey(server: Server) {
  return `${server.name}:${server.location.replaceAll('/', '_')}`;
}

export function start(server: Server) {
  const key = getKey(server);
  let child = spawn('java', ['-Xms2G', '-Xmx4G', '-jar', path.join(server.location, 'server.jar'), '--nogui'], { cwd: server.location });
  servers.push({ key, process: child, status: 'Online', log: ""});
  const s = servers.find(s => s.key === key);
  if (s == null) {
    console.error("failed to push server to servers list");
    return;
  }

  child.stdout?.on('data', (data) => {
    if ((data as string).includes('You need to agree to the EULA')) {
      try {
        fs.writeFileSync(path.join(server.location, 'eula.txt'), 'eula=true');
        child.kill();
        child = spawn('java', ['-Xms2G', '-Xmx4G', '-jar', path.join(server.location, 'server.jar'), '--nogui'], { cwd: server.location });
      } catch {
        console.error('error writing eula');
        return Response.json({ message: "Failed to write EULA, please write manually" }, { status: 500 });
      }
    }
    s.log += data;
  });

  child.stderr?.on('data', (data) => {
    s.log += data;
  });

  child.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });
}

export function stop(server: Server) {
  const key = getKey(server);
  const instance = servers.find(s => s.key === key);

  command(server, "stop\n");
  servers = servers.filter(s => s.key !== instance?.key);
}

export function command(server: Server, command: string) {
  const key = getKey(server);
  const instance = servers.find(s => s.key === key);

  instance?.process.stdin?.write(command, () => {
    console.log(`successfully sent command (${key}): ${command}`);
  })
}

export function status(server: Server) {
  const key = getKey(server);
  const instance = servers.find(s => s.key === key);

  if (!instance) return "Offline";
  return instance.status;
}

export function log(server: Server) {
  const key = getKey(server);
  const instance = servers.find(s => s.key === key);

  return instance?.log;
}
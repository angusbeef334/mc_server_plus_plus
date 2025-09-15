import { ChildProcess, spawn } from "child_process"
import fs from "fs"
import path from "path";
import { getProperties } from "properties-file";
import { Server } from '@/lib/types'

let servers: { key: string, process: ChildProcess, status: string, log: string }[] = [];

function getKey(server: Server) {
  return `${server.name}:${server.location.replaceAll('/', '_')}`;
}

export function start(server: Server) {
  const key = getKey(server);
  let child = spawn(server.java, ['-Xms2G', '-Xmx4G', '-jar', path.join(server.location, 'server.jar'), '--nogui'], { cwd: server.location });
  servers.push({ key, process: child, status: 'Online', log: ""});
  const s = servers.find(s => s.key === key);
  if (s == null) {
    console.error("failed to push server to servers list");
    return;
  }

  child.stdout?.on('data', (data) => {
    s.log += data;
    if ((data as string).includes('You need to agree to the EULA')) {
      try {
        fs.writeFileSync(path.join(server.location, 'eula.txt'), 'eula=true');
        child.kill();
        s.log += "EULA was written, restart server\n";
      } catch {
        console.error('error writing eula');
        return Response.json({ message: "Failed to write EULA, please write manually" }, { status: 500 });
      }
    }
  });

  child.stderr?.on('data', (data) => {
    s.log += data;
  });

  child.on('close', async (code) => {
    await new Promise(resolve => setTimeout(resolve, 2000)); // wait for last log to get sent
    console.log(`child process exited with code ${code}`);
    const instance = servers.find(s => s.key === key);
    servers = servers.filter(s => s.key !== instance?.key);
  });
}

export async function stop(server: Server) {
  await new Promise(resolve => setTimeout(resolve, 2000)); // wait for last log to get sent
  command(server, "stop");
}

export function command(server: Server, command: string) {
  const key = getKey(server);

  const instance = servers.find(s => s.key === key);

  instance?.process.stdin?.write(`${command}\n`, () => {
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

export function properties(server: Server) {
  const res = fs.readFileSync(path.join(server.location, 'server.properties'));
  return getProperties(res.toString());
}

export function mappings() {
  return fs.readFileSync(path.join(process.cwd(), 'data', 'props.json')).toString();
}
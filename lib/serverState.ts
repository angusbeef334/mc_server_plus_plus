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

let servers: { key: string, process: ChildProcess, status: string }[] = [];

function getKey(server: Server) {
  return `${server.name}:${server.location.replaceAll('/', '_')}`;
}

export function start(server: Server) {
  const key = getKey(server);
  let child = spawn('java', ['-Xms2G', '-Xmx4G', '-jar', path.join(server.location, 'server.jar'), '--nogui'], { cwd: server.location });
  servers.push({ key, process: child, status: 'Online'})

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
    console.log(`stdout: ${data}`);
  });

  child.stderr?.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  child.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });
}

export function stop(server: Server) {
  const key = getKey(server);
  const instance = servers.find(s => s.key === key);
  console.log(servers);
  instance?.process.stdin?.write('stop\n', () => {
    servers.filter(s => s.key !== instance?.key);
    return Response.json({ message: "Successfully stopped server" }, { status: 200 });
  });

  return Response.json({ message: "Failed to stop server" }, { status: 500 });
}
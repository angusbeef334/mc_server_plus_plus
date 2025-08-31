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

let child: ChildProcess;

export function start(server: Server) {
  child = spawn('java', ['-Xms2G', '-Xmx4G', '-jar', `${server.location}/server.jar`], { cwd: server.location });
  
  child.stdout?.on('data', (data) => {
    if ((data as string).includes('You need to agree to the EULA in order to run the server.')) {
      try {
        fs.writeFileSync(path.join(server.location, 'eula.txt'), 'eula=true');
        child = spawn('java', ['-Xms2G', '-Xmx4G', '-jar', path.join(server.location, 'server.jar')], { cwd: server.location });
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

export function stop() {
  child.kill()
  return Response.json({ message: "Successfully stopped server" }, { status: 200 });
}
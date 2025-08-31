import { downloadPaper } from "@/lib/downloader";
import { ChildProcess, spawn } from "child_process"
import path from "path";
import fs from 'fs'
import { getServer } from "@/lib/servers";

let child: ChildProcess;

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const action = params.get('action');
  const server = getServer('angusbeef');

  if (server == null) {
    return Response.json({ message: "Server does not exist" }, { status: 400 });
  }

  if (action == 'start') {
    child = spawn('java', ['-Xms2G', '-Xmx4G', '-jar', `${server.location}/server.jar`], { cwd: server.location });

    child.stdout?.on('data', (data) => {
      if ((data as string).includes('You need to agree to the EULA in order to run the server.')) {
        try {
          fs.writeFileSync(path.join(server.location, 'eula.txt'), 'eula=true');
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
    return Response.json({ message: "Successfully started server" }, { status: 200 });
  } else if (action == 'stop') {
    child.kill();
    return Response.json({ message: "Successfully stopped server" }, { status: 200 });
  }
}

export async function PUT(req: Request) {
  const body = await req.json();
  const { server, build } = body;

  if (typeof server !== "object" || typeof build !== "string") {
    return Response.json({ error: "Invalid params" }, { status: 400 });
  }

  try {
    const output = path.join(server.location, 'server.jar');
    let success = false;
    let newVersion = await downloadPaper(build, server.version, output);
    success = !!newVersion;
    
    if (success) {
      return Response.json({ message: "Successful download", newVersion });
    } else {
      return Response.json({ error: "Download error" }, { status: 500 });
    }
  } catch (err) {
    return Response.json({ error: "Download error", details: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const { server, version } = body;

  if (typeof server !== "object" || typeof version !== "string") {
    return Response.json({ error: "Invalid params" }, { status: 400 });
  }

  try {
    const dataPath = path.join(process.cwd(), 'data', 'servers.json');
    if (fs.existsSync(dataPath)) {
      const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
      if (Array.isArray(data)) {
        const i = data.findIndex((s: any) => s.name === server.name);
        if (i !== -1) {
          data[i].version = version;
          fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf-8");
        } else {
          return Response.json({ error: "Server does not exist" }, { status: 500 });
        }
      }
    }
    return Response.json({ message: "Version updated" });
  } catch (err) {
    return Response.json({ error: "Failed to update version", details: String(err) }, { status: 500 });
  }
}
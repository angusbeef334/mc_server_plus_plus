import { downloadPaper } from "@/lib/downloader";
import path from "path";
import fs from 'fs'
import { getServer } from "@/lib/servers";
import { start, status, stop, log, command, properties, mappings } from "@/lib/serverState"

export async function GET(req: Request, { params }: { params: Promise<{ server: string }> }) {
  const urlParams = new URL(req.url).searchParams;
  const action = urlParams.get('action');
  const server = getServer((await params).server);

  if (server == null) {
    return Response.json({ message: "Server does not exist" }, { status: 400 });
  }

  if (action == 'start') {
    start(server);
    return Response.json({ message: "Successfully started server" }, { status: 200 });
  } else if (action == 'stop') {
    stop(server);
    return Response.json({ message: "Successfully stopped server" }, { status: 200 });
  } else if (action == 'status') {
    const res = status(server);
    return Response.json({ status: res }, { status: 200 });
  } else if (action === 'log') {
    const res = log(server);
    return Response.json({ log: res }, { status: 200 });
  } else if (action === 'properties') {
    const res = properties(server);
    return Response.json({ log: res }, { status: 200 });
  } else if (action == 'mappings') {
    const res = mappings();
    return Response.json({ mapping: res }, { status: 200 });
  } else {
    return Response.json({ message: "Invalid action" }, { status: 400 });
  }
}

export async function POST(req: Request) {
  const { server, cmd } = await req.json();
  if (!server || !cmd) {
    return Response.json({ message: "server/plugin param missing" }, { status: 400 });
  }

  command(server, cmd);
  return Response.json({ message: "success" }, { status: 200 });
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
  const { server, param, action } = await req.json();

  if (typeof server !== "object" || typeof param !== "string") {
    return Response.json({ error: "Invalid params" }, { status: 400 });
  }

  if (!action || action === "version") {
    try {
      const dataPath = path.join(process.cwd(), 'data', 'servers.json');
      if (fs.existsSync(dataPath)) {
        const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
        if (Array.isArray(data)) {
          const i = data.findIndex((s: any) => s.name === server.name);
          if (i !== -1) {
            data[i].version = param;
            fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf-8");
          } else {
            return Response.json({ error: "Server does not exist" }, { status: 500 });
          }
        }
      }
      return Response.json({ message: "Version updated" }, { status: 200 });
    } catch (err) {
      return Response.json({ error: "Failed to update version", details: String(err) }, { status: 500 });
    }
  } else if (action === "properties") {
    try {
      const propsPath = path.join(server.location, 'server.properties');
      if (fs.existsSync(propsPath)) {
        fs.writeFileSync(propsPath, param);
      } else {
        return Response.json({ error: "server.properties file does not exist" }, { status: 500 });
      }
    } catch (err) {
      return Response.json({ error: "Failed to update properties", details: String(err)}, { status: 500 });
    }
    return Response.json({ message: "Props updated" }, { status: 200 });
  } else {
    return Response.json({ error: "invalid action" }, { status: 400 });
  }
}
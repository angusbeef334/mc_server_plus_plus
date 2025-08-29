import { downloadPaper } from "@/lib/downloader";
import path from "path";
import fs from 'fs'

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
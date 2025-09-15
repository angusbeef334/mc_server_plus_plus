import { downloadSpigot, downloadGithub, downloadURL, downloadBukkit, downloadHangar, downloadModrinth } from "@/lib/downloader";
import path from "path";
import fs from 'fs'
import { Server, Mod } from '@/lib/types'

export async function PUT(req: Request) {
  const body = await req.json();
  const { server, plugin } = body;

  if (typeof server !== "object" || typeof plugin !== "object") {
    return Response.json({ error: "Invalid server and/or plugin param" }, { status: 400 });
  }

  const output = path.join(server.location, server.software === 'fabric' ? 'mods' : 'plugins', `${plugin.name}.jar`);
  let success = false;
  let version = '';

  const dataPath = path.join(process.cwd(), 'data', 'servers.json');
  let added = false;
  try {
    if (fs.existsSync(dataPath)) {
      const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
      if (Array.isArray(data)) {
        //server
        const i = data.findIndex((s: Server) => s.name === server.name);
        if (i === -1) {
          return Response.json({ error: "server does not exist" }, { status: 400 });
        }

        if (!Array.isArray(data[i].plugins)) data[i].plugins = [];
        
        const existing = data[i].plugins.find((p: Mod) => p.name === plugin.name);
        
        if (!existing) {
          const newPlugin = {
            name: plugin.name,
            version: typeof plugin.version === 'string' ? plugin.version : (plugin.version != null ? String(plugin.version) : ''),
            source: plugin.source || 'direct',
            location: plugin.location || ''
          };
          
          data[i].plugins.push(newPlugin);
          fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf-8");
          added = true;
        }
      }
    }
  } catch (err) {
    console.error('Failed to add plugin to servers.json', err);
    return Response.json({ error: 'Failed to add plugin to servers.json' }, { status: 500 });
  }

  try {      
    switch (plugin.source) {
      case "spigot":
        version = await downloadSpigot(plugin.name, plugin.version, plugin.location, output, server.name);
        success = !!version && version != '-2';
        if (version == '-2') return Response.json({error: 'plugin is externally hosted, spigot download not supported'}, { status: 500 });
        break;
      case "github":
        version = await downloadGithub(plugin.name, plugin.version, plugin.location, output, server.name);
        success = !!version;
        break;
      case "bukkit":
        success = await downloadBukkit(plugin.name, plugin.version, plugin.location, output);
        if (success) version = "-1";
        break;
      case "hangar":
        version = await downloadHangar(plugin.name, plugin.version, server.software, plugin.location, output, server.name);
        success = !!version;
        break;
      case "modrinth":
        version = await downloadModrinth(plugin.name, plugin.version, plugin.location, output, server);
        success = !!version;
        break;
      case "direct":
        success = await downloadURL(plugin.name, plugin.location, output);
        if (success) version = "-1";
        break;
      default:
        return Response.json({ error: "invalid plugin source" }, { status: 400 });
    }
  } catch (err) {
    if (added) {
      try {
        if (fs.existsSync(dataPath)) {
          const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

          if (Array.isArray(data)) {
            const i = data.findIndex((s: Server) => s.name === server.name);

            if (i !== -1 && Array.isArray(data[i].plugins)) {
              data[i].plugins = data[i].plugins.filter((p: Mod) => p.name !== plugin.name);
              fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf-8");
            }
          }
        }
      } catch (e) {
        console.error('failed download - failed to restore servers.json', e);
      }

      try {
        if (fs.existsSync(output)) fs.unlinkSync(output);
      } catch (e) {
        console.error('failed download - failed to remove plugin jarfile', e);
      }
    }

    return Response.json({ error: "Failed to download plugin", details: String(err) }, { status: 500 });
  }

  if (success) {
    return Response.json({ message: "Plugin downloaded successfully", version });
  } else {
    if (added) {
      try {
        if (fs.existsSync(dataPath)) {
          const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
          if (Array.isArray(data)) {
            const si = data.findIndex((s: Server) => s.name === server.name);
            if (si !== -1 && Array.isArray(data[si].plugins)) {
              data[si].plugins = data[si].plugins.filter((p: Mod) => p.name !== plugin.name);
              fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf-8");
            }
          }
        }
      } catch (e) {
        console.error('failed download - failed to restore servers.json', e);
      }

      try {
        if (fs.existsSync(output)) fs.unlinkSync(output);
      } catch (e) {
        console.error('failed download - failed to remove plugin jarfile', e);
      }
    }

    return Response.json({ error: "Failed to download plugin" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const body = await req.json();
  const { server, plugin } = body;

  if (typeof server !== "object" || typeof plugin !== "string") {
    return Response.json({ error: "Server and/or plugin parameters invalid" }, { status: 400 });
  }

  const location = `${server.location}/${server.software === 'fabric' ? 'mods' : 'plugins'}/${plugin}.jar`;
  const dataPath = path.join(process.cwd(), 'data', 'servers.json');

  try {
    if (fs.existsSync(location)) {
      fs.unlinkSync(location);
    } else {
      return Response.json({ error: "Plugin not found" }, { status: 404 });
    }

    if (fs.existsSync(dataPath)) {
      const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

      if (Array.isArray(data)) {
        const i = data.findIndex(s => s.name === server.name);

        if (i !== -1 && Array.isArray(data[i].plugins)) {
          data[i].plugins = data[i].plugins.filter((p: { name: string }) => p.name !== plugin);
          fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf-8");
        }
      }
    }

    return Response.json({ message: "Successfully deleted plugin" });
  } catch (err) {
    return Response.json({ error: "Failed to delete plugin and/or data", details: String(err) }, { status: 500 });
  }
}

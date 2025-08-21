import { NextApiRequest, NextApiResponse } from "next";
import { downloadSpigot, downloadGithub, downloadURL, downloadBukkit, downloadHangar } from "@/lib/downloader";
import path from "path";
import fs from 'fs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "PUT") {
    const { server, plugin } = req.body;

    if (typeof server !== "object" || typeof plugin !== "object") {
      res.status(400).json({ error: "Invalid server and/or plugin param" });
      return;
    }

    const output = path.join(server.location, 'plugins', `${plugin.name}.jar`);
    let success = false;
    let version = '';

    const dataPath = path.join(process.cwd(), 'data', 'servers.json');
    let added = false;
    try {
      if (fs.existsSync(dataPath)) {
        const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
        if (Array.isArray(data)) {
          //server
          const i = data.findIndex((s: any) => s.name === server.name);
          if (i === -1) {
            res.status(400).json({ error: "server does not exist" });
            return;
          }

          if (!Array.isArray(data[i].plugins)) data[i].plugins = [];
          
          const existing = data[i].plugins.find((p: any) => p.name === plugin.name);
          
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
      res.status(500).json({ error: 'Failed to update servers data', details: String(err) });
      return;
    }

    try {      
      switch (plugin.source) {
        case "spigot":
          version = await downloadSpigot(plugin.name, plugin.version, plugin.location, output);
          success = !!version && version != '-2';
          if (version == '-2') res.status(500).json({error: 'plugin is externally hosted, spigot download not supported'})
          break;
        case "github":
          version = await downloadGithub(plugin.name, plugin.version, plugin.location, output);
          success = !!version;
          break;
        case "bukkit":
          console.error('bukkit not yet supported');
          success = false;
          break;
        case "hangar":
          version = await downloadHangar(plugin.name, plugin.version, server.software, plugin.location, output);
          success = !!version;
          break;
        case "direct":
          success = await downloadURL(plugin.name, plugin.location, output);
          break;
        default:
          res.status(400).json({ error: "invalid plugin source" });
          return;
      }
    } catch (err) {
      if (added) {
        try {
          if (fs.existsSync(dataPath)) {
            const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

            if (Array.isArray(data)) {
              const i = data.findIndex((s: any) => s.name === server.name);

              if (i !== -1 && Array.isArray(data[i].plugins)) {
                data[i].plugins = data[i].plugins.filter((p: any) => p.name !== plugin.name);
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

      res.status(500).json({ error: "Failed to download plugin", details: String(err) });
      return;
    }

    if (success) {
      res.status(200).json({ message: "Plugin downloaded successfully", version });
    } else {
      if (added) {
        try {
          if (fs.existsSync(dataPath)) {
            const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
            if (Array.isArray(data)) {
              const si = data.findIndex((s: any) => s.name === server.name);
              if (si !== -1 && Array.isArray(data[si].plugins)) {
                data[si].plugins = data[si].plugins.filter((p: any) => p.name !== plugin.name);
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

      res.status(500).json({ error: "Failed to download plugin" });
    }
  } else if (req.method === "DELETE") {
    const { server, plugin } = req.body;

    if (typeof server !== "object" || typeof plugin !== "string") {
      res.status(400).json({ error: "Server and/or plugin parameters invalid" });
      return;
    }

    const location = `${server.location}/plugins/${plugin}.jar`;
    const dataPath = path.join(process.cwd(), 'data', 'servers.json');

    try {
      if (fs.existsSync(location)) {
        fs.unlinkSync(location);
      } else {
        res.status(404).json({ error: "Plugin not found" });
        return;
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

      res.status(200).json({ message: "Successfully deleted plugin" });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete plugin and/or data", details: String(err) });
    }
  } else {
    res.status(405).json({ error: "Invalid method" });
  }
}

export const config = {
  api: {
    bodyParser: true,
  },
};

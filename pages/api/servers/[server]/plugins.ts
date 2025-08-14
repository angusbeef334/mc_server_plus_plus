import { NextApiRequest, NextApiResponse } from "next";
import { downloadSpigot, downloadGithub, downloadURL } from "@/lib/downloader";
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
    console.log(output);
    let success = false;
    let version = "";

    try {
      switch (plugin.source) {
        case "spigot":
          version = await downloadSpigot(plugin.name, plugin.version, plugin.location, output);
          success = !!version;
          break;
        case "github":
          version = await downloadGithub(plugin.name, plugin.version, plugin.location, output);
          success = !!version;
          break;
        case "direct":
          success = await downloadURL(plugin.name, plugin.version, plugin.location, output);
          break;
        default:
          res.status(400).json({ error: "Unknown plugin source type." });
          return;
      }
    } catch (err) {
      res.status(500).json({ error: "Failed to download plugin", details: String(err) });
      return;
    }
    if (success) {
      res.status(200).json({ message: "Plugin downloaded successfully", version });
    } else {
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

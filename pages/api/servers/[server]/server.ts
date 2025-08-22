import { downloadPaper } from "@/lib/downloader";
import { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import fs from 'fs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == "PUT") {
    const { server, build } = req.body;

    if (typeof server !== "object" || typeof build !== "string") {
      res.status(400).json({ error: "Invalid params" });
      console.log(typeof build)
      return;
    }

    try {
      const output = path.join(server.location, 'server.jar');
      let success = false;
      let newVersion = await downloadPaper(build, server.version, output);
      success = !!newVersion;
      
      if (success) {
        res.status(200).json({ message: "Successful download", newVersion });
      } else {
        res.status(500).json({ error: "Download error" });
      }
    } catch (err) {
      res.status(500).json({ error: "Download error", details: String(err) })
    }
  } else if (req.method == "PATCH") {
    const { server, version } = req.body;

    if (typeof server !== "object" || typeof version !== "string") {
      res.status(400).json({ error: "Invalid params"});
      return;
    }

    try {
      const dataPath = path.join(process.cwd(), 'data', 'servers.json');
      if (fs.existsSync(dataPath)) {
        const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
        if (Array.isArray(data)) {
          const i = data.findIndex(s => s.name === server.name);
          if (i !== -1) {
            data[i].version = version;
            fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf-8");
          } else {
            res.status(500).json({ error: "Server does not exist" });
          }
        } else {
          res.status(500).json({ error: "Invalid server data file" });
        }
      }
      res.status(200).json({ message: "Successfully updated server" });
    } catch (err) {
      res.status(500).json({ error: "Version change error", details: String(err)});
    }
  } else {
    res.status(405).json({ error: "Method not allowed" })
  }
}
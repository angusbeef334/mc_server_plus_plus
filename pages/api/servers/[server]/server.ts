import { downloadPaper } from "@/lib/downloader";
import { NextApiRequest, NextApiResponse } from "next";
import path from "path";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == "PUT") {
    const { server, version } = req.body;

    if (typeof server !== "object" || typeof version !== "string") {
      res.status(400).json({ error: "Invalid server and/or version param" });
      return;
    }

    try {
      const output = path.join(server.location, 'server.jar');
      let success = false;
      let newVersion = await downloadPaper(version, '1.21.8', output);
      success = !!newVersion;
      
      if (success) {
        res.status(200).json({ message: "Paper downloaded successfully", newVersion });
      } else {
        res.status(500).json({ error: "Failed to download paper" });
      }
    } catch (err) {
      res.status(500).json({ error: "Failed to download paper", details: String(err) })
    }
  }
}
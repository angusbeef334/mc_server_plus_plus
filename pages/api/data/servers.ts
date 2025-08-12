import { NextApiRequest, NextApiResponse } from 'next';
import { getAllServers } from '@/lib/servers';
import { downloadSpigot, downloadGithub, downloadURL } from '@/lib/downloader';

export default function getServers(req: NextApiRequest, res: NextApiResponse) {
  try {
    const servers = getAllServers();
    downloadGithub('essentials', '-1', 'essentialsx/essentials', 'downloads/essentials.jar')
    res.status(200).json(servers);
  } catch (err) {
    res.status(500).json({ error: 'Could not read server data' });
  }
}

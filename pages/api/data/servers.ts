import { NextApiRequest, NextApiResponse } from 'next';
import { getAllServers } from '../../../lib/servers';

export default function getServers(req: NextApiRequest, res: NextApiResponse) {
  try {
    const servers = getAllServers();
    res.status(200).json(servers);
  } catch (err) {
    res.status(500).json({ error: 'Could not read server data' });
  }
}

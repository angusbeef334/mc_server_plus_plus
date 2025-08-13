import { NextApiRequest, NextApiResponse } from 'next';
import { getAllServers } from '@/lib/servers';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const servers = getAllServers();
      res.status(200).json(servers);
    } catch (err) {
      res.status(500).json({ error: 'Failed to read server data' });
    }
  } else {
    res.status(405).json({ error: 'Invalid method' });
  }
}

import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { getServer } from '@/lib/servers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const server = getServer(req.query.server?.toString() || '');
  
  if (server == null) {
    res.status(404).json({ log: '', error: 'Server does not exist' });
    return;
  }

  const location = path.join(server.location, 'logs', 'latest.log');

  try {
    const data = fs.readFileSync(location, 'utf8');
    res.status(200).json({ log: data });
  } catch (err) {
    res.status(500).json({ log: '', error: 'Failed to read logfile' });
  }
}

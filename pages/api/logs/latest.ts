import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const logPath = path.join(process.cwd(), 'logs', 'latest.txt');
  try {
    const data = fs.readFileSync(logPath, 'utf8');
    res.status(200).json({ log: data });
  } catch (err) {
    res.status(500).json({ log: '', error: 'Could not read log file.' });
  }
}

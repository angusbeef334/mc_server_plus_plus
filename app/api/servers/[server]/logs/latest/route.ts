import fs from 'fs';
import path from 'path';
import { getServer } from '@/lib/servers';

export async function GET(req: Request, { params }: { params: { server: string } }) {
  const { server } = params;
  const serverObj = getServer(server);

  if (serverObj == null) {
    return Response.json({ log: '', error: 'Server does not exist' }, { status: 404 });
  }

  const location = path.join(serverObj.location, 'logs', 'latest.log');

  try {
    const data = fs.readFileSync(location, 'utf8');
    return Response.json({ log: data });
  } catch (err) {
    return Response.json({ log: '', error: 'Failed to read logfile' }, { status: 500 });
  }
}
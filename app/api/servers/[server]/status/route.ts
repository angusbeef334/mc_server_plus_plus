import fs from 'fs';
import path from 'path';
import { getServer } from '@/lib/servers';

export async function GET(req: Request, { params }: { params: { server: string } }) {
  const { server } = await params;
  const serverObj = getServer(server);

  if (serverObj == null) {
    return Response.json({ log: '', error: 'Server does not exist' }, { status: 404 });
  }

  const location = path.join(serverObj.location, 'world', 'session.lock');

  return Response.json({ status: fs.existsSync(location) })
}
import { getAllServers } from '@/lib/servers';

export async function GET(req: Request) {
  try {
    const servers = getAllServers();
    return Response.json(servers);
  } catch (err) {
    return Response.json({ error: 'Failed to read server data' }, { status: 500 });
  }
}

import { spawn } from 'child_process'

export async function POST(req: Request) {
  const { path } = await req.json();
  
  return new Promise<Response>((resolve) => {
    let ret: string[] = [];
    const java = spawn(path, ['-version']);

    java.stdout?.on('data', (data) => {
      ret.push(data.toString());
    });
    java.stderr?.on('data', (data) => {
      ret.push(data.toString());
    });

    java.on('close', () => {
      resolve(Response.json({ output: ret.join('\n') }));
    });
    java.on('error', (err) => {
      resolve(Response.json({ error: err.message }, { status: 500 }));
    });
  });
}
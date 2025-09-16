import { spawn } from 'child_process'
import fs from 'fs';

export async function POST(req: Request) {
  const { path } = await req.json();

  return new Promise<Response>((resolve) => {
    let ret: string[] = [];

    if (!fs.existsSync(path)) {
      resolve(Response.json({ output: 'Selected binary does not exist' }, { status: 400 }));
      return;
    }

    try {
      fs.accessSync(path, fs.constants.X_OK);
    } catch (err) {
      resolve(Response.json({ output: 'Selected binary is not executable' }, { status: 400 }));
      return;
    }

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
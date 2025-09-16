import { spawn } from 'child_process';

const pathsWin = [
  'C:\\Program Files\\Java',
  'C:\\Program Files (x86)\\Java'
]

const pathsUnix = [
  '/usr',
  '/etc'
]

export async function GET() {
  let ret: string[] = [];

  if (process.platform === 'win32') {
    return Response.json({ data: '' }, { status: 200 });
  } else if (process.platform === 'darwin' || process.platform === 'linux') {
    const promises = pathsUnix.map((path) => {
      return new Promise<string[]>((resolve) => {
        const results: string[] = [];
        const child = spawn('find', [path, '-name', 'java']);

        child.stdout?.on('data', (data) => {
          const output = data.toString();
          if (output && !output.includes('find: ')) {
            results.push(output);
          }
        });

        child.on('close', () => {
          resolve(results);
        });
        
        child.on('error', () => {
          resolve([]);
        });
      });
    });

    const results = await Promise.all(promises);
    ret = results.flat();
  }

  return Response.json({ data: (ret.toString().replace(',','')) }, { status: 200 });
}
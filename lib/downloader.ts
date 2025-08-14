import fs from "fs";
import path from "path";

export interface Plugin {
  name: string;
  version: string;
  source: string;
  location: string;
}

/**
 * @param name name of the plugin
 * @param version old version of the plugin
 * @param id spigotmc plugin id
 * @returns string: new/current version if download successful/no new ver, empty if download failed
 */
export async function downloadSpigot(name: string, version: string, id: string, output: string): Promise<string> {
  const url = `https://api.spiget.org/v2/resources/${id}`;
  
  try {
    console.log(url)
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
      }
    });
    if (!res.ok) {
      console.error(`failed to get plugin information: ${res.statusText || 'unknown error'}`);
      return '';
    }

    const json = await res.json();
    if (json.external) {
      console.error(`plugin ${name} is external, try ${json.file.externalUrl}`);
      return '';
    }

    if (json.version.id > version) {
      version = json.version.id;

      const dataPath = path.join(process.cwd(), 'data', 'servers.json');
      if (fs.existsSync(dataPath)) {
        const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
        
        if (Array.isArray(data)) {
          const i = data.findIndex(s => s.plugins.some((p: { name: string }) => p.name === name));
          if (i !== -1) {
            const j = data[i].plugins.findIndex((p: { name: string }) => p.name === name);
            if (j !== -1) {
              data[i].plugins[j].version = version;
              fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf-8");
            }
          }
        }
      }
    } else {
      console.log(`no new version of ${name}, aborting`);
      return version;
    }

    try {
      return (
        (await downloadURL(name, version, `${url}/download?version=${version}`, output))?
        json.version.id : version
      )
    } catch (err) {
      console.error(`failed to download plugin ${name}: ${err || 'unknown error'}`);
      return '';
    }
  } catch (err) {
    console.error(`failed to get plugin information: ${err || 'unknown error'}`);
    return '';
  }
}

/**
 * @param name name of the plugin
 * @param version old version of the plugin
 * @param repo github repository id of the plugin
 * @returns string: empty if download failed, otherwise the new version
 */
export async function downloadGithub(name: string, version: string, repo: string, output: string): Promise<string> {
  try {
    const res = await fetch('https://api.github.com/repos/' + repo + '/releases/latest', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
      }
    });
    if (!res.ok) {
      console.error(`failed to get plugin info: ${res.statusText || 'unknown error'}`);
      return '';
    }

    const data = await res.json();
    const newVersion = data.tag_name;
    const url = data.assets[0].browser_download_url;

    const semverCompare = (a: string, b: string) => {
      const pa = a.split('.').map(Number);
      const pb = b.split('.').map(Number);
      for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const diff = (pa[i] || 0) - (pb[i] || 0);
        if (diff !== 0) return diff;
      }
      return 0;
    };

    if (semverCompare(newVersion, version) > 0) {
      version = newVersion;

      const dataPath = path.join(process.cwd(), 'data', 'servers.json');
      if (fs.existsSync(dataPath)) {
        const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

        if (Array.isArray(data)) {
          const i = data.findIndex(s => s.plugins.some((p: { name: string }) => p.name === name));
          if (i !== -1) {
            const j = data[i].plugins.findIndex((p: { name: string }) => p.name === name);
            if (j !== -1) {
              data[i].plugins[j].version = version;
              fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf-8");
            }
          }
        }
      }
    } else {
      console.log(`no new version of ${name}, aborting`);
      return version;
    }

    const res1 = await downloadURL(name, version, url, output);

    return res1? newVersion : '';
  } catch (err) {
    console.error(`failed to download plugin ${name}: ${err || 'unknown error'}`);
    return '';
  }
}

/** 
 * @param name name of the plugin
 * @param version old version of the plugin
 * @param location direct download url of the plugin
 * @returns boolean: true if successful download, else false
 */
export async function downloadURL(name: string, version: string, location: string, output: string): Promise<boolean> {
  try {
    const res = await fetch(location, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
      }
    });
    if (!res.ok) {
      console.error(`failed to download plugin at ${location}: ${res.statusText || 'unknown error'}`);
      return false;
    }

    const data = await res.arrayBuffer();

    const dir = path.dirname(output);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(output, Buffer.from(data));
  } catch (err) {
    console.error(`failed to download plugin ${name}: ${err || 'unknown error'}`);
    return false;
  }
  return true;
}
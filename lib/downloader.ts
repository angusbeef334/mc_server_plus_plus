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
      return '-2';
    }

    if (json.version.id > version) {
      version = json.version.id.toString();

      const dataPath = path.join(process.cwd(), 'data', 'servers.json');
      if (fs.existsSync(dataPath)) {
        try {
          const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

          if (Array.isArray(data)) {
            const i = data.findIndex(server => server.plugins.some((plugin: { name: string }) => plugin.name === name));
            if (i !== -1) {
              const j = data[i].plugins.findIndex((plugin: { name: string }) => plugin.name === name);
              if (j !== -1) {
                data[i].plugins[j].version = version;
                fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf-8");
              } else {
                console.error('plugin does not exist');
              }
            } else {
              console.error('server does not exist');
            }
          } else {
            console.error('invalid server data');
          }
        } catch (error) {
          console.error(`failed to read data: ${error || 'unknown error'}`);
        }
      } else {
        console.error(`server data file does not exist`);
      }
    } else {
      console.log(`no new version of ${name}, aborting`);
      return version;
    }

    try {
      return (
        (await downloadURL(name, `${url}/download?version=${version}`, output))?
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
        try {
          const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

          if (Array.isArray(data)) {
            //server
            const i = data.findIndex(server => server.plugins.some((plugin: { name: string }) => plugin.name === name));
            if (i !== -1) {
              //plugin
              const j = data[i].plugins.findIndex((plugin: { name: string }) => plugin.name === name);
              if (j !== -1) {
                data[i].plugins[j].version = version;
                fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf-8");
              } else {
                console.error(`plugin does not exist: ${name}`);
              }
            } else {
              console.error('server not found');
            }
          } else {
            console.error('invalid data format');
          }
        } catch (error) {
          console.error(`failed to get data`);
        }
      } else {
        console.error(`data file does not exist`);
      }
    } else {
      console.log(`no new version of ${name}, aborting`);
      return version;
    }

    const res1 = await downloadURL(name, url, output);

    return res1? newVersion : '';
  } catch (err) {
    console.error(`failed to download plugin ${name}: ${err || 'unknown error'}`);
    return '';
  }
}

/**
 * @param paperVer current build of paper
 * @param mcVer current version of mc
 * @param output 
 * @returns 
 */
export async function downloadPaper(paperVer: string, mcVer: string, output: string): Promise<string> {
  const location = `https://fill.papermc.io/v3/projects/paper/versions/${mcVer}/builds`
  try {
    const res = await fetch(location);
    
    if (!res.ok) {
      console.error(`failed to get paper versions data: ${res.statusText || 'unknown error'}`);
      return '';
    }

    const data = await res.json();
    const build = data[0].id;
    if (paperVer.toString() === build.toString()) {
      console.log(`no new version of paper, aborting`);
      return paperVer;
    }

    const res1 = await fetch(`${location}/${build}`);

    if (!res1.ok) {
      console.error(`failed to get paper builds data: ${res1.statusText || 'unknown error'}`);
      return '';
    }

    const data1 = await res1.json();
    const url = data1['downloads']['server:default']['url'];

    const res2 = await downloadURL('server', url, output);
    if (res2) {
      const servers = path.join(process.cwd(), 'data', 'servers.json');
      if (fs.existsSync(servers)) {
        try {
          const data = JSON.parse(fs.readFileSync(servers, "utf-8"));

          if (Array.isArray(data)) {
            const serverIndex = data.findIndex(server => server.software === 'paper' && server.version === mcVer);
            if (serverIndex !== -1) {
              data[serverIndex].build = build.toString();
              fs.writeFileSync(servers, JSON.stringify(data, null, 2), "utf-8");
            } else {
              console.error('server not found');
            }
          } else {
            console.error(`invalid servers.json file`);
          }
        } catch (error) {
          console.error(`failed to get data: ${error || 'unknown error'}`);
        }
      } else {
        console.error(`servers.json does not exist`);
      }
    }
    return res2? build : '';
  } catch (err) {
    console.error(`failed to download paper: ${err || 'unknown error'}`);
    return '';
  }
}

/** 
 * @param name name of the plugin
 * @param version old version of the plugin
 * @param location direct download url of the plugin
 * @returns boolean: true if successful download, else false
 */
export async function downloadURL(name: string, location: string, output: string): Promise<boolean> {
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
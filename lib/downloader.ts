import fs from "fs";
import path from "path";

export interface Plugin {
  name: string;
  version: string;
  source: string;
  location: string;
}

const semverCompare = (a: string, b: string) => {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
};

/**
 * @param name name of the plugin
 * @param version old version of the plugin
 * @param id spigotmc plugin id
 * @param output output path of the downloaded plugin
 * @param serverName name of the server
 * @returns string: new/current version if download successful/no new ver, empty if download failed, -2 if plugin is external (can't directly download)
 */
export async function downloadSpigot(name: string, version: string, id: string, output: string, serverName: string): Promise<string> {
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

      const res1 = (await downloadURL(name, `${url}/download?version=${version}`, output))
      const newVer = res1? json.version.id : '';

      const dataPath = path.join(process.cwd(), 'data', 'servers.json');
      if (fs.existsSync(dataPath)) {
        try {
          const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

          if (Array.isArray(data)) {
            const i = data.findIndex(server => server.name === serverName);
            if (i !== -1) {
              const j = data[i].plugins.findIndex((plugin: { name: string }) => plugin.name === name);
              if (j !== -1) {
                data[i].plugins[j].version = version;
                fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf-8");
              } else {
                console.error('plugin does not exist');
                return '';
              }
            } else {
              console.error('server does not exist');
              return '';
            }
          } else {
            console.error('invalid server data');
            return '';
          }
        } catch (error) {
          console.error(`failed to read data: ${error || 'unknown error'}`);
        }
      } else {
        console.error(`server data file does not exist`);
        return '';
      }
      
      return newVer;
    } else {
      console.log(`no new version of ${name}, aborting`);
      return version;
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
 * @param output output path of downloaded plugin
 * @param serverName name of the server
 * @returns string: empty if download failed, otherwise the new version
 */
export async function downloadGithub(name: string, version: string, repo: string, output: string, serverName: string): Promise<string> {
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
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

    if (semverCompare(newVersion, version) > 0) {
      const res1 = await downloadURL(name, url, output);
      const newVer = res1? newVersion : '';

      if (res1) {
        const dataPath = path.join(process.cwd(), 'data', 'servers.json');
        if (fs.existsSync(dataPath)) {
          try {
            const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

            if (Array.isArray(data)) {
              const i = data.findIndex(server => server.name === serverName);
              if (i !== -1) {
                const j = data[i].plugins.findIndex((plugin: { name: string }) => plugin.name === name);
                if (j !== -1) {
                  data[i].plugins[j].version = newVersion;
                  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf-8");
                } else {
                  console.error(`plugin does not exist: ${name}`);
                  return '';
                }
              } else {
                console.error('server not found');
                return '';
              }
            } else {
              console.error('invalid data format');
              return '';
            }
          } catch (error) {
            console.error(`failed to get data: ${error || 'unknown error'}`);
            return '';
          }
        } else {
          console.error(`data file does not exist`);
          return '';
        }
      }
      
      return newVer;
    } else {
      console.log(`no new version of ${name}, aborting`);
      return version;
    }
  } catch (err) {
    console.error(`[github] failed to download ${name}: ${err || 'unknown error'}`);
    return '';
  }
}

/**
 * @param name name of the plugin
 * @param version old version of the plugin
 * @param software the software (paper, velocity, waterfall) to download plugin for
 * @param id hangar plugin id
 * @param output output path of the downloaded plugin
 * @param serverName name of the server
 * @returns string: new/current version if download successful/no new ver, empty if download failed, -2 if plugin is external (can't directly download)
 */
export async function downloadHangar(name: string, version: string, software: string, id: string, output: string, serverName: string): Promise<string> {
  const url = `https://hangar.papermc.io/api/v1/projects/${id}/versions`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    const ver = data.result[0].id;
    if (data.result[0].downloads[software.toUpperCase()].externalUrl !== null) return '-2';
    if (ver.toString() === version) return version;
    
    const url1 = data.result[0].downloads[software.toUpperCase()].downloadUrl;
    const res1 = await downloadURL(name, url1, output);
    const newVer = res1? ver : '';

    if (res1) {
      const dataPath = path.join(process.cwd(), 'data', 'servers.json');
      if (fs.existsSync(dataPath)) {
        try {
          const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

          if (Array.isArray(data)) {
            const i = data.findIndex(server => server.name === serverName);
            if (i !== -1) {
              const j = data[i].plugins.findIndex((plugin: { name: string }) => plugin.name === name);
              if (j !== -1) {
                data[i].plugins[j].version = ver.toString();
                fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf-8");
              } else {
                console.error(`plugin does not exist: ${name}`);
                return '';
              }
            } else {
              console.error('server not found');
              return '';
            }
          } else {
            console.error('invalid data format');
            return '';
          }
        } catch (error) {
          console.error(`failed to get data: ${error || 'unknown error'}`);
          return '';
        }
      } else {
        console.error(`data file does not exist`);
        return '';
      }
    }

    return newVer;
  } catch (err) {
    console.error(`[hangar] failed to download ${name}: ${err || 'unknown error'}`);
    return '';
  }
}

/**
 * @param name name of the mod
 * @param version old version of the mod
 * @param id modrinth mod id
 * @param output output path of downloaded plugin
 * @param server the server object
 */
export async function downloadModrinth(name: string, version: string, id: string, output: string, server: {software: string, version: string, name: string}): Promise<string> {
  const url = `https://api.modrinth.com/v2/project/${id}/version?loaders=["${server.software}"]`;
  let url1 = '';
  let newVer = '';

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`modrinth failed to download ${name}: ${res.statusText}`);
      return '';
    }
    const data = await res.json();

    data.map((ver: {
      game_versions: string[]; id: string; files: {hashes: {sha512: string, sha1: string}, url: string}[]
    }) => {
      if (ver.game_versions.filter(ver => ver === server.version).length != 0 && url1 === '') {
        url1 = ver.files[0].url;
        newVer = ver.id;
      }
    })

    if (newVer === version) return version;

    const res1 = await downloadURL(name, url1, output);
    
    if (res1) {
      const dataPath = path.join(process.cwd(), 'data', 'servers.json');
      if (fs.existsSync(dataPath)) {
        try {
          const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

          if (Array.isArray(data)) {
            const i = data.findIndex(s => s.name === server.name);
            if (i !== -1) {
              const j = data[i].plugins.findIndex((plugin: { name: string }) => plugin.name === name);
              if (j !== -1) {
                data[i].plugins[j].version = newVer;
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
          console.error(`failed to read data: ${error || 'unknown error'}`);
        }
      } else {
        console.error(`server data file does not exist`);
      }
    }
    
    return res1? newVer : '';
  } catch (e) {
    console.error(`modrinth failed to download ${name}: ${e || 'unknown error'}`);
    return '';
  }
}

/**
 * @param name name of the plugin
 * @param version old version of the plugin
 * @param id bukkit plugin id
 * @param output output path of downloaded plugin
 * @returns boolean: true if download success, else false
 */
export async function downloadBukkit(name: string, version: string, id: string, output: string): Promise<boolean> {
  const url = `https://dev.bukkit.org/projects/${id}/files/latest`;

  return await downloadURL(name, url, output);
}

/**
 * @param fabricVer current build of fabric
 * @param mcVer current version of mc
 * @param output the output path of the downloaded software
 * @param name the server name
 * @returns string: new version if download successful else blank string
 */
export async function downloadFabric(version: string, mcVer: string, output: string, name: string) {
  const url = `https://meta.fabricmc.net/v2/versions/loader/${mcVer}`;
  const url1 = 'https://meta.fabricmc.net/v2/versions/installer';
  try {
    const res = await fetch(url);

    if (!res.ok) {
      console.error(`failed to get fabric loader versions data: ${res.statusText}`);
      return '';
    }

    const data = await res.json();
    const build = data[0].loader.version;
    if (semverCompare(build, version) === 0) {
      console.log('no new version of fabric, aborting');
      return version;
    }

    const res1 = await fetch(url1);

    if (!res1.ok) {
      console.error(`failed to get fabric installer versions data: ${res1.statusText}`);
      return '';
    }

    const data1 = await res1.json();
    const build1 = data1[0].version;

    const url2 = `https://meta.fabricmc.net/v2/versions/loader/${mcVer}/${build}/${build1}/server/jar`;
    const res2 = await downloadURL('server', url2, output);
    
    if (res2) {
      const servers = path.join(process.cwd(), 'data', 'servers.json');
      if (fs.existsSync(servers)) {
        try {
          const data = JSON.parse(fs.readFileSync(servers, "utf-8"));

          if (Array.isArray(data)) {
            const serverIndex = data.findIndex(server => server.name === name);
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
  } catch (e) {
    console.error(`failed to download fabric: ${e}`)
  }
}

/**
 * @param paperVer current build of paper
 * @param mcVer current version of mc
 * @param output the output path of the downloaded software
 * @returns string: new version if download successful else blank string
 */
export async function downloadPaper(paperVer: string, mcVer: string, output: string, name: string): Promise<string> {
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
            const serverIndex = data.findIndex(server => server.name === name);
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
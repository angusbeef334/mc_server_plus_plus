import fs from "fs";

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
 * @returns boolean: true if successful download, else false
 */
export async function downloadSpigot(name: string, version: string, id: string, output: string): Promise<boolean> {
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
      return false;
    }

    const json = await res.json();
    if (json.external) {
      console.error(`plugin ${name} is external, try ${json.file.externalUrl}`);
      return false;
    }

    if (json.version.id > version) {
      version = json.version.id;
    } else {
      console.log(`no new version of ${name}, aborting`);
      return false;
    }
  } catch (err) {
    console.error(`failed to get plugin information: ${err || 'unknown error'}`);
    return false;
  }

  try {    
    return await downloadURL(name, version, `${url}/download?version=${version}`, output);
  } catch (err) {
    console.error(`failed to download plugin ${name}: ${err || 'unknown error'}`);
    return false;
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
        'User-Agent': 'Mozilla/5.0 (compatible; mc_server_plus_plus/1.0)'
      }
    });
    if (!res.ok) {
      console.error(`failed to get plugin info: ${res.statusText || 'unknown error'}`);
      return '';
    }

    const data = await res.json();
    const newVersion = data.tag_name;
    const url = data.assets[0].browser_download_url;

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
        'User-Agent': 'Mozilla/5.0 (compatible; mc_server_plus_plus/1.0)'
      }
    });
    if (!res.ok) {
      console.error(`failed to download plugin at ${location}: ${res.statusText || 'unknown error'}`);
      return false;
    }

    const data = await res.arrayBuffer();

    const path = require('path');
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
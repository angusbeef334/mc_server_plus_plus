export interface Mod {
  name: string;
  version: string;
  source: string;
  location: string;
}

export interface Server {
  name: string;
  location: string;
  software: string;
  version: string;
  build: string;
  plugins: Mod[];
  java: string;
}
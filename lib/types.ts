interface Server {
  name: string;
  location: string;
  software: string;
  version: string;
  build: string;
  plugins: {
    name: string;
    version: string;
    source: string;
    location: string;
  }[];
  java: string;
}
# MCServer++
A next.js based webapp for managing Minecraft servers.

## Supported software
### Server
* [Paper](https://papermc.io)
* [Fabric](https://fabricmc.net)

### Mods/Plugins
* GitHub
* Direct URL
* [SpigotMC](https://spigotmc.org/resources)
* [Hangar](https://hangar.papermc.io/)
* [Bukkit](https://dev.bukkit.org)
* [Modrinth](https://modrinth.com)

## Installation
### Prerequisites
Docker and docker-compose.

### Deploy
```
$ git clone https://github.com/angusbeef334/mc_server_plus_plus
$ cd mc_server_plus_plus
$ docker-compose up --build -d
```

Note: if your servers will use ports other than 25565 and 25575, such as having different ports for multiple running servers, you will need to add them to the docker-compose like so:
```
  ports:
    - "3000:3000"
    - "25565:25565"
    - "25575:25575"
    - "PORT:PORT"
```

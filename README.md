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

Note: if your server will use ports other than 25565 and 25575, you will need to add them to the docker-compose.
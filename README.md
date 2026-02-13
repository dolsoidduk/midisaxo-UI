# OpenDeck configurator

This repository contains source code for OpenDeck configurator (midisaxo fork). For more information on this fork, check the [firmware repository](https://github.com/dolsoidduk/midisaxo).

*Click the image below for a demo video of the [OpenDeck configurator](https://dolsoidduk.github.io/midisaxo-UI/)*

[![Watch the video](https://img.youtube.com/vi/7X2LC0JMfAU/maxresdefault.jpg)](https://youtu.be/7X2LC0JMfAU)

The configurator is always available online via [this link](https://dolsoidduk.github.io/midisaxo-UI/). Offline versions are available under [Releases section](https://github.com/dolsoidduk/midisaxo-UI/releases). Each release has attached 3 zip files. Download the appropriate one depending on your operating system:

* darwin-x64 -> Intel macOS
* linux-x64 -> Linux x64
* win32-x64 -> Windows x64

## Development

This projects uses Docker container for development. To use it, run the following command from the root repository directory:

    ./scripts/dev.sh

The development version of the configurator with local server can be started with the following commands:

    make

To package the configurator for offline usage, `make pkg` command can be used with `PLATFORM` variable being set to the platform for which to build the configurator:

* Linux: `make pkg PLATFORM=linux`
* Windows: `make PLATFORM=win32`
* macOS: `make PLATFORM=darwin`
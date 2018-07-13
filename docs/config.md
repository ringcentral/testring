
# Config API

At first, testring have similar API for config file and arguments in command line, 
so this guide will have examples for both CLI and config file.

## Getting started
Framework have 3 levels of configuration, sorted by priority: 
```
CLI arguments -> environment file -> config file
```
Config file have lowest priority, it's fields will be overrided by environment config, if it's exists, 
CLI arguments overrides everything.

Config file is root configuration,


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

## Fields


#### `config` <small>string</small>

###### **default:** `./testring.json`

Path to config file, relative to project root, works only as CLI argument.
Config can be json or javascript file.

Javascript file should return:
* Config object;
* Function with config object;
* Function with `Promise`, that returns config object (for async initialization).

```
$ testring --config ./my-custom-config.json
```


#### `envConfig` <small>string</small>

###### **default:** `void`

Path to environment config, relative to project root, works only as CLI argument.
All resolving logic is similar to `--config`. 

`envConfig` extends and overrides original config, useful for decomposing config into smaller parts.


### `tests` <small>string</small>

###### **default:** `./tests/**/*.js`

Glob pattern, relative to project root. 
All founded file will be added to run queue.

```
$ testring --tests ./src/**/test/*.spec.js
```

```json
{
  "tests": "./src/**/test/*.spec.js"
}
```


### `logLevel` <small>string</small>

###### **default:** `info`

Filtering logs for logger.

Available levels:
* `verbose`;
* `debug`;
* `info`;
* `warning`;
* `error`;
* `silent`;

```
$ testring --log-level silent
```

```json
{
  "logLevel": "silent"
}
```


### `silent` <small>boolean</small>

###### **default:** `false`

Alias for `--logLevel silent`.

```
$ testring --silent
```

```json
{
  "silent": true
}
```


### `bail` <small>boolean</small>

###### **default:** `false`

Fail out on the first error instead of tolerating it.

```
$ testring --bail
```

```json
{
  "bail": true
}
```


### `workerLimit` <small>number</small>

###### **default:** `10`

Limit of parallel running tests. Increase this number carefully, 
because a lot of workers won't be so efficient, 
also your driver plugin may not be able to handle so much connections.

```
$ testring --worker-limit 20
```

```json
{
  "workerLimit": 20
}
```


### `retryCount` <small>number</small>

###### **default:** `3`

Reruns count, if test failed. Useful, if your test is not stable.

```
$ testring --retry-count 5
```

```json
{
  "retryCount": 5
}
```


### `retryDelay` <small>number</small>

###### **default:** `2000`

Value in milliseconds, adds time gap between reruns of test.

```
$ testring --retry-delay 10000
```

```json
{
  "retryDelay": 10000
}
```


### `httpThrottle` <small>number</small>

###### **default:** `0`

Delay between http requests in milliseconds. Useful if you don't want spam your test environment.

```
$ testring --http-throttle 500
```

```json
{
  "httpThrottle": 500
}
```


### `plugins` <small>array</small>

###### **default:** `void`

Plugins are powerful instrument for extending framework functional. 
More about plugins you can read [here](plugin-handbook.md).

```
$ testring --plugins my-plugin-1 --plugins my-plugin-2
```

```json
{
  "plugins": [
    "my-plugin-1",

    ["my-plugin-2", {
      "userConfig": true
    }]
  ]
}
```

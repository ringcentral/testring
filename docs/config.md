
# Config API

At first, testring have similar API for config file and arguments in command line, 
so this guide will have examples for both CLI and config file.

Framework have 3 levels of configuration, sorted by priority: 
```
CLI arguments -> environment file -> config file
```
Config file have lowest priority, it's fields will be overrided by environment config, if it's exists, 
CLI arguments overrides everything.

* [config](#config)
* [envConfig](#envConfig)
* [tests](#tests)
* [logLevel](#logLevel)
* [bail](#bail)
* [workerLimit](#workerLimit)
* [retryCount](#retryCount)
* [retryDelay](#retryDelay)
* [httpThrottle](#httpThrottle)
* [plugins](#plugins)


## `config`

###### `./testring.json` <sup>default</sup>

Path to config file, relative to project root, works only as CLI argument.
Config can be json or javascript file.

Javascript file should return:
* Config object;
* Function with config object;
* Function with `Promise`, that returns config object (for async initialization).

```
$ testring run --config ./my-custom-config.json
```

<br/>

## `envConfig`

###### `void` <sup>default</sup>

Path to environment config, relative to project root, works only as CLI argument.
All resolving logic is similar to `--config`. 

`envConfig` extends and overrides original config, useful for decomposing config into smaller parts.

<br/>

## `tests`

###### `./tests/**/*.js` <sup>default</sup>

[Glob](https://github.com/isaacs/node-glob#glob-primer) pattern, relative to project root. 
All founded file will be added to run queue.

```
$ testring run --tests ./src/**/test/*.spec.js
```

```json
{
  "tests": "./src/**/test/*.spec.js"
}
```

<br/>

## `logLevel`

###### `info` <sup>default</sup>

Filtering logs rule.

Available levels:
* `verbose`
* `debug`
* `info`
* `warning`
* `error`
* `silent`

```
$ testring run --log-level silent
```

```json
{
  "logLevel": "silent"
}
```

<br/>

## `silent`

###### `false` <sup>default</sup>

Alias for `--logLevel silent`.

```
$ testring run --silent
```

```json
{
  "silent": true
}
```

<br/>

## `bail`

###### `false` <sup>default</sup>

Fail out on the first error instead of tolerating it.

```
$ testring run --bail
```

```json
{
  "bail": true
}
```

<br/>

## `workerLimit`

###### `10` <sup>default</sup>

Limit of parallel running tests. Increase this number carefully, 
because a lot of workers won't be so efficient, 
also your driver plugin may not be able to handle so much connections.

```
$ testring run --worker-limit 20
```

```json
{
  "workerLimit": 20
}
```

<br/>

## `retryCount`

###### `3` <sup>default</sup>

Reruns count, if test failed. Useful, if your test is not stable.

```
$ testring run --retry-count 5
```

```json
{
  "retryCount": 5
}
```

<br/>

## `retryDelay`

###### `2000` <sup>default</sup>

Value in milliseconds, adds time gap between reruns of test.

```
$ testring run --retry-delay 10000
```

```json
{
  "retryDelay": 10000
}
```

<br/>

## `httpThrottle`

###### `0` <sup>default</sup>

Delay between http requests in milliseconds. Useful if you don't want spam your test environment.

```
$ testring run --http-throttle 500
```

```json
{
  "httpThrottle": 500
}
```

<br/>

## `plugins`

###### `void` <sup>default</sup>

Plugins are powerful instrument for extending framework functional. 
More about plugins you can read [here](plugin-handbook.md).

```
$ testring run --plugins my-plugin-1 --plugins my-plugin-2
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

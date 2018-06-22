# Plugin handbook

## Plugin usage

Config:
```json
{
    "plugins": [
      "testring-plugin-logger-fs",
      ["testring-plugin-test-metadata", {
        "format": "json"
      }]
    ]
}
```

Arguments:
```
testring --plugins=testring-plugin-1 --plugins=testring-plugin-2
```

## Plugin creating

Simple logger:
```javascript
export default (pluginAPI, userConfig) => {
    const logger = pluginAPI.getLogger();
    
    logger.onLog((log) => {
        switch(log.type) {
            case 'error': 
                if (userConfig.logErrors) {
                    console.error(...log.content);
                }
                break;
                
            default:
                console.log(...log.content);
                    
        }
    });
};
```

### PluginAPI

// TODO write API reference when it will be done

#### getLogger(): LoggerAPI

#### getTestFinder(): TestFinderAPI

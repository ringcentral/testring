# Plugins

## Plugin usage

Config:
```json
{
    "plugins": [
      "testring-plugin-logger-fs",
      
      ["testring-plugin-test-metadata", {
        "format": "json"
      }],
      
      ["selenium-driver", {
        "seleniumHub": "10.313.441.302:3232"
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

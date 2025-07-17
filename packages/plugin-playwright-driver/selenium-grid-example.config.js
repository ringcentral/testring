// Selenium Grid 配置示例 for @testring/plugin-playwright-driver

module.exports = {
    plugins: [
        // 基本 Selenium Grid 配置
        ['@testring/plugin-playwright-driver', {
            browserName: 'chromium', // 只有 chromium 和 msedge 支持 Selenium Grid
            seleniumGrid: {
                gridUrl: 'http://selenium-hub:4444',
                gridCapabilities: {
                    'browserName': 'chrome',
                    'browserVersion': 'latest',
                    'platformName': 'linux'
                }
            }
        }],
        
        // Microsoft Edge with Selenium Grid
        /*
        ['@testring/plugin-playwright-driver', {
            browserName: 'msedge',
            seleniumGrid: {
                gridUrl: 'http://selenium-hub:4444',
                gridCapabilities: {
                    'browserName': 'edge',
                    'browserVersion': 'latest',
                    'platformName': 'windows'
                }
            }
        }],
        */
        
        // 高级 Selenium Grid 配置
        /*
        ['@testring/plugin-playwright-driver', {
            browserName: 'chromium',
            seleniumGrid: {
                gridUrl: 'https://your-selenium-grid.com:4444',
                gridCapabilities: {
                    'browserName': 'chrome',
                    'browserVersion': '120.0',
                    'platformName': 'linux',
                    'se:options': {
                        'args': ['--disable-web-security', '--disable-features=VizDisplayCompositor']
                    },
                    'custom:testName': 'My Test Suite',
                    'custom:buildNumber': process.env.BUILD_NUMBER || 'local'
                },
                gridHeaders: {
                    'Authorization': 'Bearer your-auth-token',
                    'X-Custom-Header': 'custom-value'
                }
            },
            // 其他 Playwright 配置仍然有效
            contextOptions: {
                viewport: { width: 1920, height: 1080 },
                locale: 'en-US'
            },
            video: true,
            trace: true
        }]
        */
    ],
    
    // 测试文件
    tests: './**/*.spec.js',
    
    // 其他 testring 配置...
    workerLimit: 4,
    retryCount: 2
};

// 环境变量方式配置 (优先级更高)
/*
export SELENIUM_REMOTE_URL=http://selenium-hub:4444
export SELENIUM_REMOTE_CAPABILITIES='{"browserName":"chrome","browserVersion":"latest","platformName":"linux"}'
export SELENIUM_REMOTE_HEADERS='{"Authorization":"Bearer token","X-Test-Type":"e2e"}'
*/

// Docker Compose 示例 selenium-grid.yml
/*
version: '3.8'

services:
  selenium-hub:
    image: selenium/hub:4.15.0
    container_name: selenium-hub
    ports:
      - "4442:4442"
      - "4443:4443"
      - "4444:4444"
    environment:
      - GRID_MAX_SESSION=16
      - GRID_BROWSER_TIMEOUT=300
      - GRID_TIMEOUT=300

  chrome:
    image: selenium/node-chrome:4.15.0
    shm_size: 2gb
    depends_on:
      - selenium-hub
    environment:
      - HUB_HOST=selenium-hub
      - HUB_PORT=4444
      - NODE_MAX_INSTANCES=4
      - NODE_MAX_SESSION=4
    scale: 2

  edge:
    image: selenium/node-edge:4.15.0
    shm_size: 2gb
    depends_on:
      - selenium-hub
    environment:
      - HUB_HOST=selenium-hub
      - HUB_PORT=4444
      - NODE_MAX_INSTANCES=2
      - NODE_MAX_SESSION=2
    scale: 1
*/

// 使用方法:
// 1. 启动 Selenium Grid: docker-compose -f selenium-grid.yml up -d
// 2. 运行测试: npm test -- --config selenium-grid-example.config.js 
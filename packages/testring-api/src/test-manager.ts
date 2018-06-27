import {} from '@testring/logger'

import * as fs from 'fs';
import * as path from 'path';
import _ from 'lodash';
import request from 'request';

const uuidv4 = require('uuid/v4');

let rootFolder = process.cwd();
let rootPath = rootFolder.split(path.sep);

const TESTS_FOLDER = 'tests';

const runFromRoot = rootPath.indexOf(TESTS_FOLDER) === -1;

let customWatConfigPath;
let customWatConfig;

if (runFromRoot) {
    customWatConfigPath = path.join(rootFolder, TESTS_FOLDER, 'wat.config');
    customWatConfig = (require(customWatConfigPath) || {}).config || {};
} else {
    rootPath = rootPath.splice(0, rootPath.indexOf(TESTS_FOLDER));
    rootFolder = rootPath.join(path.sep);
    customWatConfigPath = path.join(rootFolder, TESTS_FOLDER, 'wat.config');
    customWatConfig = (require(customWatConfigPath) || {}).config || {};
}

const DEFAULT_DIRECTORY_SETTING = 'WEBDRIVER.desiredCapabilities.chromeOptions.prefs.download.default_directory';

export class TestManager extends BaseManager {
    /**
     * @private
     */
    browserClient;

    /**
     * @private
     */
    session;

    /**
     * @private
     */
    localSelenium;

    /**
     * @type {boolean}
     * @private
     */
    avoidSingleBrowser;

    /**
     * @type {BaseManager[]}
     * @private
     */
    _managers = [];

    /**
     * @type {Object[]}
     * @private
     */
    // RLZ-28078
    // _managerFinalLogs = [];

    /**
     * @type {string[]}
     * @private
     */
    scriptTags = [];

    constructor(options) {
        super(options);

        for (let managerKey of Object.keys(watConfig.managers)) {
            const mngr = watConfig.managers[managerKey];
            const getter = mngr.getter || `get${managerKey}`;
            let args = {};
            if (_.isFunction(mngr.args)) {
                args = mngr.args(config);
            } else {
                args = _.merge(args, mngr.args);
            }

            const customMngr = (customWatConfig.managers || {})[managerKey];
            if (customMngr) {
                args = _.merge(args, customMngr.args || {});
            }

            const {envConfig, ...rest} = args;

            if (!this[getter]) {
                this[getter] = (options) => {
                    return this.getManager(managerKey, {...envConfig, ...rest, ...options});
                };
            }
        }

        process.on('SIGINT', () => {
            this.freeAllManagers();
            process.exit();
        });
    }

    /**
     * @param {string} message
     * @return {Promise}
     */
    async logBusiness(message) {
        return this.logger.step(message);
    }

    /**
     * @param {string} message
     * @return {Promise}
     */
    async logError(message) {
        return this.logger.error(message);
    }

    /**
     * @param {string} message
     * @return {Promise}
     */
    async logWarning(message) {
        return this.logger.warn(message);
    }

    /**
     * @param {string} name
     * @param {Object} options
     * @return {Promise<BaseManager>}
     * @private
     */
    async getManager(name, options = {}) {
        let manager = watConfig.managers[name];

        if (!manager) {
            throw new Error('Unknown manager ' + name);
        }

        const defaultOptions = {
            runId: argv.runId
        };

        const fullOptions = {
            ...defaultOptions,
            ...config[name],
            ...options
        };

        if (!argv.useApplicationName) {
            delete fullOptions.applicationName;
        }

        let MngrConstructor;
        if (_.isFunction(manager)) {
            MngrConstructor = manager;
        } else {
            MngrConstructor = manager.ctor;
        }

        if (argv.webHost) {
            config.WEB.host = argv.webHost;
        }
        let instance = new MngrConstructor(_.merge({}, fullOptions));
        instance.config = _.merge({}, config);

        if (name !== 'Logger' && instance.logger) {
            instance.logger.loggerManager = this.logger.mgr;
            instance.logger.loggerManagerArgs = this.logger.mgrArgs;
            instance.logger._reportDir = argv.reportDir;
        }

        if (fullOptions.requireBrowser) {
            await this.injectClientIntoManager(instance, fullOptions, config);
        }

        await instance.init();

        // RLZ-28078
        // if (instance.onDispose && instance.getFinalLog) {
        //     instance.onDispose(async () => {
        //         let log = await instance.getFinalLog();
        //         if (log) {
        //             this._managerFinalLogs.push(log);
        //         }
        //     });
        // }

        this._managers.push(instance);
        return instance;
    }

    /**
     * @param {BaseManager} manager
     * @param {Object} fullOptions
     * @param {Object} config
     * @private
     */
    async injectClientIntoManager(manager, fullOptions, config) {
        if (config.WEBDRIVER.capabilities && config.WEBDRIVER.desiredCapabilities) {
            await this.logger.warn('desiredCapabilities and capabilities object is passed in WEBDRIVER config' +
                ' please be sure that only one of them is exists');
        }

        if (fullOptions.applicationName && config.WEBDRIVER && config.WEBDRIVER.desiredCapabilities) {
            config.WEBDRIVER.desiredCapabilities = {
                ...config.WEBDRIVER.desiredCapabilities,
                applicationName: fullOptions.applicationName
            };
        }

        manager.downloadTempDir = fullOptions.runId || uuidv4();
        await manager.createDownloadDir();

        if (manager.downloadEnabled && _.isFunction(manager.getBrowserDownloadDir)) {
            _.set(config, DEFAULT_DIRECTORY_SETTING, manager.getBrowserDownloadDir());
        }

        const client = await this.getBrowserClientInstance(config);

        if (isDebugMode()) {
            manager._client = client.browserClient;
        } else {
            manager.client = client.browserClient;
        }

        manager.singleBrowser = argv.singleBrowser;
    }

    /**
     * @param {Object} config
     * @return {Promise<{browserClient: *, session: *}>}
     * @private
     */
    async getBrowserClientInstance(config) {
        if (argv.singleBrowser && !this.avoidSingleBrowser) {
            if (!this.browserClient) {
                this.browserClient = remote(config.WEBDRIVER);
                this.session = await this.browserClient.init();
            }
            return {
                browserClient: this.browserClient,
                session: this.session
            };
        } else {
            const browserClient = remote(config.WEBDRIVER);
            const session = await browserClient.init();
            return {browserClient, session};
        }
    }

    /**
     * @param {Object} [options]
     * @return {Promise<DebugManager>}
     * @private
     */
    getDebug(options = {}) {
        return this.getManager('Debug', _.extend({}, {context: this}, options));
    }

    /**
     * @param {boolean} [failed]
     * @param {BaseManager[]} except
     * @private
     */
    async freeAllManagers(failed = false, except = []) {
        if (this._managers.length) {
            await this.logger.custom({registerStep: false, type: 'debug'}, 'Freeing all allocated managers');
            let managers = this._managers.filter(manager => !except.includes(manager));
            for (let manager of managers) {
                await this.freeManager(manager, failed);
            }
        }
        await this.logger.custom({registerStep: false, type: 'debug'}, 'Managers released.');
    }

    /**
     * @param {BaseManager} instance
     * @param {boolean} [failed]
     * @private
     */
    async freeManager(instance, failed = false) {
        if (_.isFunction(instance.dispose)) {
            try {
                await instance.dispose(failed);
            } catch (error) {
                await this.logger.custom({registerStep: false, type: 'debug'}, error.message || String(error));
            }
        }
        _.remove(this._managers, instance);
    }

    /**
     * @return {Object|null}
     * @private
     */
    getCapabilities() {
        // TODO make array work
        if (config.WEBDRIVER && _.has(config.WEBDRIVER, 'capabilities')) {
            return config.WEBDRIVER.capabilities;
        }

        if (config.WEBDRIVER && _.has(config.WEBDRIVER, 'desiredCapabilities')) {
            return config.WEBDRIVER.desiredCapabilities;
        }

        return null;
    }

    /**
     * @return {string[]}
     * @private
     */
    getChromeDriverArgs() {
        const chromeDriver = require('chromedriver');

        return [`-Dwebdriver.chrome.driver=${chromeDriver.path}`];
    }

    /**
     * @return {string[]}
     * @private
     */
    getFirefoxDriverArgs() {
        let args = ['-browser', 'browserName=firefox'];
        let capabilities = this.getCapabilities();

        if (capabilities && capabilities.driver) {
            args.push(`-Dwebdriver.firefox.bin=${capabilities.driver}`);
        }

        return args;
    }

    /**
     * @private
     */
    async runLocalSelenium() {
        const seleniumServer = require('selenium-server');
        const seleniumJarPath = seleniumServer.path;
        let args = ['java'];
        let capabilities = this.getCapabilities();

        switch (capabilities.browserName) {
            case 'chrome':
                args.push(...this.getChromeDriverArgs());
                break;
            case 'firefox':
                args.push(...this.getFirefoxDriverArgs());
                break;
            default:
                throw Error('Uknown browser type');
        }

        args.push('-jar', seleniumJarPath);

        this.logger.info(`Starting selenium / selenium jar path: ${seleniumJarPath}`);

        this.localSelenium = forever.start(args, {
            max: 1,
            silent: true,
            spawnWith: {
                detached: true
            },
            cwd: rootFolder
        });
        await this.pause(1000, true);
    }

    /**
     * @param {function[]} fns
     * @return {Promise<boolean|void>}
     */
    async run(...fns) {
        if (isWatchingFile(require.main.filename)) {
            return false;
        }

        // run selenium in background
        if (!config.WEBDRIVER.host && !argv.preconditionsOnly) {
            await this.runLocalSelenium();
        }

        this.logger.debug('Running node version: ' + await exec('node -v'));
        this.logger.debug('Running npm version: ' + await exec('npm -v'));
        if (argv.precompile) {
            await this.logger.debug('Transpiling with babel: \n' + await exec('npm run precompile'));
        }

        let testJson;
        try {
            testJson = await getTestJSON();
        } catch (e) {
            await this.logger.debug(e);
            throw e;
        }
        let testData = testJson[TEST_DATA_KEY];
        this.avoidSingleBrowser = Boolean(testJson.avoidSingleBrowser);
        testData.forEach((test, index) => test.dataIndex = index);
        const total = testData.length;
        let commonScenarios = testJson[SCENARIOS_KEY] || [];
        let expectedData = testJson[EXPECTED_KEY] || null;
        let inputData = testJson[INPUT_KEY] || null;
        this.scriptTags = testJson[TAGS];
        const violations = checkTagsRules(testJson[TAGS]);
        violations.forEach(x => this.logger.warn(x));
        if (expectedData != null || inputData != null || commonScenarios.length) {
            for (let dataTest of testData) {
                if (commonScenarios.length && dataTest.account) {
                    dataTest.account.scenarios = [...commonScenarios, ...(dataTest.account.scenarios || [])];
                }
                if (expectedData != null) {
                    dataTest.expected = {...expectedData, ...dataTest.expected};
                }
                if (inputData != null) {
                    dataTest.input = {...inputData, ...dataTest.input};
                }
            }
        }
        let actualTestData = testData.filter(item => !item.skip);
        if (argv.index) {
            let n = Number(argv.index) || 0;
            if (n > total - 1) {
                throw Error('Can not select testdata item with index ' + n + ' from array of ' + total + ' items');
            }
            actualTestData = [testData[n]];
        }

        let successCount = 0;
        let failCount = 0;
        let testCount = 0;

        if (!actualTestData || actualTestData.length === 0) {
            await this.logger.error('test data is not specified');
        }

        this.logger.loggerManager = await this.getLogger();

        let testClassName;
        const parsedPath = path.parse(require.main.filename);
        const dirs = (path.relative(rootFolder, parsedPath.dir)).split(path.sep);
        testClassName = dirs.slice(dirs.indexOf(TESTS_FOLDER) + 1).join('.');

        let testId = testClassName + '.' + parsedPath.name;

        let testLinkId = '';
        for (let q in testJson.tags) {
            if (testJson.tags[q].indexOf('#') === -1) {
                testLinkId = testJson.tags[q];
                break;
            }
        }

        for (let testData of actualTestData) {
            let params = {testId, testLinkId, testClassName, total};

            testCount++;

            let isPassed = await this.runTest(argv.iteration || 1, fns, testData, params);

            if (isPassed) {
                successCount++;
            } else {
                failCount++;
            }
        }

        let skippedCount = total - actualTestData.length;
        if (skippedCount) {
            await this.logger.warn('skipped tests count: ' + skippedCount);
        }

        let finalMsg = 'DONE: ' + successCount + '/' + total;

        if (this.browserClient) {
            try {
                await this.browserClient.end();
                this.browserClient = null;
            } catch (ignoreError) {
            }
        }

        if (this.localSelenium) {
            try {
                this.localSelenium.stop();
                this.localSelenium = null;
            } catch (ignoreError) {
            }
        }

        failCount
            ? await this.logger.error(finalMsg)
            : await this.logger.info(finalMsg);

        exitCode = failCount ? 1 : 0;

        // https://github.com/babel/babel/issues/4554
        // process.send is not a function in child spawned with babel-node
        if (_.isFunction(process.send)) {
            process.send({count: testCount});
        }

        stopAll();
    }

    /**
     * @param {number} iteration
     * @param {function[]} fns
     * @param {Object} testData
     * @param {string} testId
     * @param {string} testLinkId
     * @param {string} testClassName
     * @param {number} total
     * @return {Promise<boolean>}
     * @private
     */
    async runTest(iteration, fns, testData, {testId, testLinkId, testClassName, total}) {
        let index = testData.dataIndex + 1;
        let debugManager;
        if (IS_DEBUG_MODE) {
            debugManager = await this.getDebug();
        }

        let testStatus = LOGGER_TEST_STATUS_PASS;
        let testError = null;
        let loggerManagerArgs = {};

        try {
            let testMethod = `${path.basename(require.main.filename, '.js')} - #${index} of ${total}`;

            let testUid = argv.uuid || uuidv4();

            await this.logger.info('run #' + index + ' started');

            let scenario = testData.scenario
                ? Array.isArray(testData.scenario)
                    ? testData.scenario
                    : testData.scenario.trim().toLowerCase()
                : null;

            let accountPattern = testData.account;

            let scenarioName = accountPattern ? JSON.stringify(accountPattern) : scenario;

            const testGroups = this.getFilteredTestGroups(this.scriptTags, testData.tags);

            loggerManagerArgs = await this.logger.loggerManager.startTest(argv.runId, testUid, iteration - 1, {
                testGroups,
                testMethod: testMethod,
                testClass: testClassName,
                testOriginalId: testId,
                scenario: scenarioName,
                testId: testLinkId,
                arguments: [JSON.stringify(testData.input)]
            });

            // set manager args for logger
            this.logger.loggerManagerArgs = loggerManagerArgs;

            let account = null;
            let startTime = new Date();

            let input = testData.input;
            let expected = testData.expected;

            let PNS = await this.getPNS();
            let JEDI = await this.getJEDI();
            let PAS = await this.getPAS();

            if (accountPattern) {
                let TCS = await this.getTCS();

                let accountManager = await this.getAC({JEDI, TCS, PNS});
                account = await accountManager.createAccount(accountPattern);
            } else {
                let accountManager = await this.getAGS({config});
                if (argv.useAccount) {
                    account = await accountManager.getExistingAccounts(argv.useAccount);
                } else if (scenario) {
                    account = await accountManager.getAccounts(scenario, 1, !!testData.releaseAsClean);
                }

                if (account) {
                    if (testData.updateScenario) {
                        let json = [];
                        for (let updateScenario of testData.updateScenario) {
                            json.push({
                                scenario: updateScenario.name,
                                count: updateScenario.amount,
                                accountId: account.userId
                            });
                        }
                        await accountManager.updateAccount(json);
                    }

                    await JEDI.login(account);
                    account.setJEDI(JEDI);
                    account.setPNS(PNS);
                    account.setPAS(PAS);
                }
            }

            if (account) {
                await this.logger.loggerManager.setAccountsToTest(argv.runId, loggerManagerArgs, scenarioName, account);

                await this.logger.step(`Account was generated. DURATION: ${Date.now() - startTime.getTime()} ms`);
                await this.logger.info('account.mainPhoneNumber="' + account.mainPhoneNumber + '"');
            }


            await this.logger.info('Account scenario: ' + scenarioName);

            await this.logger.info('testdata input ' + JSON.stringify(testData.input));
            await this.logger.info('testdata expected ' + JSON.stringify(testData.expected));

            if (!testData.doNotSwitchToEnUS) {
                if (account) {
                    await account.switchToEnUS();
                }
            }
            if (testData.doNotSwitchToEnUS === 'en_GB') {
                if (account) {
                    await account.switchToEnGB();
                }
            }
            if (account) {
                account.doNotSwitchToEnUS = !!testData.doNotSwitchToEnUS;
            }

            BaseManager.forceScreenshots = iteration > 1 || argv.screenshots;

            if (BaseManager.forceScreenshots) {
                if (argv.screenshots) {
                    await this.logger.info('Screenshots have been forced ON because of passed argument.');
                } else {
                    await this.logger.info('Screenshots have been forced ON because the previous run failed.');
                }
            } else {
                await this.logger.info('Screenshots have been skipped for this run.');
            }

            if (IS_DEBUG_MODE) {
                try {
                    await debugManager.runQueue(this, fns, [account, input, expected]);
                } catch (e) {
                    throw (e instanceof Error ? e : new Error(e));
                }
            } else {
                const [initFn, ...restFns] = fns;
                const testHasPrecondition = !_.isEmpty(restFns);

                const runInitFn = async () => {
                    try {
                        await initFn.call(this, account, input, expected);
                    } catch (e) {
                        console.log('Ex: ', e);
                        let initError = e instanceof Error ? e : new Error(e);
                        if (testHasPrecondition) {
                            initError.isAccountGeneration = true;
                        }
                        throw initError;
                    }
                };

                if (testHasPrecondition) {
                    await runInitFn();
                } else {
                    if (argv.preconditionsOnly) {
                        await this.logger.error('Selected test does not contain preconditions');
                    } else {
                        await runInitFn();
                    }
                }

                if (argv.preconditionsOnly) {
                    const accountInfo = _.pick(account, [
                        'userId',
                        'brandId',
                        'tierId',
                        'phoneNumber',
                        'mainPhoneNumber',
                        'password',
                        'mailboxes'
                    ]);
                    await this.logger.info('Accout info after executing preconditions is: \n', accountInfo);

                    if (argv.sendAccountInfoTo) {
                        this.postAccountInfoData(accountInfo);
                    }

                    fs.writeFileSync(path.resolve(rootFolder, 'accountInfo.json'), JSON.stringify(accountInfo, null, 4));
                    await this.logger.info('End account info');
                } else {
                    for (let fn of restFns) {
                        try {
                            await fn.call(this, account, input, expected);
                        } catch (e) {
                            console.log('Ex: ', e);
                            throw e instanceof Error ? e : new Error(e);
                        }
                    }
                }
            }

            this.logger.loggerManagerArgs = null; // This line added due RLZ-28078

            if (this.hasSoftErrors) {
                testStatus = LOGGER_TEST_STATUS_WARNING;
                throw new SoftError();
            }

            await this.logger.custom({registerStep: false}, `run #${index} - ok`);
        } catch (e) {
            await this.logger.custom({registerStep: false}, `run #${index} - fail`);

            let msg = e ? e.message : 'Exception is NULL';

            if (_.isFunction(process.send)) {
                let message = {testLinkId, msg: 'Exception is NULL'};

                try {
                    message = JSON.parse(JSON.stringify({testLinkId, msg}));
                } catch (ignoreError) {
                    await this.logger.custom({registerStep: false, type: 'error'}, 'Message is unparsable');
                    await this.logger.custom({registerStep: false, type: 'error'}, msg);
                }

                process.send(message);
            }

            if (!IS_DEBUG_MODE) {
                e && await this.logger.custom({registerStep: false, type: 'debug'}, e.stack);
                await this.logger.custom({registerStep: false, type: 'error'}, msg);
            }

            let isAccountGeneration = (
                e.isAccountGeneration ||
                msg.indexOf('AGS job failed') !== -1 ||
                msg.indexOf('AGS request error') !== -1 ||
                msg.indexOf('Account creation failed') !== -1
            );
            if (isAccountGeneration) {
                testStatus = LOGGER_TEST_STATUS_MISSACCOUNT;
            } else {
                testStatus = LOGGER_TEST_STATUS_FAIL;
                await this.saveScreenshots();
            }

            if (argv.sendAccountInfoTo) {
                this.postAccountInfoData(false, msg);
            }

            const allMessages = this.softErrorMessages;
            if (!(e instanceof SoftError)) {
                allMessages.push(msg);
            }
            testError = allMessages.join('\n');
        }

        try {
            let failed = testStatus !== LOGGER_TEST_STATUS_PASS || argv.preconditionsOnly;

            await this.logger.loggerManager.stopTest(argv.runId, loggerManagerArgs, testStatus, testError);
            this.logger.loggerManagerArgs = null;
            await this.freeAllManagers(failed);

            // RLZ-28078
            // await this.freeAllManagers(failed, [this.logger.loggerManager]);
            //
            // for (let log of this._managerFinalLogs) {
            //     await this.logger.custom({name: log.name, level: 0}, log.message);
            //     if (log.messages && log.messages.length) {
            //         for (let message of log.messages) {
            //             await this.logger.custom({name: log.name, level: 1}, message);
            //         }
            //     }
            // }
            // this._managerFinalLogs = [];
            //
            // await this.logger.loggerManager.stopTest(argv.runId, loggerManagerArgs, testStatus, testError);
            // await this.freeManager(this.logger.loggerManager, failed);
            // this.logger.loggerManagerArgs = null;
        } catch (error) {
            console.error(error, '(In the end of the method TestManager.runTest)');
        }

        return testStatus === LOGGER_TEST_STATUS_PASS;
    }

    /**
     * @private
     */
    async saveScreenshots() {
        if (!argv.reportDir) {
            return;
        }

        try {
            await Promise.all(
                this._managers
                    .map((manager) => {
                        if (manager.makeScreenshot) {
                            return manager.makeScreenshot();
                        }
                    })
            );
        } catch (error) {
            await this.logger.error(error);
        }
    }

    /**
     * @return {string[]}
     * @private
     */
    get softErrorMessages() {
        let messages = Object.create(null);
        this._managers.forEach(({errorMessages}) => {
            errorMessages.forEach(errorMessage => {
                if (messages[errorMessage]) {
                    messages[errorMessage] += 1;
                } else {
                    messages[errorMessage] = 1;
                }
            });
        });

        return Object.keys(messages).map(message => {
            return messages[message] > 1 ? `${message}: ${messages[message]} times` : message;
        });
    }

    /**
     * @return {boolean}
     * @private
     */
    get hasSoftErrors() {
        return this._managers.some(manager => manager.hasSoftErrors);
    }

    /**
     * @param {string} source
     * @param {string} target
     * @param {function} cb
     * @private
     */
    copyFile(source, target, cb) {
        let cbCalled = false;

        const rd = fs.createReadStream(source);
        rd.on('error', (err) => {
            done(err);
        });
        const wr = fs.createWriteStream(target);
        wr.on('error', (err) => {
            done(err);
        });
        wr.on('close', () => {
            done();
        });
        rd.pipe(wr);

        function done(err) {
            if (!cbCalled) {
                cb(err);
                cbCalled = true;
            }
        }
    }

    /**
     * @param {string[]} scriptTags
     * @param {string[]} currentTags
     * @return {string[]}
     * @private
     */
    getFilteredTestGroups(scriptTags, currentTags) {
        if (!scriptTags) {
            return [];
        }
        const filteredScriptTags = scriptTags.filter(tag => tag.indexOf('#') === 0);
        return _.uniq(filteredScriptTags.concat(currentTags || []));
    }

    /**
     * @param {Object} accountInfo
     * @param {string} errorMessage
     * @private
     */
    postAccountInfoData(accountInfo, errorMessage) {
        request({
            url: argv.sendAccountInfoTo,
            method: 'POST',
            json: true,
            body: {
                success: !!accountInfo,
                errorMessage: errorMessage || null,
                account: accountInfo || {}
            }
        }, (error) => {
            if (error) {
                return console.error('problem with account sending request:', error);
            }
            console.log('Upload successful!');
        });
    }
}

/**
 * @name TestManager#getAW
 * @function
 * @memberOf TestManager
 * @param {Object} options
 * @return {Promise<AdminWebManager>}
 */

/**
 * @name TestManager#getSW
 * @function
 * @memberOf TestManager
 * @param {Object} options
 * @return {Promise<ServiceWebManager>}
 */

/**
 * @name TestManager#getMW
 * @function
 * @memberOf TestManager
 * @param {Object} options
 * @return {Promise<MobileWebManager>}
 */

/**
 * @name TestManager#getICA
 * @function
 * @memberOf TestManager
 * @param {Object} options
 * @return {Promise<ServiceWebManager>}
 */

/**
 * @name TestManager#getMailManager
 * @function
 * @memberOf TestManager
 * @param {Object} options
 * @return {Promise<MailManager>}
 */

/**
 * @name TestManager#getTCS
 * @function
 * @memberOf TestManager
 * @param {Object} options
 * @return {Promise<TCSManager>}
 */

/**
 * @name TestManager#getAGS
 * @function
 * @memberOf TestManager
 * @param {Object} options
 * @return {Promise<AccountManager>}
 */

/**
 * @name TestManager#getAC
 * @function
 * @memberOf TestManager
 * @param {Object} options
 * @return {Promise<AccountCreationManager>}
 */

/**
 * @name TestManager#getPNS
 * @function
 * @memberOf TestManager
 * @param {Object} options
 * @return {Promise<PNSManager>}
 */

/**
 * @name TestManager#getJEDI
 * @function
 * @memberOf TestManager
 * @param {Object} options
 * @return {Promise<JEDIManager>}
 */

/**
 * @name TestManager#getLogger
 * @function
 * @memberOf TestManager
 * @param {Object} options
 * @return {Promise<LoggerManager>}
 */

/**
 * @name TestManager#getDebug
 * @function
 * @memberOf TestManager
 * @param {Object} options
 * @return {Promise<DebugManager>}
 */


let testManager = new TestManager({
    config
});

function checkTagsRules(tags = []) {
    const violations = [];
    violateRuleCheckers.forEach(checker => {
        if (checker(tags)) {
            violations.push(checker.describe);
        }
    });

    return violations;
}

export default ::testManager.run;

process.on('exit', code => {
    console.log('Caught process exit event');
    if (!IS_DEBUG_MODE) { // preventing node-debug crash
        console.log('Debug mode is off, exiting process');
        process.exit(code || exitCode);
    }
});

// Do not handle any exception inside this construction.
process.on('uncaughtException', (err) => {
    if (IS_DEBUG_MODE) {
        console.log(err);
    } else {
        console.log(`Caught exception: ${err}`);
    }

    // Do not remove next line - it will help to avoid browsers closing after any test failure in debug mode
    debugger;
});

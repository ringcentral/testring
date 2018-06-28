import { loggerClient } from '@testring/logger';

// const nanoid = require('nanoid');

// const DEFAULT_DIRECTORY_SETTING = 'WEBDRIVER.desiredCapabilities.chromeOptions.prefs.download.default_directory';

export class TestManager {

    async logBusiness(message: string) {
        // loggerClient.step(message);
    }

    async logError(message) {
        loggerClient.error(message);
    }

    async logWarning(...message: Array<any>) {
        loggerClient.warn(message);
    }

    // async getManager(name, options = {}) {
    //     let manager = watConfig.managers[name];
    //
    //     if (!manager) {
    //         throw new Error('Unknown manager ' + name);
    //     }
    //
    //     const defaultOptions = {
    //         runId: argv.runId
    //     };
    //
    //     const fullOptions = {
    //         ...defaultOptions,
    //         ...config[name],
    //         ...options
    //     };
    //
    //     if (!argv.useApplicationName) {
    //         delete fullOptions.applicationName;
    //     }
    //
    //     let MngrConstructor;
    //     if (_.isFunction(manager)) {
    //         MngrConstructor = manager;
    //     } else {
    //         MngrConstructor = manager.ctor;
    //     }
    //
    //     if (argv.webHost) {
    //         config.WEB.host = argv.webHost;
    //     }
    //     let instance = new MngrConstructor(_.merge({}, fullOptions));
    //     instance.config = _.merge({}, config);
    //
    //     if (name !== 'Logger' && instance.logger) {
    //         instance.logger.loggerManager = loggerClient.mgr;
    //         instance.logger.loggerManagerArgs = loggerClient.mgrArgs;
    //         instance.logger._reportDir = argv.reportDir;
    //     }
    //
    //     if (fullOptions.requireBrowser) {
    //         await this.injectClientIntoManager(instance, fullOptions, config);
    //     }
    //
    //     await instance.init();
    //
    //     // RLZ-28078
    //     // if (instance.onDispose && instance.getFinalLog) {
    //     //     instance.onDispose(async () => {
    //     //         let log = await instance.getFinalLog();
    //     //         if (log) {
    //     //             this._managerFinalLogs.push(log);
    //     //         }
    //     //     });
    //     // }
    //
    //     this._managers.push(instance);
    //     return instance;
    // }

    // async freeAllManagers(failed = false, except = []) {
    //     if (this._managers.length) {
    //         await loggerClient.custom({registerStep: false, type: 'debug'}, 'Freeing all allocated managers');
    //         let managers = this._managers.filter(manager => !except.includes(manager));
    //         for (let manager of managers) {
    //             await this.freeManager(manager, failed);
    //         }
    //     }
    //     await loggerClient.custom({registerStep: false, type: 'debug'}, 'Managers released.');
    // }

    // async freeManager(instance, failed = false) {
    //     if (_.isFunction(instance.dispose)) {
    //         try {
    //             await instance.dispose(failed);
    //         } catch (error) {
    //             await loggerClient.custom({registerStep: false, type: 'debug'}, error.message || String(error));
    //         }
    //     }
    //     _.remove(this._managers, instance);
    // }

    // getCapabilities() {
    //     // TODO make array work
    //     if (config.WEBDRIVER && _.has(config.WEBDRIVER, 'capabilities')) {
    //         return config.WEBDRIVER.capabilities;
    //     }
    //
    //     if (config.WEBDRIVER && _.has(config.WEBDRIVER, 'desiredCapabilities')) {
    //         return config.WEBDRIVER.desiredCapabilities;
    //     }
    //
    //     return null;
    // }

    /**
     * @return {string[]}
     * @private
     */
    // getChromeDriverArgs() {
    //     const chromeDriver = require('chromedriver');
    //
    //     return [`-Dwebdriver.chrome.driver=${chromeDriver.path}`];
    // }

    /**
     * @return {string[]}
     * @private
     */
    // getFirefoxDriverArgs() {
    //     let args = ['-browser', 'browserName=firefox'];
    //     let capabilities = this.getCapabilities();
    //
    //     if (capabilities && capabilities.driver) {
    //         args.push(`-Dwebdriver.firefox.bin=${capabilities.driver}`);
    //     }
    //
    //     return args;
    // }

    /**
     * @param {function[]} fns
     * @return {Promise<boolean|void>}
     */
    async run(...fns) {

        // let testData = testJson[TEST_DATA_KEY];
        // this.avoidSingleBrowser = Boolean(testJson.avoidSingleBrowser);
        // testData.forEach((test, index) => test.dataIndex = index);
        // const total = testData.length;
        // let commonScenarios = testJson[SCENARIOS_KEY] || [];
        // let expectedData = testJson[EXPECTED_KEY] || null;
        // let inputData = testJson[INPUT_KEY] || null;
        // this.scriptTags = testJson[TAGS];
        // const violations = checkTagsRules(testJson[TAGS]);
        // violations.forEach(x => loggerClient.warn(x));
        // if (expectedData != null || inputData != null || commonScenarios.length) {
        //     for (let dataTest of testData) {
        //         if (commonScenarios.length && dataTest.account) {
        //             dataTest.account.scenarios = [...commonScenarios, ...(dataTest.account.scenarios || [])];
        //         }
        //         if (expectedData != null) {
        //             dataTest.expected = {...expectedData, ...dataTest.expected};
        //         }
        //         if (inputData != null) {
        //             dataTest.input = {...inputData, ...dataTest.input};
        //         }
        //     }
        // }
        // let actualTestData = testData.filter(item => !item.skip);
        // if (argv.index) {
        //     let n = Number(argv.index) || 0;
        //     if (n > total - 1) {
        //         throw Error('Can not select testdata item with index ' + n + ' from array of ' + total + ' items');
        //     }
        //     actualTestData = [testData[n]];
        // }
        //
        // let successCount = 0;
        // let failCount = 0;
        // let testCount = 0;
        //
        // if (!actualTestData || actualTestData.length === 0) {
        //     await loggerClient.error('test data is not specified');
        // }
        //
        // loggerClient.loggerManager = await this.getLogger();
        //
        // let testClassName;
        // const parsedPath = path.parse(require.main.filename);
        // const dirs = (path.relative(rootFolder, parsedPath.dir)).split(path.sep);
        // testClassName = dirs.slice(dirs.indexOf(TESTS_FOLDER) + 1).join('.');
        //
        // let testId = testClassName + '.' + parsedPath.name;
        //
        // let testLinkId = '';
        // for (let q in testJson.tags) {
        //     if (testJson.tags[q].indexOf('#') === -1) {
        //         testLinkId = testJson.tags[q];
        //         break;
        //     }
        // }
        //
        // for (let testData of actualTestData) {
        //     let params = {testId, testLinkId, testClassName, total};
        //
        //     testCount++;
        //
        //     let isPassed = await this.runTest(argv.iteration || 1, fns, testData, params);
        //
        //     if (isPassed) {
        //         successCount++;
        //     } else {
        //         failCount++;
        //     }
        // }
        //
        // let skippedCount = total - actualTestData.length;
        // if (skippedCount) {
        //     await loggerClient.warn('skipped tests count: ' + skippedCount);
        // }
        //
        // let finalMsg = 'DONE: ' + successCount + '/' + total;
        //
        // if (this.browserClient) {
        //     try {
        //         await this.browserClient.end();
        //         this.browserClient = null;
        //     } catch (ignoreError) {
        //     }
        // }
        //
        // if (this.localSelenium) {
        //     try {
        //         this.localSelenium.stop();
        //         this.localSelenium = null;
        //     } catch (ignoreError) {
        //     }
        // }
        //
        // failCount
        //     ? await loggerClient.error(finalMsg)
        //     : await loggerClient.info(finalMsg);
        //
        // exitCode = failCount ? 1 : 0;
        //
        // // https://github.com/babel/babel/issues/4554
        // // process.send is not a function in child spawned with babel-node
        // if (_.isFunction(process.send)) {
        //     process.send({count: testCount});
        // }
        //
        // stopAll();
    }


    // async runTest(iteration, fns, testData, {testId, testLinkId, testClassName, total}) {
    //     let index = testData.dataIndex + 1;
    //
    //     let testStatus = LOGGER_TEST_STATUS_PASS;
    //     let testError = null;
    //     let loggerManagerArgs = {};
    //
    //     try {
    //         let testMethod = `${path.basename(require.main.filename, '.js')} - #${index} of ${total}`;
    //
    //         let testUid = argv.uuid || uuidv4();
    //
    //         await loggerClient.info('run #' + index + ' started');
    //
    //         let scenario = testData.scenario
    //             ? Array.isArray(testData.scenario)
    //                 ? testData.scenario
    //                 : testData.scenario.trim().toLowerCase()
    //             : null;
    //
    //         let accountPattern = testData.account;
    //
    //         let scenarioName = accountPattern ? JSON.stringify(accountPattern) : scenario;
    //
    //         const testGroups = this.getFilteredTestGroups(this.scriptTags, testData.tags);
    //
    //         loggerManagerArgs = await loggerClient.loggerManager.startTest(argv.runId, testUid, iteration - 1, {
    //             testGroups,
    //             testMethod: testMethod,
    //             testClass: testClassName,
    //             testOriginalId: testId,
    //             scenario: scenarioName,
    //             testId: testLinkId,
    //             arguments: [JSON.stringify(testData.input)]
    //         });
    //
    //         // set manager args for logger
    //         loggerClient.loggerManagerArgs = loggerManagerArgs;
    //
    //         let account = null;
    //         let startTime = new Date();
    //
    //         let input = testData.input;
    //         let expected = testData.expected;
    //
    //         let PNS = await this.getPNS();
    //         let JEDI = await this.getJEDI();
    //         let PAS = await this.getPAS();
    //
    //         if (accountPattern) {
    //             let TCS = await this.getTCS();
    //
    //             let accountManager = await this.getAC({JEDI, TCS, PNS});
    //             account = await accountManager.createAccount(accountPattern);
    //         } else {
    //             let accountManager = await this.getAGS({config});
    //             if (argv.useAccount) {
    //                 account = await accountManager.getExistingAccounts(argv.useAccount);
    //             } else if (scenario) {
    //                 account = await accountManager.getAccounts(scenario, 1, !!testData.releaseAsClean);
    //             }
    //
    //             if (account) {
    //                 if (testData.updateScenario) {
    //                     let json = [];
    //                     for (let updateScenario of testData.updateScenario) {
    //                         json.push({
    //                             scenario: updateScenario.name,
    //                             count: updateScenario.amount,
    //                             accountId: account.userId
    //                         });
    //                     }
    //                     await accountManager.updateAccount(json);
    //                 }
    //
    //                 await JEDI.login(account);
    //                 account.setJEDI(JEDI);
    //                 account.setPNS(PNS);
    //                 account.setPAS(PAS);
    //             }
    //         }
    //
    //         if (account) {
    //             await loggerClient.loggerManager.setAccountsToTest(argv.runId, loggerManagerArgs, scenarioName, account);
    //
    //             await loggerClient.step(`Account was generated. DURATION: ${Date.now() - startTime.getTime()} ms`);
    //             await loggerClient.info('account.mainPhoneNumber="' + account.mainPhoneNumber + '"');
    //         }
    //
    //
    //         await loggerClient.info('Account scenario: ' + scenarioName);
    //
    //         await loggerClient.info('testdata input ' + JSON.stringify(testData.input));
    //         await loggerClient.info('testdata expected ' + JSON.stringify(testData.expected));
    //
    //         if (!testData.doNotSwitchToEnUS) {
    //             if (account) {
    //                 await account.switchToEnUS();
    //             }
    //         }
    //         if (testData.doNotSwitchToEnUS === 'en_GB') {
    //             if (account) {
    //                 await account.switchToEnGB();
    //             }
    //         }
    //         if (account) {
    //             account.doNotSwitchToEnUS = !!testData.doNotSwitchToEnUS;
    //         }
    //
    //         BaseManager.forceScreenshots = iteration > 1 || argv.screenshots;
    //
    //         if (BaseManager.forceScreenshots) {
    //             if (argv.screenshots) {
    //                 await loggerClient.info('Screenshots have been forced ON because of passed argument.');
    //             } else {
    //                 await loggerClient.info('Screenshots have been forced ON because the previous run failed.');
    //             }
    //         } else {
    //             await loggerClient.info('Screenshots have been skipped for this run.');
    //         }
    //
    //         if (IS_DEBUG_MODE) {
    //             try {
    //                 await debugManager.runQueue(this, fns, [account, input, expected]);
    //             } catch (e) {
    //                 throw (e instanceof Error ? e : new Error(e));
    //             }
    //         } else {
    //             const [initFn, ...restFns] = fns;
    //             const testHasPrecondition = !_.isEmpty(restFns);
    //
    //             const runInitFn = async () => {
    //                 try {
    //                     await initFn.call(this, account, input, expected);
    //                 } catch (e) {
    //                     console.log('Ex: ', e);
    //                     let initError = e instanceof Error ? e : new Error(e);
    //                     if (testHasPrecondition) {
    //                         initError.isAccountGeneration = true;
    //                     }
    //                     throw initError;
    //                 }
    //             };
    //
    //             if (testHasPrecondition) {
    //                 await runInitFn();
    //             } else {
    //                 if (argv.preconditionsOnly) {
    //                     await loggerClient.error('Selected test does not contain preconditions');
    //                 } else {
    //                     await runInitFn();
    //                 }
    //             }
    //
    //             if (argv.preconditionsOnly) {
    //                 const accountInfo = _.pick(account, [
    //                     'userId',
    //                     'brandId',
    //                     'tierId',
    //                     'phoneNumber',
    //                     'mainPhoneNumber',
    //                     'password',
    //                     'mailboxes'
    //                 ]);
    //                 await loggerClient.info('Accout info after executing preconditions is: \n', accountInfo);
    //
    //                 if (argv.sendAccountInfoTo) {
    //                     this.postAccountInfoData(accountInfo);
    //                 }
    //
    //                 fs.writeFileSync(path.resolve(rootFolder, 'accountInfo.json'), JSON.stringify(accountInfo, null, 4));
    //                 await loggerClient.info('End account info');
    //             } else {
    //                 for (let fn of restFns) {
    //                     try {
    //                         await fn.call(this, account, input, expected);
    //                     } catch (e) {
    //                         console.log('Ex: ', e);
    //                         throw e instanceof Error ? e : new Error(e);
    //                     }
    //                 }
    //             }
    //         }
    //
    //         loggerClient.loggerManagerArgs = null; // This line added due RLZ-28078
    //
    //         if (this.hasSoftErrors) {
    //             testStatus = LOGGER_TEST_STATUS_WARNING;
    //             throw new SoftError();
    //         }
    //
    //         await loggerClient.custom({registerStep: false}, `run #${index} - ok`);
    //     } catch (e) {
    //         await loggerClient.custom({registerStep: false}, `run #${index} - fail`);
    //
    //         let msg = e ? e.message : 'Exception is NULL';
    //
    //         if (_.isFunction(process.send)) {
    //             let message = {testLinkId, msg: 'Exception is NULL'};
    //
    //             try {
    //                 message = JSON.parse(JSON.stringify({testLinkId, msg}));
    //             } catch (ignoreError) {
    //                 await loggerClient.custom({registerStep: false, type: 'error'}, 'Message is unparsable');
    //                 await loggerClient.custom({registerStep: false, type: 'error'}, msg);
    //             }
    //
    //             process.send(message);
    //         }
    //
    //         if (!IS_DEBUG_MODE) {
    //             e && await loggerClient.custom({registerStep: false, type: 'debug'}, e.stack);
    //             await loggerClient.custom({registerStep: false, type: 'error'}, msg);
    //         }
    //
    //         let isAccountGeneration = (
    //             e.isAccountGeneration ||
    //             msg.indexOf('AGS job failed') !== -1 ||
    //             msg.indexOf('AGS request error') !== -1 ||
    //             msg.indexOf('Account creation failed') !== -1
    //         );
    //         if (isAccountGeneration) {
    //             testStatus = LOGGER_TEST_STATUS_MISSACCOUNT;
    //         } else {
    //             testStatus = LOGGER_TEST_STATUS_FAIL;
    //             await this.saveScreenshots();
    //         }
    //
    //         if (argv.sendAccountInfoTo) {
    //             this.postAccountInfoData(false, msg);
    //         }
    //
    //         const allMessages = this.softErrorMessages;
    //         if (!(e instanceof SoftError)) {
    //             allMessages.push(msg);
    //         }
    //         testError = allMessages.join('\n');
    //     }
    //
    //     try {
    //         let failed = testStatus !== LOGGER_TEST_STATUS_PASS || argv.preconditionsOnly;
    //
    //         await loggerClient.loggerManager.stopTest(argv.runId, loggerManagerArgs, testStatus, testError);
    //         loggerClient.loggerManagerArgs = null;
    //         await this.freeAllManagers(failed);
    //
    //         // RLZ-28078
    //         // await this.freeAllManagers(failed, [loggerClient.loggerManager]);
    //         //
    //         // for (let log of this._managerFinalLogs) {
    //         //     await loggerClient.custom({name: log.name, level: 0}, log.message);
    //         //     if (log.messages && log.messages.length) {
    //         //         for (let message of log.messages) {
    //         //             await loggerClient.custom({name: log.name, level: 1}, message);
    //         //         }
    //         //     }
    //         // }
    //         // this._managerFinalLogs = [];
    //         //
    //         // await loggerClient.loggerManager.stopTest(argv.runId, loggerManagerArgs, testStatus, testError);
    //         // await this.freeManager(loggerClient.loggerManager, failed);
    //         // loggerClient.loggerManagerArgs = null;
    //     } catch (error) {
    //         console.error(error, '(In the end of the method TestManager.runTest)');
    //     }
    //
    //     return testStatus === LOGGER_TEST_STATUS_PASS;
    // }

    // private async saveScreenshots() {
    //     if (!argv.reportDir) {
    //         return;
    //     }
    //
    //     try {
    //         await Promise.all(
    //             this._managers
    //                 .map((manager) => {
    //                     if (manager.makeScreenshot) {
    //                         return manager.makeScreenshot();
    //                     }
    //                 })
    //         );
    //     } catch (error) {
    //         await loggerClient.error(error);
    //     }
    // }

    // private get softErrorMessages() {
    //     let messages = Object.create(null);
    //     this._managers.forEach(({errorMessages}) => {
    //         errorMessages.forEach(errorMessage => {
    //             if (messages[errorMessage]) {
    //                 messages[errorMessage] += 1;
    //             } else {
    //                 messages[errorMessage] = 1;
    //             }
    //         });
    //     });
    //
    //     return Object.keys(messages).map(message => {
    //         return messages[message] > 1 ? `${message}: ${messages[message]} times` : message;
    //     });
    // }

    // private get hasSoftErrors() {
    //     return this._managers.some(manager => manager.hasSoftErrors);
    // }

    /**
     * @param {string} source
     * @param {string} target
     * @param {function} cb
     * @private
     */
    // private copyFile(source, target, cb) {
    //     let cbCalled = false;
    //
    //     const rd = fs.createReadStream(source);
    //     rd.on('error', (err) => {
    //         done(err);
    //     });
    //     const wr = fs.createWriteStream(target);
    //     wr.on('error', (err) => {
    //         done(err);
    //     });
    //     wr.on('close', () => {
    //         done();
    //     });
    //     rd.pipe(wr);
    //
    //     function done(err) {
    //         if (!cbCalled) {
    //             cb(err);
    //             cbCalled = true;
    //         }
    //     }
    // }

    /**
     * @param {string[]} scriptTags
     * @param {string[]} currentTags
     * @return {string[]}
     * @private
     */
    // private getFilteredTestGroups(scriptTags, currentTags) {
    //     if (!scriptTags) {
    //         return [];
    //     }
    //     const filteredScriptTags = scriptTags.filter(tag => tag.indexOf('#') === 0);
    //     return _.uniq(filteredScriptTags.concat(currentTags || []));
    // }

    /**
     * @param {Object} accountInfo
     * @param {string} errorMessage
     */
    // private postAccountInfoData(accountInfo, errorMessage) {
    //     request({
    //         url: argv.sendAccountInfoTo,
    //         method: 'POST',
    //         json: true,
    //         body: {
    //             success: !!accountInfo,
    //             errorMessage: errorMessage || null,
    //             account: accountInfo || {}
    //         }
    //     }, (error) => {
    //         if (error) {
    //             return console.error('problem with account sending request:', error);
    //         }
    //         console.log('Upload successful!');
    //     });
    // }
}

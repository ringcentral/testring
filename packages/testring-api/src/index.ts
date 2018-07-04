import { EventEmitter } from 'events';
import { TestEvents } from '@testring/types';

export { WebApplication } from '@testring/web-application';

const bus = new EventEmitter();

const run = async (...tests: Array<Function>) => {

    bus.emit(TestEvents.started);

    try {
        for (let test of tests) {
            await test();
        }

        bus.emit(TestEvents.finished);
    } catch (e) {
        bus.emit(TestEvents.failed);
    }


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
};

export { run, bus };

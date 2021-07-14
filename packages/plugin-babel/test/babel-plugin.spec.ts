/// <reference types="mocha" />

import * as chai from 'chai';
import { default as babelPlugin } from '../src';
import { PluginAPIMock } from './plugin-api.mock';

const DEFAULT_FILENAME = 'filename.js';
const DEFAULT_INPUT = `
() => {
  console.log(1);
};`.trim();
const TRANSFORMED_INPUT = `
"use strict";

() => {
  console.log(1);
};`.trim();

describe('babelPlugin', () => {
    it('should not convert code, if there is no config', async () => {
        const pluginAPIMock = new PluginAPIMock();

        babelPlugin(pluginAPIMock as any, null);

        const testWorkerMock = pluginAPIMock.$getLastTestWorker();
        const result = await testWorkerMock.$compile(DEFAULT_INPUT, DEFAULT_FILENAME);

        chai.expect(result).to.be.equal(TRANSFORMED_INPUT);
    });

    it('should convert code with given preset', async () => {
        const pluginAPIMock = new PluginAPIMock();

        babelPlugin(pluginAPIMock as any, {
        });

        const testWorkerMock = pluginAPIMock.$getLastTestWorker();
        const result = await testWorkerMock.$compile(DEFAULT_INPUT, DEFAULT_FILENAME);

        chai.expect(result).to.be.equal(TRANSFORMED_INPUT);
    });
});

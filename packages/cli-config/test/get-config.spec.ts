/// <reference types="mocha" />

import * as chai from 'chai';
import * as path from 'path';

import { getConfig, defaultConfiguration } from '../src';

const fileConfigPath = path.resolve(__dirname, './fixtures/fileConfig.json');
const envConfigPath = path.resolve(__dirname, './fixtures/envConfig.json');
const envConfigWithExtendPath = path.resolve(__dirname, './fixtures/envConfig_extend.json');

const fileConfig = require('./fixtures/fileConfig.json');
const envConfig = require('./fixtures/envConfig.json');

describe('Get config', () => {
    it('should return default configuration if nothing else passed', async () => {
        const config = await getConfig();

        chai.expect(config).to.be.deep.equal(defaultConfiguration);
    });

    it('should override default config fields with file config', async () => {
        const config = await getConfig([
            `--config=${fileConfigPath}`,
        ]);

        chai.expect(config).to.have.property('workerLimit', fileConfig.workerLimit);
    });

    it('should override default and file config fields with file config', async () => {
        const config = await getConfig([
            `--config=${fileConfigPath}`,
            `--env-config=${envConfigPath}`,
        ]);

        chai.expect(config).to.have.property('workerLimit', fileConfig.workerLimit);
    });

    it('should override config fields with env config', async () => {
        const config = await getConfig([
            `--env-config=${envConfigPath}`,
        ]);

        chai.expect(config).to.have.property('workerLimit', envConfig.workerLimit);
    });

    it('should override file config fields with arguments', async () => {
        const override = 'argumentsConfig';

        const config = await getConfig([
            `--env-config=${envConfigPath}`,
            `--worker-limit=${override}`,
        ]);

        chai.expect(config).to.have.property('workerLimit', override);
    });

    it('should override every resolved config fields with arguments', async () => {
        const override = 'argumentsConfig';

        const config = await getConfig([
            `--config=${fileConfigPath}`,
            `--env-config=${envConfigPath}`,
            `--worker-limit=${override}`,
        ]);

        chai.expect(config).to.have.property('workerLimit', override);
    });

    it('should override config fields with env config with @extend', async () => {
        const config = await getConfig([
            `--env-config=${envConfigWithExtendPath}`,
        ]);

        chai.expect(config).to.have.property('workerLimit', envConfig.workerLimit);
    });

    it('should override default and file config fields with file config and ignore @extend', async () => {
        const config = await getConfig([
            `--config=${fileConfigPath}`,
            `--env-config=${envConfigPath}`,
        ]);

        chai.expect(config).to.have.property('workerLimit', fileConfig.workerLimit);
    });

    it('should override file config fields with @extend and arguments', async () => {
        const override = 'argumentsConfig';

        const config = await getConfig([
            `--env-config=${envConfigWithExtendPath}`,
            `--worker-limit=${override}`,
        ]);

        chai.expect(config).to.have.property('workerLimit', override);
    });

    it('should override every resolved config fields with @extend and arguments', async () => {
        const override = 'argumentsConfig';

        const config = await getConfig([
            `--config=${fileConfigPath}`,
            `--env-config=${envConfigWithExtendPath}`,
            `--worker-limit=${override}`,
        ]);

        chai.expect(config).to.have.property('workerLimit', override);
    });
});

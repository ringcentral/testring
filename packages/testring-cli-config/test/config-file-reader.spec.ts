/// <reference types="node" />
/// <reference types="mocha" />

import * as path from 'path';
import * as chai from 'chai';
import { getFileConfig } from '../src/config-file-reader';

describe('config-file-reader', () => {

    it('should load config as promise from .js', async () => {
        const filePath = path.join(__dirname, './fixtures/testringrc.js');
        const config = await getFileConfig({
            config: filePath
        } as any);

        chai.expect(config).to.be.deep.equal({
            debug: true
        });
    });

    it('should load config as object from .js', async () => {
        const filePath = path.join(__dirname, './fixtures/testringrc_obj.js');
        const config = await getFileConfig({
            config: filePath
        } as any);

        chai.expect(config).to.be.deep.equal({
            debug: true
        });
    });

    it('should load config as object from the file with unsupported extension', (callback) => {
        const filePath = path.join(__dirname, './fixtures/testring_invalid.ts');

        getFileConfig({
            config: filePath
        } as any)
            .then((config) => {
                callback(`
                    Config has been parsed, content:
                    ${config}
                `);
            })
            .catch((exception) => {
                chai.expect(exception).to.be.an.instanceof(Error);
                callback();
            });

    });

    it('should find config', async () => {
        const filePath = path.join(__dirname, './fixtures/testring.json');
        const config = await getFileConfig({
            config: filePath
        } as any);

        chai.expect(config).to.be.deep.equal({
            debug: true
        });
    });

    it('should return null if there is no such config', async () => {
        const filePath = path.join(__dirname, './fixtures/nonexistent-config.json');
        const config = await getFileConfig({
            config: filePath
        } as any);

        // eslint-disable-next-line
        chai.expect(config).to.be.null;
    });

    it('should throw correct exception when config file is invalid', (callback) => {
        const filePath = path.join(__dirname, './fixtures/invalid.json');

        getFileConfig({
            config: filePath
        } as any)
            .then((config) => {
                callback(`
                    Config has been parsed, content:
                    ${config}
                `);
            })
            .catch((exception) => {
                chai.expect(exception).to.be.an.instanceof(SyntaxError);
                callback();
            });

   });
});

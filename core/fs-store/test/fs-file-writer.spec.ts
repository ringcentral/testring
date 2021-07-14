/// <reference types="mocha" />

import * as chai from 'chai';
import * as fs from 'fs';
import { loggerClient } from '@testring/logger'

const { readFile } = fs.promises;

import { FSStoreServer, fsStoreServerHooks } from '../src/fs-store-server';
import { FSFileWriter } from '../src/fs-file-writer';

const prefix = 'fsfw-test';
const log = loggerClient.withPrefix(prefix);


const FSS = new FSStoreServer(10, prefix);


describe('fs-file-writer', () => {
    it('store object should lock access & unlink data', async () => {

        const path = '/tmp/';

        const fileWriter = new FSFileWriter(log);
        // const file = new FSStoreFile({
        //     file: fileName,
        //     fsStorePrefix: prefix,
        // });


        const onRelease = FSS.getHook(fsStoreServerHooks.ON_RELEASE);
        chai.expect(onRelease).not.to.be.an('undefined', 'Hook ON_RELEASE in undefined');

        onRelease && onRelease.readHook('testRelease', ({ fileName, action }) => {
            chai.expect(fileName).to.be.a('string');
        });

        const str = 'test data';
        const fName = await fileWriter.write(Buffer.from(str), { path, opts: { ext: 'txt' } });
        chai.expect(fName).to.be.a('string');

        const fName_02 = await fileWriter.append(Buffer.from(str + '2'), { fileName: fName });
        chai.expect(fName_02).to.be.equal(fName);

        const contents = await readFile(fName);
        chai.expect(contents.toString()).to.be.equal(str + str + '2');

        const fName_03 = await fileWriter.write(Buffer.from(str), { fileName: fName });
        chai.expect(fName_03).to.be.equal(fName);

        const contents_01 = await readFile(fName);
        chai.expect(contents_01.toString()).to.be.equal(str);

        const fName_04 = await fileWriter.write(Buffer.from(str + '2'), { fileName: fName });
        chai.expect(fName_04).to.be.equal(fName);

        const contents_02 = await readFile(fName);
        chai.expect(contents_02.toString()).to.be.equal(str + '2');


        return Promise.resolve();
    });

});

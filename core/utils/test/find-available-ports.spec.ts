/// <reference types="mocha" />

import * as chai from 'chai';
import * as net from 'net';

import {
    getRandomPort,
    isAvailablePort,
    getAvailablePort,
    getAvailableFollowingPort,
} from '../src/find-available-ports';

const DEFAULT_HOST = 'localhost';

const startServer = (
    port: number,
    host: string = DEFAULT_HOST,
): Promise<net.Server> => {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.listen(port, host, () => {
            resolve(server);
        });
        server.on('error', () => {
            reject(Error(`Can not open ${port} port on this machine`));
        });
    });
};

const stopServer = (server: net.Server): Promise<void> => {
    return new Promise((resolve) => {
        server.once('close', () => {
            resolve();
        });
        server.close();
    });
};

describe('find ports', () => {
    it('should check available port', async () => {
        const port = 45500;
        chai.expect(await isAvailablePort(port, DEFAULT_HOST)).to.equal(true);

        const server = await startServer(port);
        chai.expect(await isAvailablePort(port, DEFAULT_HOST)).to.equal(false);

        await stopServer(server);
        chai.expect(await isAvailablePort(port, DEFAULT_HOST)).to.equal(true);
    });

    it('should return any available port', async () => {
        const port = await getRandomPort(DEFAULT_HOST);
        chai.expect(await isAvailablePort(port, DEFAULT_HOST)).to.equal(true);
    });

    it('should return first preferred available port', async () => {
        const port = await getAvailablePort([45600, 45601]);

        chai.expect(port).to.be.equal(45600);
        chai.expect(await isAvailablePort(port, DEFAULT_HOST)).to.equal(true);
    });

    it('should return second preferred available port', async () => {
        const server = await startServer(45700);
        const port = await getAvailablePort([45700, 45701]);

        chai.expect(port).to.be.equal(45701);
        chai.expect(await isAvailablePort(port, DEFAULT_HOST)).to.equal(true);

        await stopServer(server);
    });

    it('should return random available port', async () => {
        const server1 = await startServer(45800);
        const server2 = await startServer(45801);
        const port = await getAvailablePort([45800, 45801]);

        chai.expect(port).to.be.not.equal(45800);
        chai.expect(port).to.be.not.equal(45801);
        chai.expect(await isAvailablePort(port, DEFAULT_HOST)).to.equal(true);

        await stopServer(server1);
        await stopServer(server2);
    });

    it('should return following available port', async () => {
        const server1 = await startServer(45500);
        const server2 = await startServer(45501);
        chai.expect(await isAvailablePort(45502, DEFAULT_HOST)).to.be.equal(
            true,
        );
        const port = await getAvailableFollowingPort(45500);

        chai.expect(port).to.be.equal(45502);
        chai.expect(await isAvailablePort(port, DEFAULT_HOST)).to.equal(true);

        await stopServer(server1);
        await stopServer(server2);
    });

    it('should return following available port and skip that are passed', async () => {
        const server1 = await startServer(45400);
        chai.expect(await isAvailablePort(45401, DEFAULT_HOST)).to.be.equal(
            true,
        );
        chai.expect(await isAvailablePort(45402, DEFAULT_HOST)).to.be.equal(
            true,
        );
        chai.expect(await isAvailablePort(45403, DEFAULT_HOST)).to.be.equal(
            true,
        );
        const port = await getAvailableFollowingPort(45400, DEFAULT_HOST, [
            45401,
            45402,
        ]);

        chai.expect(port).to.be.equal(45403);
        chai.expect(await isAvailablePort(port, DEFAULT_HOST)).to.equal(true);

        await stopServer(server1);
    });
});

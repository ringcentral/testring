/// <reference types="mocha" />

import * as chai from 'chai';
import * as net from 'net';

import {
    getRandomPort,
    isAvailablePort,
    getAvailablePort,
} from '../src/find-ports';


const startServer = (port: number, host: string = '127.0.0.1'): Promise<net.Server> => {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.listen(port, host,() => {
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
        chai.expect(await isAvailablePort(port, '127.0.0.1')).to.equal(true);

        let server = await startServer(port);
        chai.expect(await isAvailablePort(port, '127.0.0.1')).to.equal(false);

        await stopServer(server);
        chai.expect(await isAvailablePort(port, '127.0.0.1')).to.equal(true);
    });

    it('should return any available port', async () => {
        const port = await getRandomPort('127.0.0.1');
        chai.expect(await isAvailablePort(port, '127.0.0.1')).to.equal(true);
    });

    it('should return first preferred available port', async () => {
        const port = await getAvailablePort([ 45600, 45601 ]);

        chai.expect(port).to.be.equal(45600);
        chai.expect(await isAvailablePort(port, '127.0.0.1')).to.equal(true);
    });

    it('should return second preferred available port', async () => {
        let server = await startServer(45700);
        const port = await getAvailablePort([ 45700, 45701 ]);

        chai.expect(port).to.be.equal(45701);
        chai.expect(await isAvailablePort(port, '127.0.0.1')).to.equal(true);

        await stopServer(server);
    });

    it('should return random available port', async () => {
        let server1 = await startServer(45800);
        let server2 = await startServer(45801);
        const port = await getAvailablePort([ 45800, 45801 ]);

        chai.expect(port).to.be.not.equal(45800);
        chai.expect(port).to.be.not.equal(45801);
        chai.expect(await isAvailablePort(port, '127.0.0.1')).to.equal(true);

        await stopServer(server1);
        await stopServer(server2);
    });
});

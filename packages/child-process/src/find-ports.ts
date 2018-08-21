import * as net from 'net';

export const isAvailablePort = (currentPort: number, host: string): Promise<boolean> => {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.listen(currentPort, host,() => {
            server.once('close', () => {
                resolve(true);
            });
            server.close();
        });
        server.on('error', () => {
            resolve(false);
        });
    });
};

export const getRandomPort = (host: string): Promise<number> => {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.listen(0, host,() => {
            // @ts-ignore
            const port = server.address().port;

            server.once('close', () => {
                resolve(port);
            });
            server.close();
        });
        server.on('error', () => {
            reject(Error('Can not open any free port on this machine'));
        });
    });
};

export const getAvailablePort = async (ports: Array<number> = [], host: string = '127.0.0.1'): Promise<number> => {
    for (let i = 0, len = ports.length; i < len; i++) {
        let port = ports[i];

        if (await isAvailablePort(port, host)) {
            return port;
        }
    }

    return await getRandomPort(host);
};

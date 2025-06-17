import * as net from 'net';

export function isAvailablePort(
    currentPort: number,
    host: string,
): Promise<boolean> {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.listen(currentPort, host, () => {
            server.once('close', () => {
                resolve(true);
            });
            server.close();
        });
        server.on('error', () => {
            resolve(false);
        });
    });
}

export function getRandomPort(host: string): Promise<number> {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.listen(0, host, () => {
            const address = server.address();
            let port = 0;

            if (address && typeof address === 'object') {
                port = address?.port;
            }

            server.once('close', () => {
                resolve(port);
            });
            server.close();
        });
        server.on('error', () => {
            reject(Error('Can not open any free port on this machine'));
        });
    });
}

export async function getAvailablePort(
    ports: Array<number> = [],
    host = 'localhost',
): Promise<number> {
    for (const port of ports) {
        if (await isAvailablePort(port, host)) {
            return port;
        }
    }

    return await getRandomPort(host);
}

export async function getAvailableFollowingPort(
    start: number,
    host = 'localhost',
    skipPorts: Array<number> = [],
): Promise<number> {
    if (!skipPorts.includes(start) && (await isAvailablePort(start, host))) {
        return start;
    }

    return getAvailableFollowingPort(start + 1, host, skipPorts);
}

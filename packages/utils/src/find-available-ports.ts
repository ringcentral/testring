import * as net from 'net';

export function isAvailablePort(currentPort: number, host: string): Promise<boolean> {
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
}

export function getRandomPort(host: string): Promise<number> {
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
}

export async function getAvailablePort(
    ports: Array<number> = [],
    host: string = 'localhost'
): Promise<number> {
    for (let i = 0, len = ports.length; i < len; i++) {
        let port = ports[i];

        if (await isAvailablePort(port, host)) {
            return port;
        }
    }

    return await getRandomPort(host);
}


export async function getAvailableFollowingPort(
    start: number,
    host: string = 'localhost',
    skipPorts: Array<number> = []
): Promise<number> {
    if (!skipPorts.includes(start) && await isAvailablePort(start, host)) {
        return start;
    }

    return getAvailableFollowingPort(start+1, host, skipPorts);
}

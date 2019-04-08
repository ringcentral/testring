import { Express } from 'express-serve-static-core';
import { Store } from 'redux';
import {
    IRecorderHttpRoute, IRecorderStaticRoutes,
    IServer,
} from '@testring/types';

import * as express from 'express';

export class HttpServer implements IServer {
    private server: Express;

    private waitForStart: Promise<void> | void;

    constructor(
        private port: number,
        private hostName: string,
        private routes: IRecorderHttpRoute[],
        private staticRoutes: IRecorderStaticRoutes,
        private store: Store,
    ) {
        this.server = express();
    }

    public async run() {
        this.server = express();

        this.initRoutes();
        this.initStaticRoutes();

        this.waitForStart = new Promise((resolve) => {
            this.server.listen(this.port, this.hostName,() => resolve());
        });

        await this.waitForStart;
    }

    public async stop() {
        await this.waitForStart;

        if (this.server) {
            const server = this.server;
            delete this.server;

            (server as any).close();
        }
    }

    public getUrl() {
        return `${this.hostName}:${this.port}`;
    }

    private getContext() {
        return this.store;
    }

    private initStaticRoutes() {
        for (let key in this.staticRoutes) {
            let route = this.staticRoutes[key];

            this.server.use(route.rootPath, express.static(route.directory, route.options));
        }
    }

    private initRoutes() {
        for (let route of this.routes) {
            switch (route.method) {
                case 'get':
                case 'post':
                case 'delete':
                case 'put':
                    this.server[route.method](
                        route.mask,
                        (req, res) => route.handler(req, res, this.getContext(), route.options)
                    );
                    break;
                default:
                    throw Error(`Unknown route method: ${route.method}`);
            }
        }
    }
}

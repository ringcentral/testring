import { Express } from 'express-serve-static-core';
import { Store } from 'redux';
import {
    IRecorderHttpRoute,
    IRecorderStaticRoutes,
    IServer,
} from '@testring/types';

import * as express from 'express';

export class RecorderHttpServer implements IServer {
    private server: Express;

    private waitForStart: Promise<void> | void;

    constructor(
        private hostName: string,
        private port: number,
        private routes: IRecorderHttpRoute[],
        private staticRoutes: IRecorderStaticRoutes,
        private storesByWebAppId: Map<string, Store>,
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
        return `http://${this.hostName}:${this.port}`;
    }

    private initStaticRoutes() {
        for (let key in this.staticRoutes) {
            let route = this.staticRoutes[key];

            this.server.use(route.rootPath, express.static(route.directory, route.options));
        }
    }

    private routeHandler(req, res, handler, options) {
        const webAppId = req.query.appId || null;

        if (webAppId === null) {
            res.send('Web App is not defined in get params');
            return;
        }

        if (this.storesByWebAppId.has(webAppId)) {
            const context = this.storesByWebAppId.get(webAppId);

            return handler(req, res, context, options);
        } else {
            res.send(`No Web App id is defined ${webAppId}`);
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
                        (req, res) => this.routeHandler(req, res, route.handler, route.options)
                    );
                    break;
                default:
                    throw Error(`Unknown route method: ${route.method}`);
            }
        }
    }
}

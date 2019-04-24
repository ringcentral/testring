import { Express, Request, Response } from 'express-serve-static-core';
import {
    IRecorderHttpRoute,
    IRecorderStaticRoutes,
    IServer,
    RecorderHttpContextResolver,
    RecorderHttpRouteHandler,
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
        private contextResolver: RecorderHttpContextResolver,
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

            this.server.use(route.rootPath, express.static(route.directory, { etag: false }));
        }
    }

    private async routeHandler(req: Request, res: Response, handler: RecorderHttpRouteHandler, options: any) {
        try {
            const data = await this.contextResolver(req, res);

            return handler(req, res, data.context, data.key, options);
        } catch (e) {
            res.status(500)
                .send(`${e.message}\n${e.stack}`)
                .end();
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

// eslint-disable-next-line import/no-unresolved
import type {Express, Request, Response} from 'express-serve-static-core';
import {
    IDevtoolHttpRoute,
    IDevtoolStaticRoutes,
    IServer,
    DevtoolHttpContextResolver,
    DevtoolHttpRouteHandler,
} from '@testring-dev/types';

import * as express from 'express';

export class DevtoolHttpServer implements IServer {
    private server: Express | null = null;

    private waitForStart: Promise<void> | void;

    constructor(
        private hostName: string,
        private port: number,
        private routes: IDevtoolHttpRoute[],
        private staticRoutes: IDevtoolStaticRoutes,
        private contextResolver: DevtoolHttpContextResolver,
    ) {
        this.server = express();
    }

    public async run() {
        this.server = express();
        const srv = this.server as Express;

        this.initRoutes(srv);
        this.initStaticRoutes(srv);

        this.waitForStart = new Promise((resolve) => {
            srv.listen(this.port, this.hostName, () => resolve());
        });

        await this.waitForStart;
    }

    public async stop() {
        await this.waitForStart;

        if (this.server) {
            const server = this.server;
            this.server = null;

            (server as any).close();
        }
    }

    public getUrl() {
        const protocol = 'http';
        return `${protocol}://${this.hostName}:${this.port}`;
    }

    private initStaticRoutes(server: Express) {
        for (const key in this.staticRoutes) {
            const route = this.staticRoutes[key];

            server.use(
                route.rootPath,
                express.static(route.directory, {etag: false}),
            );
        }
    }

    private async routeHandler(
        req: Request,
        res: Response,
        handler: DevtoolHttpRouteHandler,
        options: any,
    ) {
        try {
            const data = await this.contextResolver(req, res);

            return handler(req, res, data.context, data.key, options);
        } catch (e) {
            res.status(500).send(`${e.message}\n${e.stack}`).end();
        }
    }

    private initRoutes(server: Express) {
        for (const route of this.routes) {
            switch (route.method) {
                case 'get':
                case 'post':
                case 'delete':
                case 'put':
                    server[route.method](route.mask, (req, res) =>
                        this.routeHandler(
                            req,
                            res,
                            route.handler,
                            route.options,
                        ),
                    );
                    break;
                default:
                    throw Error(`Unknown route method: ${route.method}`);
            }
        }
    }
}

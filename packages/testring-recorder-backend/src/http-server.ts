import * as Koa from 'koa';
import * as serve from 'koa-static';
import * as views from 'koa-views';
import { IServer } from '@testring/types';

import { DEFAULT_HOST, DEFAULT_HTTP_PORT, DEFAULT_WS_PORT } from './constants';

export class RecorderHttpServer implements IServer {
    constructor(
        private staticPath: string,
        private templatesPath: string,
        private host: string = DEFAULT_HOST,
        private port: number = DEFAULT_HTTP_PORT,
        private wsPort: number = DEFAULT_WS_PORT,
    ) {
    }

    private server: any;

    public run(): void {
        this.stop();

        const koa = new Koa();

        koa.use(serve(this.staticPath));

        koa.use(views(
            this.templatesPath,
            { extension: 'hbs', map: {hbs: 'handlebars' } },
        ));

        koa.use(async (ctx) => {
            await ctx.render('index', {
                host: this.host,
                wsPort: this.wsPort,
            });
        });

        this.server = koa.listen(
            this.port,
            this.host,
        );
    }

    public stop(): void {
        if (this.server) {
            this.server.close();
            delete this.server;
        }
    }

    public getUrl(): string {
        return `http://${this.host}:${this.port}`;
    }
}

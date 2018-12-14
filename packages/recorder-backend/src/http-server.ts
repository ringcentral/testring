import { Server } from 'http';
import * as Koa from 'koa';
import * as serve from 'koa-static';
import * as views from 'koa-views';
import { IServer } from '@testring/types';
import {
    DEFAULT_RECORDER_HOST,
    DEFAULT_RECORDER_HTTP_PORT,
    DEFAULT_RECORDER_WS_PORT
} from '@testring/constants';

export class RecorderHttpServer implements IServer {
    constructor(
        private staticPath: string,
        private templatesPath: string,
        private host: string = DEFAULT_RECORDER_HOST,
        private port: number = DEFAULT_RECORDER_HTTP_PORT,
        private wsPort: number = DEFAULT_RECORDER_WS_PORT,
    ) {
    }

    private server: Server;

    public async run(): Promise<void> {
        await this.stop();

        const koa = new Koa();

        koa.use(serve(this.staticPath));

        koa.use(views(
            this.templatesPath,
            { extension: 'hbs', map: { hbs: 'handlebars' } },
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

    public async stop(): Promise<void> {
        if (!this.server) {
            return;
        }

        return new Promise<void>((resolve, reject) => {
            this.server.close((error) => {
                delete this.server;

                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }

    public getUrl(): string {
        return `http://${this.host}:${this.port}`;
    }
}

import * as express from 'express';
import * as Http from 'http';

const port = 8080;
export class MockWebServer {
    private httpServerInstance: Http.Server;

    start(): Promise<void> {
        return new Promise<void>((resolve) => {
            this.httpServerInstance = MockWebServer.createExpressWebApplication().listen(
                port,
                resolve,
            );
        });
    }

    stop(): void {
        this.httpServerInstance.close();
    }

    private static createExpressWebApplication(): express.Application {
        const app = express();
        app.use(express.static('static-fixtures'));
        return app;
    }
}

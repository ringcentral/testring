import * as express from 'express';
import * as Http from 'http';

const port = 8080;
export class MockWebServer {
    private httpServerInstance: Http.Server;

    start(): void {
        this.httpServerInstance = MockWebServer.createExpressWebApplication().listen(
            port,
        );
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

import * as express from 'express';
import * as Http from 'http';

export class MockWebServer {
    private httpServerInstance: Http.Server;

    start() {
        this.httpServerInstance = MockWebServer.createExpressWebApplication().listen(8080);
    }

    stop() {
        this.httpServerInstance.close();
    }

    private static createExpressWebApplication(): express.Application {
        const app = express();
        app.use(express.static('static-fixtures'));
        return app;
    }
}

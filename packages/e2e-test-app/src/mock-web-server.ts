import * as express from 'express';
import * as Http from 'http';

const port = 8080;
export class MockWebServer {
    private httpServerInstance: Http.Server;

    start() {
        this.httpServerInstance = MockWebServer.createExpressWebApplication().listen(port);
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

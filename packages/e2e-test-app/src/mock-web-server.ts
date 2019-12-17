import * as express from 'express';
import * as Http from 'http';

let httpServerInstance: Http.Server;

function createExpressWebApplication(): express.Application {
    const app = express();
    app.use(express.static('static-fixtures'));
    return app;
}

export function startWebServer() {
    httpServerInstance = createExpressWebApplication().listen(8080);
}

export function killWebServer() {
    httpServerInstance.close();
}

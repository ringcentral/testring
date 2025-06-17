import * as express from 'express';
import * as Http from 'http';
import * as path from 'node:path';
import * as multer from 'multer';

const port = 8080;
const upload = multer({storage: multer.memoryStorage()});

export class MockWebServer {
    private httpServerInstance: Http.Server;
    private static seleniumHubHeaders: Http.IncomingHttpHeaders[] = [];

    start(): Promise<void> {
        return new Promise<void>((resolve) => {
            this.httpServerInstance =
                MockWebServer.createExpressWebApplication().listen(
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
        app.use(express.static(path.join(__dirname, '..', 'static-fixtures')));

        // POST upload endpoint
        app.post('/upload', upload.single('file'), (req, res) => {
            if (!req.file) {
                res.status(400).json({error: 'No file uploaded'});
                return;
            }
            res.status(200).json({
                message: 'File received successfully',
                filename: req.file.originalname,
            });
        });

        // mock any request that contains /wd/hub
        app.all('/wd/hub/*', (req, res) => {
            // get request headers
            const headers = req.headers;
            // store headers for later use
            MockWebServer.seleniumHubHeaders.push(headers);
            res.status(200).json({
                status: 0,
                value: {
                    sessionId: 'mock-session-id',
                    capabilities: {
                        browserName: 'mock-browser',
                        platformName: 'mock-platform',
                    },
                },
            });
        });

        // endpoint to retrieve stored headers
        app.get('/selenium-headers', (req, res) => {
            res.status(200).json(MockWebServer.seleniumHubHeaders);
        });

        return app;
    }
}

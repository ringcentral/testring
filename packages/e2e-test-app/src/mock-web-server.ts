import * as express from 'express';
import * as Http from 'http';
import * as path from 'node:path';
import * as multer from 'multer';

const port = 8080;
const upload = multer({ storage: multer.memoryStorage() });

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
        app.use(express.static(
            path.join(__dirname, '..', 'static-fixtures'),
        ));

        // POST upload endpoint
        app.post('/upload', upload.single('file'), (req, res) => {
            if (!req.file) {
                res.status(400).json({ error: 'No file uploaded' });
                return;
            }
            res.status(200).json({ message: 'File received successfully', filename: req.file.originalname });
        });

        return app;
    }
}
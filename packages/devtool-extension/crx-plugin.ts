import * as path from 'path';
import * as fs from 'fs';
import * as childProcess from 'child_process';

// TODO (flops) after migration on nodejs >= 11 use crx3-utils instead
import {getPlatform} from 'chrome-launcher/dist/utils';
import * as chromeFinder from 'chrome-launcher/dist/chrome-finder';

export class CRXPlugin {
    constructor(
        private options: {
            directory: string;
            keyPath: string;
            outputDirectory: string;
            filename: string;
            rootPath: string;
        },
    ) {}

    private getDirectory() {
        return path.isAbsolute(this.options.directory)
            ? this.options.directory
            : path.join(this.options.rootPath, this.options.directory);
    }

    private resolvePath(filepath) {
        const absolutePath = path.isAbsolute(this.options.outputDirectory)
            ? this.options.outputDirectory
            : path.join(this.options.rootPath, this.options.outputDirectory);

        return path.join(absolutePath, filepath);
    }

    private getInputKeyPath() {
        return path.isAbsolute(this.options.keyPath)
            ? this.options.keyPath
            : path.join(this.options.rootPath, this.options.keyPath);
    }

    private getExtensionPath() {
        return this.resolvePath(this.options.filename + '.crx');
    }

    private async writeFile(filepath, data) {
        return new Promise<void>((resolve, reject) => {
            fs.writeFile(filepath, data, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    private async generateExtension() {
        const platform = getPlatform();
        // eslint-disable-next-line import/namespace
        const installGetter = chromeFinder[platform];

        if (!installGetter) {
            throw Error('Unsupported platform: ' + platform);
        }

        const installations = await installGetter();

        if (!installations[0]) {
            throw Error('Chrome not found');
        }

        await new Promise<void>((resolve, reject) => {
            // eslint-disable-next-line max-len
            childProcess.exec(
                `${
                    installations[0]
                } --pack-extension=${this.getDirectory()} --pack-extension-key=${this.getInputKeyPath()}`,
                {
                    cwd: this.options.rootPath,
                },
                (error) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                },
            );
        });
        const generatedFilepath = this.getDirectory() + '.crx';

        const stream = fs.createReadStream(generatedFilepath);
        const data: Buffer[] = [];
        const output = await new Promise<Buffer>((resolve, reject) => {
            stream.on('error', reject);
            stream.on('data', (chunk) =>
                data.push(
                    typeof chunk === 'string' ? Buffer.from(chunk) : chunk,
                ),
            );
            stream.on('end', () => resolve(Buffer.concat(data)));
        });

        await this.writeFile(this.getExtensionPath(), output);

        await new Promise<void>((resolve, reject) => {
            fs.unlink(generatedFilepath, (err): void => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    public apply(compiler): void {
        compiler.hooks.afterEmit.tap('CRXPlugin', async () => {
            try {
                await this.generateExtension();
                // eslint-disable-next-line no-console
                console.log('\nCRX Plugin: is generated.');
            } catch (err) {
                // eslint-disable-next-line no-console
                console.log('\nCRX Plugin error:', err);
            }
        });
    }
}

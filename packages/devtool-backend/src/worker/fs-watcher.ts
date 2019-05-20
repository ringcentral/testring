import { EventEmitter } from 'events';
import { promisify } from 'util';
import * as fs from 'fs';

import { FSWatcher as Watcher, watch } from 'chokidar';

import { LoggerClient, loggerClient } from '@testring/logger';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

type updateListener = (filename: string, source: string) => void;

export class FsWatcher extends EventEmitter {
    private logger: LoggerClient = loggerClient.withPrefix('[devtool-fs-watcher]');

    private listenersByKey: Map<string, updateListener[]> = new Map();

    private filesMap: Map<string, string> = new Map();

    private watcher: Watcher;

    constructor() {
        super();

        this.watcher = watch([])
            .on('change', filename => this.changeHandler(filename))
            .on('raw', (event, path, { watchedPath }) => {
                if (event === 'rename') {
                    // @FIXME https://github.com/paulmillr/chokidar/issues/591
                    this.watcher.unwatch(watchedPath);
                    this.watcher.add(watchedPath);
                }
            });
    }

    private async changeHandler(filename: string): Promise<void> {
        if (!this.filesMap.has(filename)) {
            return;
        }

        const fsSource = (await readFile(filename)).toString();
        const source = this.filesMap.get(filename);

        if (fsSource !== source) {
            this.updateFile(filename, fsSource, true);

            this.emit('change', {
                filename,
                source: fsSource,
            });
        }
    }

    private async updateFile(filename: string, source: string, skipWrite: boolean = false): Promise<void> {
        this.filesMap.set(filename, source);

        if (!skipWrite && this.filesMap.has(filename)) {
            await writeFile(filename, source);
        }
    }

    public async write(filename: string, source: string): Promise<void> {
        if (this.filesMap.has(filename)) {
            this.updateFile(filename, source);
        }
    }

    public async unwatch(filename: string): Promise<void> {
        if (this.filesMap.has(filename)) {
            this.filesMap.delete(filename);
        }
    }

    public async watch(filename: string, source?: string): Promise<void> {
        if (!source) {
            try {
                source = (await readFile(filename)).toString();
            } catch (e) {
                this.logger.error(e);
                return;
            }
        }

        if (!this.filesMap.has(filename)) {
            this.logger.debug(`Watching ${filename}...`);
            await this.updateFile(filename, source, true);

            this.watcher.add(filename);
        }
    }

    public addListenerWithKey(key: string, listener: updateListener): void {
        const handler = ({ filename, source }) => {
            listener(filename, source);
        };

        this.addListener('change', handler);

        if (!this.listenersByKey.has(key)) {
            this.listenersByKey.set(key, []);
        }

        const listeners = this.listenersByKey.get(key) as any;
        this.listenersByKey.set(key, [...listeners, listener]);
    }

    public removeAllListenerByKey(key: string): void {
        if (!this.listenersByKey.has(key)) {
            return;
        }

        for (let listener of this.listenersByKey.get(key) as updateListener[]) {
            this.removeListener('change', listener);
        }
    }
}

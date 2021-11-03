import * as path from 'path';
import * as os from 'os';

import {
    IFSStoreReq,
    IFSStoreResp,
    fsReqType,
    requestMeta,
} from '@testring/types';
import {generateUniqId} from '@testring/utils';
import {loggerClient} from '@testring/logger';
import {transport} from '@testring/transport';
import {PluggableModule} from '@testring/pluggable-module';

import {LockPool, FilePermissionResolver, FS_CONSTANTS} from './utils';

const log = loggerClient.withPrefix('fss');
const {DW_ID, FS_DEFAULT_MSG_PREFIX} = FS_CONSTANTS;

export enum serverState {
    'new' = 0,
    'initStarted',
    'initialized',
}

type ActionQueReq = {
    action: fsReqType;
    requestId: string;
    fullPath: string;
};

type RequestActionData = {
    requestId: string;
    action: fsReqType;
    meta: Record<string, any>;
};

const hooks = {
    ON_FILENAME: 'onFileName',
    ON_QUEUE: 'onQueue',
    ON_RELEASE: 'onRelease',
};

export {hooks as fsStoreServerHooks};

type cleanUpCBRecord = Record<string, Record<string, (() => void) | undefined>>;

const asyncActions = new Set([fsReqType.access, fsReqType.unlink]);

export class FSStoreServer extends PluggableModule {
    private reqName: string;
    private respName: string;
    private releaseReqName: string;
    private cleanReqName: string;
    private unHookReqTransport: (() => void) | null = null;
    private unHookReleaseTransport: (() => void) | null = null;
    private unHookCleanWorkerTransport: (() => void) | null = null;
    private defaultFsPermisionPool: LockPool;

    private files: Record<
        string,
        [FilePermissionResolver, cleanUpCBRecord]
    > = {};
    private inWorkRequests: Record<
        string,
        Record<string, [fsReqType, string]>
    > = {};
    private usedFiles: Record<string, boolean> = {};

    private state: serverState = serverState.new;

    /**
     *
     * @param threadCount
     * @param msgNamePrefix
     */
    constructor(
        threadCount = 10,
        msgNamePrefix: string = FS_DEFAULT_MSG_PREFIX,
    ) {
        super(Object.values(hooks));

        this.defaultFsPermisionPool = new LockPool(threadCount);

        this.reqName = msgNamePrefix + FS_CONSTANTS.FS_REQ_NAME_POSTFIX;
        this.respName = msgNamePrefix + FS_CONSTANTS.FS_RESP_NAME_POSTFIX;
        this.releaseReqName =
            msgNamePrefix + FS_CONSTANTS.FS_RELEASE_NAME_POSTFIX;
        this.cleanReqName =
            msgNamePrefix + FS_CONSTANTS.FS_CLEAN_REQ_NAME_POSTFIX;

        this.init();
    }

    public getState(): number {
        return this.state;
    }

    public init() {
        // ensure init once
        if (this.state !== serverState.new) {
            return false; // no need to reinit server
        }
        this.state = serverState.initStarted;

        this.unHookReqTransport = transport.on<IFSStoreReq>(
            this.reqName,
            async (msgData, workerId = DW_ID) => {
                const {requestId, action, meta} = msgData;
                const {fileName} = meta;

                if (!fileName) {
                    // no fileName given - need to construct one
                    if (action === fsReqType.unlink) {
                        // if no fileName during unlink -> ERROR
                        this.send<IFSStoreResp>(workerId, this.respName, {
                            requestId,
                            action,
                            fullPath: '',
                            status: 'no fileName for unlink',
                        });

                        return;
                    }
                    meta.fileName = this.generateUniqFileName(meta.ext);
                }

                this.RequestAction({requestId, action, meta}, workerId);
            },
        );

        this.unHookReleaseTransport = transport.on<IFSStoreReq>(
            this.releaseReqName,
            (msgData, workerId = DW_ID) => {
                this.ReleaseAction(msgData, workerId);
            },
        );

        this.unHookCleanWorkerTransport = transport.on<IFSStoreReq>(
            this.cleanReqName,
            (msgData, workerId = DW_ID) => {
                this.ClearAction(msgData, workerId);
            },
        );

        this.state = serverState.initialized;
    }

    private send<T>(workerId: string | undefined, msgId: string, data: T) {
        if (!workerId || workerId === DW_ID) {
            transport.broadcastUniversally<T>(msgId, data);
        } else {
            transport.send<T>(workerId, msgId, data);
        }
    }

    public cleanUpTransport() {
        this.unHookReqTransport && this.unHookReqTransport();
        this.unHookReleaseTransport && this.unHookReleaseTransport();
        this.unHookCleanWorkerTransport && this.unHookCleanWorkerTransport();
    }

    private ensurePermissionQueue(
        {action, requestId, fullPath}: ActionQueReq,
        workerId: string,
    ) {
        if (!this.files[fullPath]) {
            this.files[fullPath] = [new FilePermissionResolver(fullPath), {}];
            delete this.usedFiles[fullPath];
        }
        if (!this.inWorkRequests[workerId]) {
            this.inWorkRequests[workerId] = {};
        }
        this.inWorkRequests[workerId][requestId] = [action, fullPath];
    }

    private ensureCleanUpCBRecord(
        cleanUpCBRecord: cleanUpCBRecord,
        workerId: string,
    ) {
        if (!cleanUpCBRecord[workerId]) {
            cleanUpCBRecord[workerId] = {};
        }
    }

    private getPermissionQueue(meta: requestMeta, workerId: string) {
        return this.callHook(
            hooks.ON_QUEUE,
            this.defaultFsPermisionPool,
            meta,
            {
                workerId,
                defaultQueue: this.defaultFsPermisionPool,
            },
        );
    }

    private async RequestAction(data: RequestActionData, workerId: string) {
        const {requestId, action, meta} = data;
        const fullPath = await this.generateUniqFullPath(
            workerId,
            requestId,
            meta,
        );
        this.ensurePermissionQueue({requestId, fullPath, action}, workerId);
        const [FPR, releaseCBRec] = this.files[fullPath];
        this.ensureCleanUpCBRecord(releaseCBRec, workerId);

        switch (action) {
            case fsReqType.lock:
                const canBeLocked = FPR.lock(
                    workerId,
                    requestId,
                    (dataObj, releaseCb) => {
                        releaseCBRec[workerId][requestId] = releaseCb;
                        this.send<IFSStoreResp>(workerId, this.respName, {
                            requestId,
                            fullPath,
                            action,
                            status: 'OK',
                        });
                    },
                );
                if (!canBeLocked) {
                    this.send<IFSStoreResp>(workerId, this.respName, {
                        requestId,
                        fullPath,
                        action,
                        status: 'impossible to lock',
                    });
                }
                break;
            case fsReqType.access:
                const canBeAccessed = FPR.hookAccess(
                    workerId,
                    requestId,
                    async (_, releaseCb) => {
                        // access granted (releaseCb - to call for release access)
                        releaseCBRec[workerId][requestId] = releaseCb;

                        const permision = await this.getPermissionQueue(
                            meta,
                            workerId,
                        );

                        const acuired = await permision.acquire(
                            workerId,
                            requestId,
                        );
                        this.inWorkRequests[workerId][requestId] = [
                            action,
                            fullPath,
                        ];
                        this.send<IFSStoreResp>(workerId, this.respName, {
                            requestId,
                            fullPath,
                            action,
                            status: acuired ? 'OK' : 'no access',
                        });
                    },
                );
                if (!canBeAccessed) {
                    this.send<IFSStoreResp>(workerId, this.respName, {
                        requestId,
                        fullPath,
                        action,
                        status: 'impossible to access',
                    });
                }
                break;
            case fsReqType.unlink:
                FPR.hookUnlink(workerId, requestId, async (_, releaseCb) => {
                    // unlink access granted (releaseCb - to call for release access)
                    releaseCBRec[workerId][requestId] = releaseCb;

                    const permision = await this.getPermissionQueue(
                        meta,
                        workerId,
                    );

                    const acuired = await permision.acquire(
                        workerId,
                        requestId,
                    );
                    this.inWorkRequests[workerId][requestId] = [
                        action,
                        fullPath,
                    ];
                    this.send<IFSStoreResp>(workerId, this.respName, {
                        requestId,
                        fullPath,
                        action,
                        status: acuired ? 'OK' : 'no access',
                    });
                });
        }
    }

    // eslint-disable-next-line sonarjs/cognitive-complexity
    private async ReleaseAction(data: IFSStoreReq, workerId: string) {
        const {requestId, action, meta} = data;
        const {fileName} = meta;
        if (!fileName) {
            log.warn({workerId, requestId}, 'no fileName to release');
            this.send<IFSStoreResp>(workerId, this.respName, {
                requestId,
                fullPath: '',
                action: fsReqType.release,
                status: 'invalid fullPath/fileName for release',
            });
            return false;
        }
        let fullPath = fileName;
        try {
            fullPath = await this.generateUniqFullPath(
                workerId,
                requestId,
                meta,
            );
        } catch (e) {
            log.error(e, 'generate Uniq full name ERROR');
        }

        if (!this.files[fullPath]) {
            log.error(
                {
                    workerId,
                    requestId,
                    fileName,
                    fullPath,
                    meta,
                },
                'no files for release',
            );
            this.send<IFSStoreResp>(workerId, this.respName, {
                requestId,
                fullPath,
                action: fsReqType.release,
                status: 'NOEXIST',
            });
            return false;
        }

        const [FPR, releaseCBRec] = this.files[fullPath];

        if (asyncActions.has(action)) {
            const inProgress = this.inWorkRequests[workerId][requestId];
            this.inWorkRequests[workerId][requestId] = [action, fullPath];

            if (inProgress) {
                const permision = await this.getPermissionQueue(meta, workerId);

                await permision.release(workerId, requestId);
            }
            this.send<IFSStoreResp>(workerId, this.respName, {
                requestId,
                fullPath,
                action: fsReqType.release,
                status: 'OK',
            });

            const cleanUpCB =
                releaseCBRec[workerId] && releaseCBRec[workerId][requestId];

            cleanUpCB && cleanUpCB();
        } else {
            switch (action) {
                case fsReqType.lock:
                    const cleanUpCB =
                        releaseCBRec &&
                        releaseCBRec[workerId] &&
                        releaseCBRec[workerId][requestId];

                    if (cleanUpCB) {
                        cleanUpCB();
                    } else {
                        FPR.unlock(workerId, requestId);
                    }
                    this.send<IFSStoreResp>(workerId, this.respName, {
                        requestId,
                        fullPath,
                        action: fsReqType.release,
                        status: 'OK',
                    });
            }
        }

        this.callHook(hooks.ON_RELEASE, {
            workerId,
            requestId,
            fullPath,
            fileName,
            action,
        });

        return true;
    }

    private async ClearAction(data: IFSStoreReq, workerId: string) {
        const {action} = data;

        if (!action) {
            Object.keys(this.files).forEach((fName) => {
                this.files[fName][0].cleanAccess(workerId);
                this.files[fName][0].cleanLock(workerId);
                this.files[fName][0].cleanUnlink(workerId);
            });
            return;
        }
        switch (action) {
            case fsReqType.access:
                Object.keys(this.files).forEach((fName) => {
                    this.files[fName][0].cleanAccess(workerId);
                });
                break;
            case fsReqType.lock:
                Object.keys(this.files).forEach((fName) => {
                    this.files[fName][0].cleanLock(workerId);
                });
                break;
            case fsReqType.unlink:
                Object.keys(this.files).forEach((fName) => {
                    this.files[fName][0].cleanUnlink(workerId);
                });
        }
    }

    public getNameList() {
        return Object.keys(this.files);
    }

    private generateUniqFileName(ext = 'tmp') {
        return `${generateUniqId(10)}_.${ext}`;
    }

    private async generateUniqFullPath(
        workerId: string,
        requestId: string,
        meta: Record<string, any>,
    ): Promise<string> {
        const {fileName} = meta;

        let filePath = await this.callHook(hooks.ON_FILENAME, fileName, {
            workerId,
            requestId,
            meta,
        });

        if (!filePath || filePath === fileName) {
            filePath = path.join(os.tmpdir(), fileName);
        }

        this.usedFiles[filePath] = true;
        return filePath as string;
    }
}

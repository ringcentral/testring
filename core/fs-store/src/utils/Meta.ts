export enum FSFileUniqPolicy {
    'global',
    'worker',
}

type BaseReqMeta = {
    type?: string; // simple file will be created in /tmp
    subtype?: string | string[];
    extraPath?: string;
    global?: boolean; // global file - assume fileName as fullPath
    preserveName?: boolean; // construct ony path & use fileName with out addons
    uniqPolicy?: FSFileUniqPolicy; //
    options?: Record<string, any>;
    workerId?: string;
};

export type requestMeta = BaseReqMeta & {
    fileName?: string; // no path
    ext?: string; // by default 'tmp'
};

export class RequestMeta {
    constructor(private data: requestMeta) {}

    clone(overWriteData?: requestMeta) {
        return new RequestMeta({...this.data, ...overWriteData});
    }

    get ext() {
        return this.data.ext;
    }
    get fileName() {
        return this.data.fileName;
    }
    set fileName(fileName) {
        this.data.fileName = fileName;
    }

    isGlobal() {
        return !!this.data.global;
    }

    get info() {
        return this.data;
    }
}

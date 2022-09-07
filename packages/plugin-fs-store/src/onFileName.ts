import * as path from 'path';
import * as os from 'os';

import {FSFileUniqPolicy, IOnFileNameHookData} from '@testring-dev/types';
import {generateUniqId, fs} from '@testring-dev/utils';

const {ensureNewFile, ensureDir} = fs;

const DEFAULT_FILE_NAME_LENGTH = 5;

function pathFromWorkerId(wId: string) {
    return wId.replace(/\//g, '_');
}

async function ensureUniqName(
    dirPath: string,
    ext: string,
    prefixName: string,
    chkDir = true,
) {
    if (chkDir) {
        await ensureDir(dirPath);
    }
    const name = generateUniqId(DEFAULT_FILE_NAME_LENGTH);
    const tmpName = path.join(dirPath, `${prefixName}_${name}.${ext}`);
    if (await ensureNewFile(tmpName)) {
        return tmpName;
    }
    return ensureUniqName(dirPath, ext, prefixName, false);
}

export function makePathNameFromRequest(
    data: IOnFileNameHookData,
    pathHash: Record<string, string>,
) {
    const {meta, workerId: wId} = data;
    const {
        type,
        subtype,
        extraPath,
        uniqPolicy,
        workerId: mwId,
        preserveName,
        global,
        fileName,
    } = meta;

    if (global && typeof fileName === 'string') {
        return [path.dirname(fileName), ''];
    }

    // allow to overwrite workerId - metaWorkerId (mwId) is primary data
    const workerId = mwId && mwId.length > 1 ? mwId : wId;
    const pathParts: string[] = [];
    let nameParts: string[] = [];

    if (type && pathHash[type]) {
        pathParts.push(pathHash[type]);
    } else {
        pathParts.push(os.tmpdir());
    }
    if (extraPath) {
        pathParts.push(extraPath);
    }
    if (!preserveName) {
        if (uniqPolicy === FSFileUniqPolicy.worker && workerId) {
            nameParts.push(pathFromWorkerId(workerId));
        }
        if (subtype) {
            const subTypeArr = Array.isArray(subtype) ? subtype : [subtype];

            nameParts = [...nameParts, ...subTypeArr];
        }
    }
    return [path.join.call(path, ...pathParts), nameParts.join('_')];
}

function exsureExtraName(fileName: string, extraName: string) {
    if (fileName.includes(extraName)) {
        return fileName;
    }
    const parts = fileName.split('.');
    const fileExt = parts.pop() || '';
    parts.push(extraName);
    parts.push(fileExt);
    return parts.join('.');
}

export function cbGen(staticPaths: Record<string, string> = {}) {
    return async (fName: string, reqData: IOnFileNameHookData) => {
        const {meta} = reqData;
        const {fileName} = meta;

        // if result was altered - return previous result
        if (fileName !== fName) {
            return fName;
        }

        const [tmpPath, extraName] = await makePathNameFromRequest(
            reqData,
            staticPaths,
        );

        let tmpName = fileName;

        const {ext = 'tmp'} = meta;

        if (!fileName) {
            tmpName = await ensureUniqName(tmpPath, ext, extraName);
        } else {
            if (extraName !== '') {
                tmpName = exsureExtraName(fileName, extraName);
            } else {
                tmpName = path.basename(fileName);
            }
        }

        return path.join(tmpPath, tmpName);
    };
}

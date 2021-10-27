import * as path from 'path';
import * as os from 'os';

import {FSFileUniqPolicy, IOnFileNameHookData} from '@testring/types';
import {generateUniqId, fs} from '@testring/utils';

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
    } = meta;

    // allow to overwrite workerId - metaWorkerId (mwId) is primary data
    const workerId = mwId && mwId.length > 1 ? mwId : wId;
    let pathParts: string[] = [];
    let nameParts: string[] = [];

    if (type && pathHash[type]) {
        pathParts.push(pathHash[type]);
    } else {
        pathParts.push(os.tmpdir());
    }
    if (extraPath) {
        pathParts.push(extraPath);
    }
    if (!preserveName && uniqPolicy === FSFileUniqPolicy.worker && workerId) {
        nameParts.push(pathFromWorkerId(workerId));
    }
    if (subtype) {
        const subTypeArr = Array.isArray(subtype) ? subtype : [subtype];
        if (preserveName) {
            pathParts = [...pathParts, ...subTypeArr];
        } else {
            nameParts = [...nameParts, ...subTypeArr];
        }
    }
    return [path.join.call(path, ...pathParts), nameParts.join('_')];
}

export function cbGen(staticPaths: Record<string, string> = {}) {
    return async (fName: string, reqData: IOnFileNameHookData) => {
        const {fileName, meta} = reqData;
        if (fileName !== fName) {
            return fileName;
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
            const parts = fileName.split('.');
            const fileExt = parts.pop() || '';
            parts.push(extraName);
            parts.push(fileExt);
            tmpName = parts.join('.');
        }

        return path.join(tmpPath, tmpName);
    };
}

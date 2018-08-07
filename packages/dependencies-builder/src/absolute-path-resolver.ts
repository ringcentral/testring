import * as path from 'path';
import { resolvePackage } from '@testring/utils';

export const resolveAbsolutePath = (request: string, parentPath: string) => {
    if (request.includes('./')) {
        const normalizedRequest = path.resolve(path.dirname(parentPath), request);

        return resolvePackage(normalizedRequest);
    } else {
        return resolvePackage(request);
    }
};

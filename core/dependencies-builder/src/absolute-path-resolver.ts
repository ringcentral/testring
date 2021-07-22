import * as path from 'path';
import {resolvePackage} from '@testring/utils';

export function resolveAbsolutePath(
    request: string,
    parentPath: string,
): string {
    if (request.includes('./')) {
        const normalizedRequest = path.resolve(
            path.dirname(parentPath),
            request,
        );

        return resolvePackage(normalizedRequest);
    }
    return resolvePackage(request);
}

const {nanoid} = require('nanoid');

export function generateUniqId(size?: number): string {
    return nanoid(size);
}

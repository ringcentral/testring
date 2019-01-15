const nanoid = require('nanoid');

export function generateUniqId(size?: number) {
    return nanoid(size);
}

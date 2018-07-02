
export function hasOwn(obj: object, key: string | number | symbol): boolean {
    return Object.hasOwnProperty.call(obj, key);
}

export function isString(obj: any): boolean {
    return typeof obj === 'string';
}

export function isInteger(obj: any): boolean {
    return Number.isInteger(obj) || (isString(obj) && `${parseInt(obj, 10)}` === obj);
}

export function isGenKeyType(key: any): boolean {
    return key !== '' && (isString(key) || isInteger(key));
}

export function keysCount(obj: object): number {
    return Object.keys(obj).length;
}


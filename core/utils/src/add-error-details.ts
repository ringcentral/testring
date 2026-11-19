export function addErrorDetails(
    error: Error,
    details: Record<string, unknown>,
): Error {
    const current = (error as Error & {details?: unknown}).details;
    const currentDetails =
        current &&
        typeof current === 'object' &&
        !Array.isArray(current) &&
        (Object.getPrototypeOf(current) === Object.prototype ||
            Object.getPrototypeOf(current) === null)
            ? (current as Record<string, unknown>)
            : {};
    const merged = {...currentDetails};
    const reserved = new Set([
        '__proto__',
        'cause',
        'code',
        'constructor',
        'details',
        'message',
        'name',
        'prototype',
        'stack',
    ]);

    for (const [key, value] of Object.entries({...currentDetails, ...details})) {
        if (!reserved.has(key)) {
            merged[key] = value;
            Object.defineProperty(error, key, {
                value,
                configurable: true,
                enumerable: true,
                writable: true,
            });
        }
    }
    Object.defineProperty(error, 'details', {
        value: merged,
        configurable: true,
        enumerable: true,
        writable: true,
    });

    return error;
}

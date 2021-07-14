export function restructureError(error) {
    if (error instanceof Error) {
        return error;
    }

    let tmpError = new Error(error?.message || error || 'unknown error');
    if (error?.stack) {
        tmpError.stack = error.stack;
    }

    return tmpError;
}

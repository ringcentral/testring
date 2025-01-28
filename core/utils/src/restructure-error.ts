export function restructureError(error) {
    if (error instanceof Error) {
        return error;
    }

    const tmpError = new Error(error?.message || error || 'unknown error');
    if (error?.stack) {
        tmpError.stack = error.stack;
    }

    return tmpError;
}

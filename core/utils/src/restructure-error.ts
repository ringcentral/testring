export function restructureError(error: { message: any; stack: string; } | Error) {
    if (error instanceof Error) {
        return error;
    }

    const tmpError = new Error(error?.message || error || 'unknown error');
    if (error?.stack) {
        tmpError.stack = error.stack;
    }

    return tmpError;
}

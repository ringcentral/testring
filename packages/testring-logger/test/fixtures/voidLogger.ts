export const voidLogger = (
    retry: number = 0,
    shouldResolve: boolean = true,
    onError: (...any) => void = () => {},
    onResolve: (...any) => void = () => {},
) => {
    let count = retry;

    return async (...args): Promise<void> => {
        if (count > 0 || count <= 0 && !shouldResolve) {
            --count;

            onError(...args);

            throw new Error('ERROR');
        } else {
            onResolve(...args);
        }
    };
};

const EMPTY_FN = () => {};

export function voidLogger(
    retry: number,
    shouldResolve: boolean,
    onError: (...any) => void = EMPTY_FN,
    onResolve: (...any) => void = EMPTY_FN,
) {

    let count = retry;

    return async (...args): Promise<void> => {
        if (count > 0 || count <= 0 && !shouldResolve) {
            --count;

            onError(...args);

            throw new Error(
                `Logger called less times as expected, expected count: ${retry}, called: ${count}`,
            );
        } else {
            onResolve(...args);
        }
    };
}

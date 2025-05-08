const EMPTY_FN = () => {
    /* empty */
};

export function voidLogger(
    retry: number,
    shouldResolve: boolean,
    onError: (...arg0: any[]) => void = EMPTY_FN,
    onResolve: (...arg0: any[]) => void = EMPTY_FN,
) {
    let count = retry;

    return async (...args: any): Promise<void> => {
        if (count > 0 || (count <= 0 && !shouldResolve)) {
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

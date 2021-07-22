/* https://codeburst.io/throttling-and-debouncing-in-javascript-b01cad5c8edf */

export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number,
): () => void {
    let lastFunc;
    let lastRan;

    return function () {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const context = this;
        // eslint-disable-next-line prefer-rest-params
        const args = arguments;

        if (!lastRan) {
            func.apply(context, args);
            lastRan = Date.now();
        } else {
            clearTimeout(lastFunc);

            lastFunc = setTimeout(function () {
                if (Date.now() - lastRan >= limit) {
                    func.apply(context, args);
                    lastRan = Date.now();
                }
            }, limit - (Date.now() - lastRan));
        }
    };
}

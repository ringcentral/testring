/* https://codeburst.io/throttling-and-debouncing-in-javascript-b01cad5c8edf */

export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number,
): (...args: Parameters<T>) => void {
    let lastFunc: ReturnType<typeof setTimeout> | undefined;
    let lastRan: number | undefined;

    return function (this: unknown, ...args: Parameters<T>) {
        const context = this;

        if (lastRan === undefined) {
            func.apply(context, args);
            lastRan = Date.now();
        } else {
            if (lastFunc !== undefined) {
                clearTimeout(lastFunc);
            }

            lastFunc = setTimeout(function () {
                if (Date.now() - (lastRan as number) >= limit) {
                    func.apply(context, args);
                    lastRan = Date.now();
                }
            }, limit - (Date.now() - (lastRan as number)));
        }
    };
}


/* https://codeburst.io/throttling-and-debouncing-in-javascript-b01cad5c8edf */

// eslint-disable-next-line space-before-function-paren
export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): () => void {
    let lastFunc;
    let lastRan;

    return function () {
        const context = this;
        const args = arguments;

        if (!lastRan) {
            func.apply(context, args);
            lastRan = Date.now();
        } else {
            clearTimeout(lastFunc);

            lastFunc = setTimeout(function () {
                if ((Date.now() - lastRan) >= limit) {
                    func.apply(context, args);
                    lastRan = Date.now();
                }
            }, limit - (Date.now() - lastRan));
        }
    };
}

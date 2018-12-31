export function logXpath<T>(xpath: T | string): T | string {
    if (xpath === undefined) {
        throw new Error([
            'Path is empty, please check that your web test id map is correctly used in your test.',
            'Check the path that is used AFTER the upper mentioned path.',
        ].join('\n'));
    }

    if (typeof xpath === 'string') {
        return xpath;
    } else if (xpath && typeof (xpath as any).toFormattedString === 'function') {
        return (xpath as any).toFormattedString();
    } else if (xpath && typeof xpath.toString === 'function') {
        return xpath.toString();
    } else {
        return xpath;
    }
}

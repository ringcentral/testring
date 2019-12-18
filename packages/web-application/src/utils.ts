export function getFormattedString(xpath: any): string {
    if (typeof xpath === 'string') {
        return xpath;
    } else if (xpath && typeof (xpath as any).toFormattedString === 'function') {
        return (xpath as any).toFormattedString();
    } else if (xpath && typeof (xpath as any).toString === 'function') {
        return (xpath as any).toString();
    } else if (xpath === undefined) {
        return 'undefined';
    }

    return 'null';
}

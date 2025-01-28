export function getFormattedString(xpath: any): string {
    if (xpath === undefined) {
        return 'undefined';
    } else if (xpath === null) {
        return 'null';
    } else if (typeof xpath === 'string') {
        return xpath;
    } else if (xpath && typeof xpath.toFormattedString === 'function') {
        return xpath.toFormattedString();
    } else if (xpath && typeof xpath.toString === 'function') {
        return xpath.toString();
    }

    return 'UNKNOWN_OBJECT';
}

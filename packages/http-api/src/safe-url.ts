export function safeUrl(value: string): string {
    try {
        const url = new URL(value);
        return `${url.origin}${url.pathname}`;
    } catch {
        return (
            value
                .split(/[?#]/, 1)[0]
                ?.replace(/^([a-z][a-z\d+.-]*:\/\/)[^/]*@/i, '$1') || ''
        );
    }
}

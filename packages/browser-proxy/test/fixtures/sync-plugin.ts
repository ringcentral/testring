class SyncPlugin {
    click(_applicant: string, argument: any) {
        return argument;
    }

    throwUrlError() {
        class RequestJar {}
        const nestedCause = new TypeError('request failed');
        Object.defineProperty(nestedCause, 'cause', {
            value: new Error('connection reset'),
        });
        const error = new Error('WebDriver navigation failed');
        Object.defineProperty(error, 'cause', {value: nestedCause});
        throw Object.assign(
            error,
            {
                url: new URL('https://example.test/driver-failure?step=1'),
                opts: {
                    jar: new RequestJar(),
                    signal: new AbortController().signal,
                    headers: {authorization: 'secret'},
                },
                details: {step: 1},
            },
        );
    }

    kill() {
        /* empty */
    }
}

export default (_config: any) => new SyncPlugin();

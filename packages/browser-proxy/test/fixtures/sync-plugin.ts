class SyncPlugin {
    click(_applicant: string, argument: any) {
        return argument;
    }

    throwUrlError() {
        throw Object.assign(new Error('WebDriver navigation failed'), {
            url: new URL('https://example.test/driver-failure?step=1'),
        });
    }

    kill() {
        /* empty */
    }
}

export default (_config: any) => new SyncPlugin();

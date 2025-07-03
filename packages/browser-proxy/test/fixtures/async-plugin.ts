class AsyncPlugin {
    async click(_applicant: string, argument: any) {
        return argument;
    }

    async kill() {
        /* empty */
    }
}

export default (_config: any) => new AsyncPlugin();

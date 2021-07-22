class AsyncPlugin {
    async click(applicant, argument) {
        return argument;
    }

    async kill() {
        /* empty */
    }
}

export default (config) => new AsyncPlugin();

class AsyncPlugin {
    async click(applicant, argument) {
        return  argument;
    }

    async kill() {

    }
}

export default (config) => new AsyncPlugin();

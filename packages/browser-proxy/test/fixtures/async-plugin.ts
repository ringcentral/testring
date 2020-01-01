class AsyncPlugin {
    async click(applicant, argument) {
        return  argument;
    }

    async kill() {

    }
}

// eslint-disable-next-line import/no-default-export
export default (config) => new AsyncPlugin();

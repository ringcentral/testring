class SyncPlugin {
    click(applicant, argument) {
        return argument;
    }

    kill() {
        /* empty */
    }
}

export default (config) => new SyncPlugin();

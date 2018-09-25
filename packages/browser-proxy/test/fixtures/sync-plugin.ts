class SyncPlugin {
    click(applicant, argument) {
        return  argument;
    }

    kill() {

    }
}

export default (config) => new SyncPlugin();

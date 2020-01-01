class SyncPlugin {
    click(applicant, argument) {
        return  argument;
    }

    kill() {

    }
}

// eslint-disable-next-line import/no-default-export
export default (config) => new SyncPlugin();

class SyncPlugin {
    click(_applicant: string, argument: any) {
        return argument;
    }

    kill() {
        /* empty */
    }
}

export default (_config: any) => new SyncPlugin();

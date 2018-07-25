export class Hook {
    private writeHooks: Map<string, Function> = new Map();

    private readHooks: Map<string, Function> = new Map();

    private generateError(pluginName: string, error: Error) {
        const generatedError = new Error(`Plugin ${pluginName} failed: ${error.message}`);

        generatedError.stack = error.stack;

        return error;
    }

    public writeHook(pluginName: string, modifier: Function) {
        this.writeHooks.set(pluginName, modifier);
    }

    public readHook(pluginName: string, reader: Function) {
        this.readHooks.set(pluginName, reader);
    }

    public async callHooks(...data: Array<any>) {
        const { writeHooks, readHooks } = this;

        let dataArguments = data;

        for (const [key, hook] of writeHooks) {
            try {
                dataArguments = [
                    await hook(...dataArguments),
                    ...dataArguments.slice(1)
                ];
            } catch (error) {
                throw this.generateError(key, error);
            }
        }

        for (const [key, hook] of readHooks) {
            try {
                await hook(...dataArguments);
            } catch (error) {
                throw this.generateError(key, error);
            }
        }

        return dataArguments[0];
    }
}

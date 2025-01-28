export interface IPluggableModule<T = any> {
    getHook(name: string): T | void;
}

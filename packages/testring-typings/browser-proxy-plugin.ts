
export interface IBrowserProxyPlugin {
    click(selector: string): Promise<void>,
}

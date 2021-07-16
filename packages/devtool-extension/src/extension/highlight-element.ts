export class HighlightElement {
    private htmlBlock: HTMLElement;

    constructor(private rootElement: ShadowRoot) {
        this.createHighlightBlock();
    }

    private createHighlightBlock(): void {
        this.htmlBlock = document.createElement('testring-highlight-block');

        this.htmlBlock.setAttribute('class', 'highlight');

        this.rootElement.appendChild(this.htmlBlock);
    }

    public destroy(): void {
        this.rootElement.removeChild(this.htmlBlock);
    }

    public update(node: HTMLElement): void {
        const coords = node.getBoundingClientRect();
        const width = node.offsetWidth;
        const height = node.offsetHeight;

        Object.assign(this.htmlBlock.style, {
            left: `${coords.left}px`,
            top: `${coords.top}px`,
            width: `${width}px`,
            height: `${height}px`,
        });
    }
}

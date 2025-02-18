import {throttle} from '@testring/utils';

import {HighlightElement} from './highlight-element';

function whichTransitionEvent(document: Document): string | null {
    const el = document.createElement('fakeelement');

    const transitions = {
        transition: 'transitionend',
        WebkitTransition: 'webkitTransitionEnd',
    };

    for (const key in transitions) {
        if (el.style[key] !== undefined) {
            return transitions[key];
        }
    }

    return null;
}

function whichAnimationEvent(document: Document): string | null {
    const el = document.createElement('fakeelement');

    const animations = {
        animation: 'animationend',
        WebkitAnimation: 'webkitAnimationEnd',
    };

    for (const key in animations) {
        if (el.style[key] !== undefined) {
            return animations[key];
        }
    }

    return null;
}

const ROOT_STYLES = {
    position: 'fixed',
    display: 'block',
    padding: '0',
    margin: '0',
    top: '0px',
    left: '0px',
    height: '0px',
    width: '0px',
    outline: 'none',
    'pointer-events': 'none',
    background: 'none',
    overflow: 'visible',
    'z-index': '2147483647',
};

const ROOT_INNER_HTML = `
<style>
    * {
        margin: 0;
        padding: 0;
    }

    .highlight {
        position: absolute;
        outline: 3px solid orange;
        display: block;
    }
</style>`;

export class ElementHighlightController {
    private rootElement: HTMLElement;

    private rootShadowElement: ShadowRoot;

    private xpathSelectors: Set<string> = new Set();

    private highlightElements: Map<HTMLElement, HighlightElement> = new Map();

    private mutationObserver?: MutationObserver;

    private redrawHandler?: () => void;

    private checkElementsHandler?: () => void;

    private rootStyle = ROOT_STYLES;

    private rootInnerHtml = ROOT_INNER_HTML;

    constructor(private window: Window) {
        this.initRootElements();
        this.initObservers();
    }

    private initObservers() {
        const document = this.getDocument();
        const animationEvent = whichAnimationEvent(document);
        const transitionEvent = whichTransitionEvent(document);

        this.redrawHandler = throttle(() => this.redrawHighlights(), 50);
        this.checkElementsHandler = throttle(
            () => this.checkHtmlElements(),
            150,
        );

        this.window.addEventListener('resize', this.redrawHandler);
        animationEvent &&
            document.body.addEventListener(animationEvent, this.redrawHandler);
        transitionEvent &&
            document.body.addEventListener(transitionEvent, this.redrawHandler);

        const config = {
            attributes: true,
            childList: true,
            subtree: true,
        };

        this.mutationObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'attributes') {
                    (this as any).redrawHandler();
                } else if (mutation.type === 'childList') {
                    (this as any).checkElementsHandler();
                }
            }
        });

        this.mutationObserver.observe(document.body, config);
    }

    private getImportantStyleAttr(): string {
        const rootStyle = this.rootStyle;

        const styles: string[] = [];

        for (const prop in rootStyle) {
            // safety call on guest page browser
            if (Object.prototype.hasOwnProperty.call(rootStyle, prop)) {
                styles.push(`${prop}: ${rootStyle[prop]} !important`);
            }
        }

        return styles.join(';');
    }

    private getDocument(): Document {
        return this.window.document;
    }

    private initRootElements(): void {
        const document = this.getDocument();

        this.rootElement = document.createElement('testring-highlight-holder');

        this.rootElement.setAttribute('style', this.getImportantStyleAttr());

        this.rootShadowElement = this.rootElement.attachShadow({
            mode: 'closed',
        });
        this.rootShadowElement.innerHTML = this.rootInnerHtml;

        document.body.appendChild(this.rootElement);
    }

    private reselectElements(): Set<HTMLElement> {
        let elements: HTMLElement[] = [];

        for (const xpath of this.xpathSelectors) {
            elements = elements.concat(this.getElementByXPath(xpath));
        }

        return new Set<HTMLElement>(elements);
    }

    private checkHtmlElements(): void {
        const document = this.getDocument();
        const selectedElements = this.reselectElements();
        const unlinkedHighlights: HighlightElement[] = [];
        const addedElements: HTMLElement[] = [];

        for (const htmlElement of selectedElements) {
            if (!this.highlightElements.has(htmlElement)) {
                addedElements.push(htmlElement);
            }
        }

        for (const [htmlElement, highlightElement] of this.highlightElements) {
            if (
                !document.body.contains(htmlElement) ||
                !selectedElements.has(htmlElement)
            ) {
                unlinkedHighlights.push(highlightElement);
                this.highlightElements.delete(htmlElement);
            }
        }

        for (const htmlElement of addedElements) {
            if (unlinkedHighlights.length > 0) {
                const usedHighlight =
                    unlinkedHighlights.shift() as HighlightElement;

                this.highlightElements.set(htmlElement, usedHighlight);

                usedHighlight.update(htmlElement);
            } else {
                this.addHighlight(htmlElement);
            }
        }

        for (const usedHighlight of unlinkedHighlights) {
            usedHighlight.destroy();
        }
    }

    private redrawHighlights(): void {
        for (const [htmlElement, highlightElement] of this.highlightElements) {
            highlightElement.update(htmlElement);
        }
    }

    private addHighlight(element: HTMLElement): void {
        if (!this.highlightElements.has(element)) {
            const highlightElement = new HighlightElement(
                this.rootShadowElement,
            );

            highlightElement.update(element);

            this.highlightElements.set(element, highlightElement);
        }
    }

    private getElementByXPath(xpath): HTMLElement[] {
        const document = this.getDocument();
        const elements = document.evaluate(
            xpath,
            document,
            null,
            XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
            null,
        );
        if (elements.snapshotLength > 0) {
            const arr: Node[] = [];

            for (let i = 0, len = elements.snapshotLength; i < len; i++) {
                arr.push(elements.snapshotItem(i) as Node);
            }

            return arr.filter(
                (element) => element instanceof HTMLElement,
            ) as HTMLElement[];
        }

        return [];
    }

    public destroy(): void {
        const document = this.getDocument();
        const animationEvent = whichAnimationEvent(document);
        const transitionEvent = whichTransitionEvent(document);

        document.body.removeChild(this.rootElement);

        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            delete this.mutationObserver;
        }

        if (this.redrawHandler) {
            this.window.removeEventListener('resize', this.redrawHandler);
            animationEvent &&
                document.body.removeEventListener(
                    animationEvent,
                    this.redrawHandler,
                );
            transitionEvent &&
                document.body.removeEventListener(
                    transitionEvent,
                    this.redrawHandler,
                );

            delete this.redrawHandler;
        }

        if (this.checkElementsHandler) {
            delete this.checkElementsHandler;
        }
    }

    public addXpathSelector(xpath: string): void {
        if (!this.xpathSelectors.has(xpath)) {
            this.xpathSelectors.add(xpath);
            const elements = this.getElementByXPath(xpath);

            for (const element of elements) {
                if (element instanceof HTMLElement) {
                    this.addHighlight(element);
                }
            }
        }
    }

    public removeXpathSelector(xpath: string): void {
        if (this.xpathSelectors.has(xpath)) {
            this.xpathSelectors.delete(xpath);
            this.checkHtmlElements();
        }
    }

    public clearHighlights(): void {
        this.xpathSelectors = new Set();
        this.checkHtmlElements();
    }
}

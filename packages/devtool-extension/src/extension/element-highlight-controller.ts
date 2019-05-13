import { throttle } from '@testring/utils';

import { HighlightElement } from './highlight-element';

function whichEvent(eventsObject: { [key: string]: string }, document: Document): string | null {
    let el = document.createElement('fakeelement');

    for (let key in eventsObject) {
        if (el.style[key] !== undefined) {
            return eventsObject[key];
        }
    }

    return null;
}

const whichTransitionCancelEvent = whichEvent.bind(this, {
    'transitioncancel': 'transitioncancel',
});

const whichTransitionEndEvent = whichEvent.bind(this, {
    'transition'      : 'transitionend',
    'WebkitTransition': 'webkitTransitionEnd',
});

const whichAnimationIterationEvent = whichEvent.bind(this, {
    'animationiteration': 'animationiteration',
    'webkitAnimationIteration': 'webkitAnimationIteration',
});

const whichAnimationEndEvent = whichEvent.bind(this, {
    'animation'      : 'animationend',
    'WebkitAnimation': 'webkitAnimationEnd',
});

const ROOT_STYLES = {
    position: 'absolute',
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
        const transitionCancelEvent = whichTransitionCancelEvent(document);
        const transitionEndEvent = whichTransitionEndEvent(document);
        const animationIterationEvent = whichAnimationIterationEvent(document);
        const animationEndEvent = whichAnimationEndEvent(document);

        this.redrawHandler = throttle(() => this.redrawHighlights(), 50);
        this.checkElementsHandler = throttle(() => this.checkHtmlElements(), 150);

        this.window.addEventListener('resize', this.redrawHandler);
        transitionCancelEvent && document.body.addEventListener(transitionCancelEvent, this.redrawHandler);
        transitionEndEvent && document.body.addEventListener(transitionEndEvent, this.redrawHandler);
        animationIterationEvent && document.body.addEventListener(animationIterationEvent, this.redrawHandler);
        animationEndEvent && document.body.addEventListener(animationEndEvent, this.redrawHandler);

        const config = {
            attributes: true,
            childList: true,
            subtree: true,
        };

        this.mutationObserver = new MutationObserver((mutations) => {
            for (let mutation of mutations) {
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

        for (let prop in rootStyle) {
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

        for (let xpath of this.xpathSelectors) {
            elements = elements.concat(this.getElementByXPath(xpath));
        }

        return new Set<HTMLElement>(elements);
    }

    private checkHtmlElements(): void {
        const document = this.getDocument();
        const selectedElements = this.reselectElements();
        const unlinkedHighlights: HighlightElement[] = [];
        const addedElements: HTMLElement[] = [];

        for (let htmlElement of selectedElements) {
            if (!this.highlightElements.has(htmlElement)) {
                addedElements.push(htmlElement);
            }
        }

        for (let [htmlElement, highlightElement] of this.highlightElements) {
            if (!document.body.contains(htmlElement) || !selectedElements.has(htmlElement)) {
                unlinkedHighlights.push(highlightElement);
                this.highlightElements.delete(htmlElement);
            }
        }

        for (let htmlElement of addedElements) {
            if (unlinkedHighlights.length > 0) {
                let usedHighlight = unlinkedHighlights.shift() as HighlightElement;

                this.highlightElements.set(htmlElement, usedHighlight);

                usedHighlight.update(htmlElement);
            } else {
                this.addHighlight(htmlElement);
            }
        }

        for (let usedHighlight of unlinkedHighlights) {
            usedHighlight.destroy();
        }
    }

    private redrawHighlights(): void {
        for (let [htmlElement, highlightElement] of this.highlightElements) {
            highlightElement.update(htmlElement);
        }
    }

    private addHighlight(element: HTMLElement): void {
        if (!this.highlightElements.has(element)) {
            const highlightElement = new HighlightElement(this.rootShadowElement);

            highlightElement.update(element);

            this.highlightElements.set(element, highlightElement);
        }
    }

    private getElementByXPath(xpath): HTMLElement[] {
        const document = this.getDocument();
        const elements = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        if (elements.snapshotLength > 0) {
            const arr: Node[] = [];

            for (let i = 0, len = elements.snapshotLength; i < len; i++) {
                arr.push(elements.snapshotItem(i));
            }

            return arr.filter(element => element instanceof HTMLElement) as HTMLElement[];
        }

        return [];
    }

    public destroy(): void {
        const document = this.getDocument();

        const transitionCancelEvent = whichTransitionCancelEvent(document);
        const transitionEndEvent = whichTransitionEndEvent(document);
        const animationIterationEvent = whichAnimationIterationEvent(document);
        const animationEndEvent = whichAnimationEndEvent(document);

        document.body.removeChild(this.rootElement);

        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            delete this.mutationObserver;
        }

        if (this.redrawHandler) {
            this.window.removeEventListener('resize', this.redrawHandler);
            transitionCancelEvent && document.body.removeEventListener(transitionCancelEvent, this.redrawHandler);
            transitionEndEvent && document.body.removeEventListener(transitionEndEvent, this.redrawHandler);
            animationIterationEvent && document.body.removeEventListener(animationIterationEvent, this.redrawHandler);
            animationEndEvent && document.body.removeEventListener(animationEndEvent, this.redrawHandler);

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

            for (let element of elements) {
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

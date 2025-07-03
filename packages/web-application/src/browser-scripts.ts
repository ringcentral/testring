/* eslint-disable */
export const simulateJSFieldChangeScript = (xpath: string, value: string, done: (err?: string) => void) => {
    const supportedInputTypes: Record<string, boolean> = {
        color: true,
        date: true,
        datetime: true,
        'datetime-local': true,
        email: true,
        month: true,
        number: true,
        password: true,
        range: true,
        search: true,
        tel: true,
        text: true,
        time: true,
        url: true,
        week: true,
    };

    function isTextNode(el: any): boolean {
        const nodeName = el.nodeName.toLowerCase();

        return (
            nodeName === 'textarea' ||
            (nodeName === 'input' &&
                !!supportedInputTypes[el.getAttribute('type') as string])
        );
    }

    function simulateEvent(el: any, type: string) {
        const oEvent = new CustomEvent(type, {
            bubbles: true,
            cancelable: true,
        });

        el.dispatchEvent(oEvent);
    }

    function simulateKey(el: any, type: string, keyCode: number, key: string) {
        const oEvent = new KeyboardEvent(type, {
            bubbles: true,
            cancelable: true,
            key,
        });

        // Chromium Hack
        Object.defineProperty(oEvent, 'keyCode', {
            get() {
                return (this as any).keyCodeVal;
            },
        });
        Object.defineProperty(oEvent, 'which', {
            get() {
                return (this as any).keyCodeVal;
            },
        });

        (oEvent as any).keyCodeVal = keyCode;

        el.dispatchEvent(oEvent);
    }

    function getElementByXPath(xpath: string): any {
        const element = document.evaluate(
            xpath,
            document,
            null,
            XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
            null,
        );
        if (element.snapshotLength > 0) {
            return element.snapshotItem(0) as any;
        }

        return null;
    }

    try {
        (function (el: any) {
            if (el) {
                el.focus();

                if (isTextNode(el)) {
                    simulateKey(el, 'keydown', 8, 'Backspace');
                    simulateKey(el, 'keypress', 8, 'Backspace');
                    simulateKey(el, 'keyup', 8, 'Backspace');
                }

                el.value = value;
                simulateEvent(el, 'input');
                simulateEvent(el, 'change');
                done();
            } else {
                throw Error(`Element ${xpath} not found.`);
            }
        })(getElementByXPath(xpath));
    } catch (e: any) {
        done(`${e.message} ${xpath}`);
    }
};

export const getOptionsPropertyScript = (xpath: string, prop: string, done: (result?: any) => void) => {
    function getElementByXPath(xpath: string): any {
        const element = document.evaluate(
            xpath,
            document,
            null,
            XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
            null,
        );

        if (element.snapshotLength > 0) {
            return element.snapshotItem(0) as any;
        }

        return null;
    }

    try {
        const element = getElementByXPath(xpath);

        if (element && element.tagName.toLowerCase() === 'select') {
            const texts: Array<any> = [];

            for (let i = 0, len = element.options.length; i < len; i++) {
                texts.push(element.options[i][prop]);
            }

            done(texts);
        } else {
            throw Error('Element not found');
        }
    } catch (e: any) {
        throw Error(`${e.message} ${xpath}`);
    }
};

export const scrollIntoViewCallScript = (
    xpath: string,
    topOffset: number,
    leftOffset: number,
    done: (err?: string) => void,
) => {
    function getElementByXPath(xpath: string): any {
        const element = document.evaluate(
            xpath,
            document,
            null,
            XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
            null,
        );

        if (element.snapshotLength > 0) {
            return element.snapshotItem(0) as any;
        }

        return null;
    }

    function isScrollable(el: any): boolean {
        const hasScrollableContent = el.scrollHeight > el.clientHeight;

        const overflowYStyle = window.getComputedStyle(el).overflowY;
        const isOverflowHidden = overflowYStyle.indexOf('hidden') !== -1;

        return hasScrollableContent && !isOverflowHidden;
    }

    function getScrollableParent(el: any): any {
        return !el || el === document.scrollingElement || document.body
            ? document.scrollingElement || document.body
            : isScrollable(el)
            ? el
            : getScrollableParent(el.parentNode);
    }

    try {
        const element = getElementByXPath(xpath);
        const parent = getScrollableParent(element);

        if (element) {
            element.scrollIntoView();
            parent.scrollBy(leftOffset, topOffset);
            setTimeout(done, 200); // Gives browser some time to update values
        } else {
            done('Element not found');
        }
    } catch (err: any) {
        done(`${err.message} ${xpath}`);
    }
};

export const scrollIntoViewIfNeededCallScript = (
    xpath: string,
    topOffset: number,
    leftOffset: number,
    done: (err?: string) => void,
) => {
    function getElementByXPath(xpath: string): any {
        const element = document.evaluate(
            xpath,
            document,
            null,
            XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
            null,
        );

        if (element.snapshotLength > 0) {
            return element.snapshotItem(0) as any;
        }

        return null;
    }

    function isScrollable(el: any): boolean {
        const hasScrollableContent = el.scrollHeight > el.clientHeight;

        const overflowYStyle = window.getComputedStyle(el).overflowY;
        const isOverflowHidden = overflowYStyle.indexOf('hidden') !== -1;

        return hasScrollableContent && !isOverflowHidden;
    }

    function getScrollableParent(el: any): any {
        return !el || el === document.scrollingElement || document.body
            ? document.scrollingElement || document.body
            : isScrollable(el)
            ? el
            : getScrollableParent(el.parentNode);
    }

    function scrollIntoViewIfNeeded(element: any, topOffset: number, leftOffset: number) {
        const parent = element.parentNode;
        const scrollableParent = getScrollableParent(element);
        const parentComputedStyle = window.getComputedStyle(parent, null);
        const parentBorderTopWidth =
            parseInt(parentComputedStyle.getPropertyValue('border-top-width')) +
            topOffset;
        const parentBorderLeftWidth =
            parseInt(
                parentComputedStyle.getPropertyValue('border-left-width'),
            ) + leftOffset;
        const overTop = element.offsetTop - parent.offsetTop < parent.scrollTop;
        const overBottom =
            element.offsetTop -
                parent.offsetTop +
                element.clientHeight -
                parentBorderTopWidth >
            parent.scrollTop + parent.clientHeight;
        const overLeft =
            element.offsetLeft - parent.offsetLeft < parent.scrollLeft;
        const overRight =
            element.offsetLeft -
                parent.offsetLeft +
                element.clientWidth -
                parentBorderLeftWidth >
            parent.scrollLeft + parent.clientWidth;

        if (overTop || overBottom || overLeft || overRight) {
            (element as any).scrollIntoViewIfNeeded();
            scrollableParent.scrollBy(leftOffset, topOffset);
        }
    }

    try {
        const element = getElementByXPath(xpath);

        if (element) {
            if (topOffset || leftOffset) {
                scrollIntoViewIfNeeded(element, topOffset, leftOffset);
            } else {
                (element as any).scrollIntoViewIfNeeded();
            }
            setTimeout(done, 200);
        } else {
            throw new Error('Element not found');
        }
    } catch (err: any) {
        done(`${err.message} ${xpath}`);
    }
};

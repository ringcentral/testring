/* eslint-disable */
export const simulateJSFieldChangeScript = (xpath, value, done) => {
    const supportedInputTypes = {
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

    function isTextNode(el) {
        const nodeName = el.nodeName.toLowerCase();

        return (
            nodeName === 'textarea' ||
            (nodeName === 'input' &&
                supportedInputTypes[el.getAttribute('type')])
        );
    }

    function simulateEvent(el, type) {
        const oEvent = new CustomEvent(type, {
            bubbles: true,
            cancelable: true,
        });

        el.dispatchEvent(oEvent);
    }

    function simulateKey(el, type, keyCode, key) {
        const oEvent = new KeyboardEvent(type, {
            bubbles: true,
            cancelable: true,
            key,
        });

        // Chromium Hack
        Object.defineProperty(oEvent, 'keyCode', {
            get() {
                return this.keyCodeVal;
            },
        });
        Object.defineProperty(oEvent, 'which', {
            get() {
                return this.keyCodeVal;
            },
        });

        (oEvent as any).keyCodeVal = keyCode;

        el.dispatchEvent(oEvent);
    }

    function getElementByXPath(xpath) {
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
        (function (el) {
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
    } catch (e) {
        done(`${e.message} ${xpath}`);
    }
};

export const getOptionsPropertyScript = (xpath, prop, done) => {
    function getElementByXPath(xpath) {
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
    } catch (e) {
        throw Error(`${e.message} ${xpath}`);
    }
};

export const scrollIntoViewCallScript = (
    xpath,
    topOffset,
    leftOffset,
    done,
) => {
    // eslint-disable-next-line sonarjs/no-identical-functions
    function getElementByXPath(xpath) {
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

    function isScrollable(el) {
        const hasScrollableContent = el.scrollHeight > el.clientHeight;

        const overflowYStyle = window.getComputedStyle(el).overflowY;
        const isOverflowHidden = overflowYStyle.indexOf('hidden') !== -1;

        return hasScrollableContent && !isOverflowHidden;
    }

    function getScrollableParent(el) {
        // eslint-disable-next-line no-nested-ternary
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
    } catch (err) {
        done(`${err.message} ${xpath}`);
    }
};

export const scrollIntoViewIfNeededCallScript = (
    xpath,
    topOffset,
    leftOffset,
    done,
) => {
    // eslint-disable-next-line sonarjs/no-identical-functions
    function getElementByXPath(xpath) {
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

    // eslint-disable-next-line sonarjs/no-identical-functions
    function isScrollable(el) {
        const hasScrollableContent = el.scrollHeight > el.clientHeight;

        const overflowYStyle = window.getComputedStyle(el).overflowY;
        const isOverflowHidden = overflowYStyle.indexOf('hidden') !== -1;

        return hasScrollableContent && !isOverflowHidden;
    }

    // eslint-disable-next-line sonarjs/no-identical-functions
    function getScrollableParent(el) {
        // eslint-disable-next-line no-nested-ternary
        return !el || el === document.scrollingElement || document.body
            ? document.scrollingElement || document.body
            : isScrollable(el)
            ? el
            : getScrollableParent(el.parentNode);
    }

    function scrollIntoViewIfNeeded(element, topOffset, leftOffset) {
        const parent = element.parentNode;
        const scrollableParent = getScrollableParent(element);
        const parentComputedStyle = window.getComputedStyle(parent, null);
        /* eslint-disable max-len */
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
        /* eslint-enable max-len */

        if (overTop || overBottom || overLeft || overRight) {
            element.scrollIntoViewIfNeeded();
            scrollableParent.scrollBy(leftOffset, topOffset);
        }
    }

    try {
        const element = getElementByXPath(xpath);

        if (element) {
            if (topOffset || leftOffset) {
                scrollIntoViewIfNeeded(element, topOffset, leftOffset);
            } else {
                element.scrollIntoViewIfNeeded();
            }
            setTimeout(done, 200);
        } else {
            throw new Error('Element not found');
        }
    } catch (err) {
        done(`${err.message} ${xpath}`);
    }
};

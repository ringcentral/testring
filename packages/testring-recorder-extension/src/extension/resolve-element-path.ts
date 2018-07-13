const DEFAULT_IDENTIFIER = 'data-test-automation-id';

const composePath = (element: Element, path: Array<Element> = []): Array<Element> => {
    const nextPath = [ ...path, element ];

    if (!element.parentElement) {
        return nextPath;
    }

    return composePath(element.parentElement, nextPath);
};

const getEventComposedPath = (event: any): Array<Element> => {
    if (event.path) {
        return event.path;
    } else if (event.composedPath) {
        return event.composedPath();
    }

    return composePath(event.target);
};

const filterPathAutomated = (path: Array<Element>): Array<Element> => {
    return path.filter((element) => {
        return element instanceof Element && element.hasAttribute(DEFAULT_IDENTIFIER);
    });
};

const makeXpath = (path: Array<Element>): string => {
    return path.reduce((path, node) => {
        if (node.hasAttribute(DEFAULT_IDENTIFIER)) {
            const id = node.getAttribute(DEFAULT_IDENTIFIER);

            path = `//*[@${DEFAULT_IDENTIFIER}='${id}']` + path;
        }

        return path;
    }, '');
};

export const resolveElementPath = (event: Event): string => {
    if (!event.isTrusted) {
        throw new Error('Event is not evoked by user');
    }

    const path = getEventComposedPath(event);
    const automationPath = filterPathAutomated(path);

    return makeXpath(automationPath);
};

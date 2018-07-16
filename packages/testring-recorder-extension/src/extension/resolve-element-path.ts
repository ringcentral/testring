import { ElementPath, TEST_ELEMENT_IDENTIFIER } from '@testring/types';

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
        return element instanceof Element && element.hasAttribute(TEST_ELEMENT_IDENTIFIER);
    });
};

const makePath = (path: Array<Element>): ElementPath => {
    return path.reduce((path, node) => {
        const id = node.getAttribute(TEST_ELEMENT_IDENTIFIER);

        if (id) {
            path.push({ id });
        }

        return path;
    }, [] as ElementPath);
};

export const resolveElementPath = (event: Event): ElementPath | void => {
    if (!event.isTrusted) {
        throw new Error('Event is not evoked by user');
    }

    const path = getEventComposedPath(event);
    const automationPath = filterPathAutomated(path);

    if (automationPath.length > 0) {
        return makePath(automationPath);
    }
};

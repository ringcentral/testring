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

const makePath = (path: Array<Element>, attribute: string = TEST_ELEMENT_IDENTIFIER): ElementPath => {
    return path.reduce((path, node) => {
        if (!(node instanceof Element)) {
            return path;
        }

        const id = node.getAttribute(attribute);

        if (id) {
            path.push({ id });
        }

        return path;
    }, [] as ElementPath);
};

export const resolveElementPath = (event: Event, attribute: string): ElementPath | void => {
    if (!event.isTrusted) {
        throw new Error('Event is not evoked by user');
    }

    const path = getEventComposedPath(event);
    const testPath = makePath(path, attribute);

    if (testPath.length > 0) {
        return testPath;
    }
};

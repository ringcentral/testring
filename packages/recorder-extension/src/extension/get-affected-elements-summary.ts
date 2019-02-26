import { ElementSummary } from '@testring/types';

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

const getElementsSummary = (elements: Array<Element>): ElementSummary[] => {
    elements = elements.filter(({ tagName, attributes }) => tagName && attributes);

    return elements.map(({ tagName, attributes }) => {
        const attributesSummary = Array.from(attributes).map(({ name, value }) => {
            return {
                name,
                value,
            };
        });

        return { tagName, attributes: attributesSummary };
    });
};

export const getAffectedElementsSummary = (event: Event): ElementSummary[] | void => {
    if (!event.isTrusted) {
        throw new Error('Event is not evoked by user');
    }

    const elements = getEventComposedPath(event);
    const elementsSummary = getElementsSummary(elements);

    if (elementsSummary.length > 0) {
        return elementsSummary;
    }
};

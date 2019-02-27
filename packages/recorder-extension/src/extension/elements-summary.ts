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

export const getElementsSummary = (elements: Array<Element>, withChildren: boolean = true): ElementSummary[] => {
    elements = elements.filter(({ tagName, attributes }) => tagName && attributes);

    // @ts-ignore
    return elements.map(({ tagName, attributes, innerText, value, children }) => {
        const attributesSummary = {};
        Array.from(attributes).forEach(({ name, value }) => attributesSummary[name] = value);

        let childrenSummary;

        if (withChildren) {
            childrenSummary = getElementsSummary(Array.from(children));
        }

        return { tagName, innerText, value, attributes: attributesSummary, children: childrenSummary };
    });
};

export const getAffectedElementsSummary = (event: Event): ElementSummary[] | void => {
    if (!event.isTrusted) {
        throw new Error('Event is not evoked by user');
    }

    const affectedElements = getEventComposedPath(event);
    const affectedElementsSummary = getElementsSummary(affectedElements, false);

    if (affectedElementsSummary.length > 0) {
        return affectedElementsSummary;
    }
};


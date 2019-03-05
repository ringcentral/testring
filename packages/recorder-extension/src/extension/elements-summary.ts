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
    return elements
        .filter(({ tagName, attributes }) => tagName && attributes)
        // @ts-ignore
        .map(({ tagName, attributes, innerText, value, children }) => {
            const attributesSummary = {};
            Array.from(attributes).forEach(({ name, value }) => attributesSummary[name] = value);

            const elementSummary: ElementSummary = { tagName, value, attributes: attributesSummary };

            if (withChildren) {
                elementSummary.children = getElementsSummary(Array.from(children));
            }

            if (children.length === 0) {
                elementSummary.innerText = innerText;
            }

            return elementSummary;
    });
};

export const getAffectedElementsSummary = (event: Event): ElementSummary[] | void => {
    if (!event.isTrusted) {
        throw new Error('Event is not evoked by user');
    }

    const affectedElements = getEventComposedPath(event);
    const affectedElementsSummary = getElementsSummary(affectedElements, false).reverse();

    if (affectedElementsSummary.length > 0) {
        return affectedElementsSummary;
    }
};


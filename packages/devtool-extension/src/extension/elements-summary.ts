import {ElementSummary} from '@testring/types';

const composePath = (
    element: HTMLElement,
    path: Array<HTMLElement> = [],
): Array<HTMLElement> => {
    const nextPath = [...path, element];

    if (!element.parentElement) {
        return nextPath;
    }

    return composePath(element.parentElement, nextPath);
};

const getEventComposedPath = (event: any): Array<HTMLElement> => {
    if (event.path) {
        return event.path;
    } else if (event.composedPath) {
        return event.composedPath();
    }

    return composePath(event.target);
};

export const getElementsSummary = (
    elements: Array<HTMLElement>,
    withChildren = true,
): ElementSummary[] => {
    return elements
        .filter(({tagName, attributes}) => tagName && attributes)
        .map((element) => {
            let value;
            const {tagName, attributes, innerText, children} = element;

            if (element instanceof HTMLInputElement) {
                value = element.value;
            }

            const attributesSummary = {};
            Array.from(attributes).forEach(
                (attr) => (attributesSummary[attr.name] = attr.value),
            );

            const elementSummary: ElementSummary = {
                tagName,
                value,
                attributes: attributesSummary,
            };

            if (withChildren) {
                const childrenArray = Array.from(
                    children,
                ) as Array<HTMLElement>;
                elementSummary.children = getElementsSummary(childrenArray);
            }

            if (children.length === 0) {
                elementSummary.innerText = innerText;
            }

            return elementSummary;
        });
};

export const getAffectedElementsSummary = (
    event: Event,
): ElementSummary[] | void => {
    if (!event.isTrusted) {
        throw new Error('Event is not evoked by user');
    }

    const affectedElements = getEventComposedPath(event);
    const affectedElementsSummary = getElementsSummary(
        affectedElements,
        false,
    ).reverse();

    if (affectedElementsSummary.length > 0) {
        return affectedElementsSummary;
    }
};

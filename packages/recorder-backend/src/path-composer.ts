import { ElementSummary } from '@testring/types';

export class PathComposer {
    private targetAttribute: string;

    constructor(attribute: string) {
        this.targetAttribute = attribute;
    }

    getPathByAttribute(elementsSummary: ElementSummary[]) {
        return elementsSummary
            .map((elemensSummary) => elemensSummary.attributes[this.targetAttribute])
            .filter(attribute => attribute !== undefined)
            .join('.');
    }
}

import {ElementSummary} from '@testring-dev/types';

export class PathComposer {
    constructor(private targetAttribute: string) {}

    getPath(elementsSummary: ElementSummary[]) {
        return elementsSummary
            .map(
                (elemensSummary) =>
                    elemensSummary.attributes[this.targetAttribute],
            )
            .filter((attribute) => attribute !== undefined)
            .join('.');
    }
}

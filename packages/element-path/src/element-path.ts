import {
    hasOwn, isInteger,
    keysCount
} from './utils';

export type FlowFn = () => any;

export type FlowsFnObject = {
    [method: string]: FlowFn;
    [method: number]: FlowFn;
};

export type FlowsObject = {
    [key: string]: FlowsFnObject;
    [key: number]: FlowsFnObject;
};

export type SearchMaskPrimitive = number | string;

export type SearchMaskObject = {
    anyKey?: boolean;
    suffix?: string;
    prefix?: string;
    containsKey?: string;
    exactKey?: string;
    parts?: string[];
};

export type SearchTextObject = {
    containsText?: string;
    equalsText?: string;
};

export type SearchSubQueryObject = {
    subQuery?: SearchMaskObject & SearchTextObject;
};

export type SearchObject = SearchMaskObject & SearchTextObject & SearchSubQueryObject & {
    index?: number;
    xpath?: string;
    id?: string;
};

export type NodePath = {
    query?: SearchObject;
    name?: string;
    xpath: string;
    isRoot: boolean;
};

export type XpathLocator = {
    id: string;
    xpath: string;
    parent?: string;
};

export class ElementPath {
    private readonly REGEXP = {
        QUERY_RE: /^(\*?[^{(=]*\*?)?(=?{([^}]*)})?(\(([^)]*)\))?$/,
        SUB_QUERY_RE: /^(\*?[^{=]*\*?)(=?{([^}]*)})?$/,
    };
    private readonly GENERIC_TYPE = Symbol('@generic');

    private readonly flows: FlowsObject;
    private readonly attributeName: string;
    private readonly searchMask: SearchMaskPrimitive | null;
    private readonly searchOptions: SearchObject;
    private readonly parent: ElementPath | null;

    constructor(options: {
        flows?: FlowsObject,
        searchMask?: SearchMaskPrimitive,
        searchOptions?: SearchObject,
        attributeName?: string,
        parent?: ElementPath,
    } = {}) {
        this.flows = options.flows || {};

        this.attributeName = options.attributeName || 'data-test-automation-id';

        this.parent = options.parent || null;

        if (options.searchOptions && this.searchMask !== undefined) {
            throw Error('Only one search parameter allowed');
        } else if (
           (options.searchMask === undefined || options.searchMask === null) &&
            options.searchOptions !== undefined
        ) {
            this.searchOptions = options.searchOptions;
            if (Object.keys(options.searchOptions).length === 1 && typeof options.searchOptions.exactKey === 'string') {
                this.searchMask = options.searchOptions.exactKey;
            } else {
                this.searchMask = null;
            }
        } else if (options.searchMask !== undefined && options.searchMask !== null) {
            this.searchOptions = this.parseQueryKey(options.searchMask);
            this.searchMask = options.searchMask;
        } else {
            this.searchOptions = this.parseQueryKey('root');
            this.searchMask = null;
        }
    }

    /*
        Search mask parse helpers
     */

    // noinspection JSMethodCanBeStatic
    protected parseMask(mask: string): SearchMaskObject {
        let maskFilter: SearchMaskObject = {};

        if (mask === '*' || mask === '' || mask === undefined) { // * || empty
            return {
                anyKey: true
            };
        }

        const searchStr = mask.replace(/^\*/, '').replace(/\*$/, '');
        const suffixed = mask[0] === '*';
        const prefixed = mask[mask.length - 1] === '*';
        const hasInnerSplit = searchStr.indexOf('*') > -1;

        if (hasInnerSplit && (prefixed || suffixed)) { // *foo*bar*
            throw new TypeError('Masks prefix, suffix and inner ask are not supported');
        } else if (suffixed && !prefixed) { // *foo
            maskFilter.suffix = searchStr;
        } else if (!suffixed && prefixed) { // foo*
            maskFilter.prefix = searchStr;
        } else if (suffixed && prefixed) { // *foo*
            maskFilter.containsKey = searchStr;
        } else if (!suffixed && !prefixed && !hasInnerSplit) { // foo
            maskFilter.exactKey = searchStr;
        } else if (hasInnerSplit) { // foo*bar
            let parts = searchStr.split('*');

            if (parts.length === 2) {
                maskFilter.parts = parts;
            } else { // foo*bar*baz...
                throw new TypeError('Masks with more than two parts are not supported');
            }
        }

        return maskFilter;
    }

    // noinspection JSMethodCanBeStatic
    protected parseText(textMask: string): SearchTextObject {
        if (textMask === '{}') {
            throw new TypeError('Text search param can not be empty');
        }

        if (textMask[0] === '{') {
            return {
                containsText: textMask.slice(1, -1)
            };
        } else if (textMask.indexOf('={') === 0) {
            return {
                equalsText: textMask.slice(2, -1)
            };
        }

        return {};
    }

    protected parseSubQuery(subQuery: string): SearchSubQueryObject {
        if (subQuery === '()') {
            throw new TypeError('Sub Query can not be empty');
        }

        const query = subQuery.slice(1, -1);
        const parts = query.match(this.REGEXP.SUB_QUERY_RE) || [];
        const mask = parts[1];
        const textSearch = parts[2];

        return {
            subQuery: Object.assign(
                {},
                this.parseMask(mask),
                textSearch === undefined ? undefined : this.parseText(textSearch)
            )
        };
    }

    protected parseQueryKey(key): SearchObject {
        const parts = key.match(this.REGEXP.QUERY_RE);
        const mask = parts[1];
        const textSearch = parts[2];
        const subQueryPart = parts[4];

        if (mask === undefined && textSearch === undefined && subQueryPart !== undefined) {
            throw new TypeError('Selector can not contain only sub query');
        }

        return Object.assign(
            {},
            this.parseMask(mask),
            textSearch === undefined ? undefined : this.parseText(textSearch),
            subQueryPart === undefined ? undefined : this.parseSubQuery(subQueryPart)
        );
    }

    /*
        Search get xpath mask
     */
    protected getAttributeName(): string {
        return this.attributeName;
    }

    protected getMaskXpathParts(searchOptions: {
        anyKey?: boolean,
        prefix?: string,
        suffix?: string,
        exactKey?: string,
        containsKey?: string,
        parts?: string[],
    }): string[] {
        const attr = this.getAttributeName();
        let conditions: string[] = [];

        if (searchOptions.anyKey === true) { // *
            conditions.push(`@${attr}`);
        } else if (searchOptions.prefix !== undefined) { // foo*
            conditions.push(`starts-with(@${attr}, '${searchOptions.prefix}')`);
        } else if (searchOptions.suffix !== undefined) { // *foo
            // Emulate ends-with method for xpath 1.0
            // eslint-disable-next-line max-len
            conditions.push(`substring(@${attr}, string-length(@${attr}) - string-length('${searchOptions.suffix}') + 1) = '${searchOptions.suffix}'`);
        } else if (searchOptions.parts !== undefined) { // foo*bar
            const start = searchOptions.parts[0];
            const end = searchOptions.parts[1];

            // Emulate ends-with method for xpath 1.0
            conditions.push(`substring(@${attr}, string-length(@${attr}) - string-length('${end}') + 1) = '${end}'`);
            conditions.push(`starts-with(@${attr}, '${start}')`);
            conditions.push(`string-length(@${attr}) > ${start.length + end.length}`);
        } else if (searchOptions.exactKey !== undefined) { // foo
            conditions.push(`@${attr}='${searchOptions.exactKey}'`);
        } else if (searchOptions.containsKey !== undefined) { // *foo*
            conditions.push(`contains(@${attr},'${searchOptions.containsKey}')`);
        }

        return conditions;
    }

    // noinspection JSMethodCanBeStatic
    protected getTextXpathParts(searchOptions: {
        containsText?: string,
        equalsText?: string,
    }): string[] {
        let conditions: string[] = [];

        if (searchOptions.containsText) {
            conditions.push(`contains(., "${searchOptions.containsText}")`);
        } else if (searchOptions.equalsText) {
            conditions.push(`. = "${searchOptions.equalsText}"`);
        }

        return conditions;
    }

    protected getSearchQueryXpath(searchOptions: SearchObject = this.searchOptions): string {
        let conditions: string[] = [];
        let xpath = '';

        conditions.push(...this.getMaskXpathParts(searchOptions));

        if (searchOptions.subQuery) {
            const { subQuery } = searchOptions;
            const subChildConditions: string[] = [
                ...this.getMaskXpathParts(subQuery),
                ...this.getTextXpathParts(subQuery)
            ];

            conditions.push(`descendant::*[${subChildConditions.join(' and ')}]`);
        }

        conditions.push(...this.getTextXpathParts(searchOptions));

        if (hasOwn(searchOptions, 'exactKey') && keysCount(searchOptions) === 1) {
            xpath += `//*[${conditions[0]}]`;
        } else {
            xpath += `/descendant::*[${conditions.join(' and ')}]`;
        }

        if (typeof searchOptions.index === 'number') {
            xpath += `[position() = ${searchOptions.index + 1}]`;
        }

        return xpath;
    }


    /*
        Public methods
     */
    private queryToString(query): string {
        let key = '';

        if (query.prefix) {
            key += `${query.prefix}*`;
        } else if (query.suffix) {
            key += `*${query.suffix}`;
        } else if (query.containsKey) {
            key += `*${query.containsKey}*`;
        } else if (query.exactKey) {
            key += query.exactKey;
        } else if (query.parts) {
            key += query.parts.join('*');
        } else if (query.anyKey) {
            key += '*';
        }

        if (query.containsText) {
            key += `{${query.containsText}}`;
        } else if (query.equalsText) {
            key += `={${query.equalsText}}`;
        }

        if (query.subQuery) {
            key += `(${this.queryToString(query.subQuery)})`;
        }

        return key;
    }

    public getReversedChain(withRoot: boolean = true): string {
        let parts = this.getElementPathChain().reduce((memo: string[], node: any): string[] => {
            if (node.isRoot) {
                if (withRoot) {
                    memo.push(node.name);
                }
            } else if (node.query && node.query.xpath) {
                memo.push(`.xpath("${node.query.xpath}")`);
            } else {
                const queryLength = Object.keys(node.query).length;

                if (
                    (node.query.exactKey && queryLength === 1)
                    || (hasOwn(node.query, 'exactKey') && hasOwn(node.query, 'index') && queryLength === 2)
                ) {
                    memo.push(`.${node.query.exactKey}`);
                } else {
                    memo.push(`["${this.queryToString(node.query)}"]`);
                }

                if (hasOwn(node.query, 'index')) {
                    memo.push(`[${node.query.index}]`);
                }
            }

            return memo;
        }, []);

        return parts.join('');
    }

    public getElementPathChain(): NodePath[] {
        const isRoot = this.parent === null;

        if (isRoot) {
            return [{
                isRoot,
                name: 'root',
                xpath: this.getSearchQueryXpath()
            }];
        } else if (this.searchOptions.xpath !== undefined) {
            return (this.getParentElementPathChain() || []).concat([{
                isRoot,
                query: this.searchOptions,
                xpath: this.searchOptions.xpath
            }]);
        } else {
            return (this.getParentElementPathChain() || []).concat([{
                isRoot,
                query: this.searchOptions,
                xpath: this.getSearchQueryXpath()
            }]);
        }
    }

    public getParentElementPathChain(): NodePath[] | null {
        if (this.parent) {
            return this.parent.getElementPathChain();
        }

        return null;
    }

    public generateChildByXpath(id: string, xpath: string): ElementPath {
        return new ElementPath({
            flows: this.flows,
            searchOptions: { xpath },
            parent: this
        });
    }

    public generateChildElementPathByOptions(searchOptions: SearchObject): ElementPath {
        if (hasOwn(searchOptions, 'index')) {
            if (hasOwn(this.searchOptions, 'index')) {
                throw Error('Can not select index element from already sliced element');
            }

            if (this.parent === null) {
                throw new TypeError('Root Element is not enumerable');
            }

            return new ElementPath({
                flows: this.flows,
                searchOptions: Object.assign({}, this.searchOptions, searchOptions),
                parent: this.parent
            });
        } else if (hasOwn(this.searchOptions, 'xpath')) {
            if (!hasOwn(this.searchOptions, 'id')) {
                throw Error('No xpath id argument');
            }

            return new ElementPath({
                searchOptions: Object.assign({}, searchOptions),
                flows: this.flows,
                parent: this
            });
        } else {
            return new ElementPath({
                searchOptions: Object.assign({}, searchOptions),
                flows: this.flows,
                parent: this
            });
        }
    }

    public generateChildElementsPath(key: string | number): ElementPath {
        if (isInteger(key)) {
            return this.generateChildElementPathByOptions(Object.assign({}, this.searchOptions, {
                index: +key
            }));
        } else {
            return this.generateChildElementPathByOptions(this.parseQueryKey(`${key}`));
        }
    }

    public generateChildByLocator(locator: XpathLocator): ElementPath {
        if (this.parent !== null && typeof locator.parent === 'string') {
            throw new Error('Method can be called only from root element');
        }

        if (typeof locator.parent === 'string') {
            const genParent = locator.parent.split('.').reduce((memo: ElementPath, key: string) => {
                return memo.generateChildElementsPath(key);
            }, this);

            return genParent.generateChildElementPathByOptions({
                xpath: locator.xpath,
                id: locator.id,
            });
        } else {
            return this.generateChildElementPathByOptions({
                xpath: locator.xpath,
                id: locator.id,
            });
        }
    }

    public hasFlow(key: string | number): boolean {
        return this.searchMask !== null
            && hasOwn(this.flows, this.searchMask)
            && hasOwn(this.flows[this.searchMask], key);
    }

    public getFlow(key: string | number): FlowFn | undefined {
        if (this.searchMask === null) {
            return undefined;
        }

        const flowList = this.flows[this.searchMask];

        if (flowList === undefined) {
            return undefined;
        }

        const flow = flowList[key];

        if (typeof flow === 'function') {
            return flow;
        } else {
            throw new TypeError(`Flow ${key} is not a function`);
        }
    }

    public getFlows(): FlowsFnObject {
        if (this.searchMask && hasOwn(this.flows, this.searchMask)) {
            return this.flows[this.searchMask];
        } else {
            return {};
        }
    }

    public getSearchOptions(): SearchObject {
        return this.searchOptions;
    }

    public getElementType(): string | symbol {
        const searchOptions = this.getSearchOptions();

        if (hasOwn(searchOptions, 'exactKey') && searchOptions.exactKey !== undefined) {
            return searchOptions.exactKey;
        }

        return this.GENERIC_TYPE;
    }

    public toString(allowMultipleNodesInResult: boolean = false): string {
        let xpath = this.getElementPathChain()
            .map((item: { xpath: string }) => item.xpath)
            .join('');

        if (allowMultipleNodesInResult) {
            return xpath;
        } else {
            return `(${xpath})[1]`;
        }
    }
}



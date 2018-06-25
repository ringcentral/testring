import * as path from 'path';
import * as lodash from 'lodash';

const ROOT_DIR = path.normalize(path.join(__dirname, '..', '..'));

const nanoid = require('nanoid');

function getTestDataPath(testPath) {
    const basename = path.basename(testPath, '.js');
    return path.join(path.dirname(testPath), basename + '.testdata.js');
}

function delay(timeout) {
    return new Promise((resolve, reject) => setTimeout(() => resolve(), timeout));
}

function normalizeXpath(xpath, allowMultipleNodesInResult) {
    let result;

    try {
        result = (typeof xpath === 'string') ? query(xpath).toString() : xpath.toString(allowMultipleNodesInResult);
    } catch (e) {
        throw (e);
    }
    return result;
}

function logXpath(xpath) {
    let result = xpath;

    if (xpath === undefined) {
        throw [
            'Path is incorrect, please check that your web test id map is correctly used in your test.',
            'Check the path that is used AFTER the upper mentioned path.'
        ].join('\n');
    } else {
        result = (typeof xpath === 'string') ? xpath : xpath.toString();
    }

    return result;
}

function uid() {
    return nanoid();
}

const ROOTID = 'root';
const TEST_ATTR = 'data-test-automation-id';

class Element {

    private path;

    constructor(rootPath: Array<any> = []) {
        this.path = [...rootPath];
    }

    query(value) {
        if (lodash.isEmpty(value)) {
            throw new Error('Invalid selector');
        }

        const p: Array<any> = [...this.path];

        if (typeof value === 'string') {
            const arr = lodash.compact(value.split('.'));
            const arrRes = arr.map(value => ({
                kind: 'exactly',
                value
            }));

            p.push(...arrRes);
        }

        if (typeof value === 'object') {
            if (typeof value.id !== 'string') {
                throw new Error('Invalid selector');
            }

            p.push({
                kind: 'pattern',
                value
            });
        }

        return new Element(p);
    }

    getNestedElementsWithPrefixContainsText(prefix, text) {
        return this.query({
            id: prefix + '%',
            text: '%' + text + '%'
        });
    }

    getNestedElementsWithPrefixEqualText(prefix, text) {
        return this.query({
            id: prefix + '%',
            text
        });
    }

    getNestedElementsWithPrefix(prefix) {
        return this.query({
            id: prefix + '%'
        });
    }

    getChildren() {
        return new Element([...this.path, { kind: 'children' }]);
    }

    at(value) {
        let p = [...this.path];
        p.push({
            kind: 'index',
            value
        });
        return new Element(p);
    }

    log() {
        let hr: string[] = [];
        this.path.forEach(item => {
            if (item.kind === 'exactly') {
                hr.push(item.value);
            }
            if (item.kind === 'pattern') {
                hr.push(JSON.stringify(item.value));
            }
            if (item.kind === 'index') {
                hr.push('at(' + item.value + ')');
            }
            if (item.kind === 'children') {
                hr.push('at(' + item.value + ')');
            }
        });
        return hr.join('.');
    }

    toString() {
        const stringLiteral = str => {
            if (str.indexOf('\'') > -1) {
                str = str.split('\'').map(s => `'${s}'`).join(',"\'",');
                return `concat(${str})`;
            } else {
                return `'${str}'`;
            }
        };

        let xpathStr = '.';
        this.path.forEach(item => {
            if (item.kind === 'exactly') {
                xpathStr += `/descendant::*[./@${TEST_ATTR} = ${stringLiteral(item.value)}]`;
            }

            if (item.kind === 'pattern') {
                const condition: string[] = [];
                const id = item.value.id;
                const text = item.value.text;
                const normalizedId = stringLiteral(id.replace(/%/g, ''));
                const normalizedText = text && stringLiteral(text.replace(/%/g, ''));

                if ((lodash.first(id) === '%') && (lodash.last(id) === '%')) {
                    condition.push(`contains(./@${TEST_ATTR}, ${normalizedId})`);
                }
                if ((lodash.first(id) === '%') && (lodash.last(id) !== '%')) {
                    condition.push(
                        `substring(./@${TEST_ATTR}, string-length(./@${TEST_ATTR}) - string-length(${normalizedId}) + 1, string-length(./@${TEST_ATTR}) = ${normalizedId}`
                    );
                }
                if ((lodash.first(id) !== '%') && (lodash.last(id) === '%')) {
                    condition.push(`starts-with(./@${TEST_ATTR}, ${normalizedId})`);
                }
                if ((lodash.first(id) !== '%') && (lodash.last(id) !== '%')) {
                    condition.push(`./@${TEST_ATTR} = ${normalizedId}`);
                }
                if (typeof text === 'string') {
                    if ((lodash.first(text) === '%') && (lodash.last(text) === '%')) {
                        condition.push(`descendant-or-self::*[contains(./text(), ${normalizedText})]`);
                    }
                }
                let conditionStr: string = '/descendant::*[' + ((condition.length > 1) ? '(' + condition.join(' and ') + ')' : condition[0]) + ']';
                xpathStr += conditionStr;
            }

            if (item.kind === 'index') {
                xpathStr += `[position() = ${item.value + 1}]`;
            }
            if (item.kind === 'children') {
                xpathStr += '/child::*';
            }
        });

        return xpathStr;
    }
}

function getTestJSONPath(testPath) {
    return path.join(
        path.dirname(testPath),
        path.basename(testPath, '.js') + '.testdata.json'
    );
}

function replaceHomePath(path) {
    return path.replace(/^~\//, ROOT_DIR + '/');
}

function query(value) {
    let el = new Element([{
        kind: 'exactly',
        value: ROOTID
    }]);
    return value ? el.query(value) : el;
}

module.exports = {
    replaceHomePath,
    getTestJSONPath,
    getTestDataPath,
    delay,
    uid,
    Element,
    query,
    normalizeXpath,
    logXpath
};



import {expect} from 'chai';
import {createElementPath} from '../../src';

describe('invalid keys', () => {
    const dummy = () => {
        /* empty */
    };

    const root = createElementPath({
        flows: {
            foo: {
                __path: dummy,
                __flows: dummy,
                __parentPath: dummy,
                __searchOptions: dummy,
                __proxy: dummy,
            },
        },
    });
    const childFoo = root.foo;

    it('.__path flow check', () => {
        const error = () => childFoo.__path;
        expect(error).to.throw(
            'flow function and property __path are conflicts',
        );
    });

    it('.__flows flow check', () => {
        const error = () => childFoo.__flows;
        expect(error).to.throw(
            'flow function and property __flows are conflicts',
        );
    });

    it('.__parentPath flow check', () => {
        const error = () => childFoo.__parentPath;
        expect(error).to.throw(
            'flow function and property __parentPath are conflicts',
        );
    });

    it('.__searchOptions flow check', () => {
        const error = () => childFoo.__searchOptions;
        expect(error).to.throw(
            'flow function and property __searchOptions are conflicts',
        );
    });

    it('.__proxy flow check', () => {
        const error = () => childFoo.__proxy;
        expect(error).to.throw(
            'flow function and property __proxy are conflicts',
        );
    });
});

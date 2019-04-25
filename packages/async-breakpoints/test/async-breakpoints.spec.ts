/// <reference types="mocha" />
import * as chai from 'chai';

import { AsyncBreakpoints, BreakStackError } from '../src';

describe('Async Breakpoints', () => {
    it('No breakpoints set', async () => {
        const asyncBreakpoint = new AsyncBreakpoints();

        await asyncBreakpoint.waitBeforeInstructionBreakpoint();
        await asyncBreakpoint.waitAfterInstructionBreakpoint();
    });

    it('Before instruction breakpoint', async () => {
        const asyncBreakpoint = new AsyncBreakpoints();

        asyncBreakpoint.addBeforeInstructionBreakpoint();
        const breakpoint = asyncBreakpoint.waitBeforeInstructionBreakpoint();
        setTimeout(() => asyncBreakpoint.resolveBeforeInstructionBreakpoint());

        await breakpoint;
    });

    it('Before instruction breakpoint check', async () => {
        const asyncBreakpoint = new AsyncBreakpoints();

        asyncBreakpoint.addBeforeInstructionBreakpoint();

        chai.expect(asyncBreakpoint.isBeforeInstructionBreakpointActive()).to.be.equal(true);
        asyncBreakpoint.resolveBeforeInstructionBreakpoint();
        chai.expect(asyncBreakpoint.isBeforeInstructionBreakpointActive()).to.be.equal(false);
    });


    it('Before break call', (done) => {
        const asyncBreakpoint = new AsyncBreakpoints();

        asyncBreakpoint.addBeforeInstructionBreakpoint();

        asyncBreakpoint.waitBeforeInstructionBreakpoint().catch(err => {
            try {
                chai.expect(err).to.be.instanceOf(BreakStackError);
                done();
            } catch (e) {
                done(e);
            }
        });

        asyncBreakpoint.breakStack();
    });

    it('After instruction breakpoint', async () => {
        const asyncBreakpoint = new AsyncBreakpoints();

        asyncBreakpoint.addAfterInstructionBreakpoint();
        const breakpoint = asyncBreakpoint.waitAfterInstructionBreakpoint();
        setTimeout(() => asyncBreakpoint.resolveAfterInstructionBreakpoint());

        await breakpoint;
    });

    it('After instruction breakpoint check', async () => {
        const asyncBreakpoint = new AsyncBreakpoints();

        asyncBreakpoint.addAfterInstructionBreakpoint();

        chai.expect(asyncBreakpoint.isAfterInstructionBreakpointActive()).to.be.equal(true);
        asyncBreakpoint.resolveAfterInstructionBreakpoint();
        chai.expect(asyncBreakpoint.isAfterInstructionBreakpointActive()).to.be.equal(false);
    });

    it('After break call', (done) => {
        const asyncBreakpoint = new AsyncBreakpoints();

        asyncBreakpoint.addAfterInstructionBreakpoint();

        asyncBreakpoint.waitAfterInstructionBreakpoint().catch(err => {
            try {
                chai.expect(err).to.be.instanceOf(BreakStackError);
                done();
            } catch (e) {
                done(e);
            }
        });

        asyncBreakpoint.breakStack();
    });

    it('Concurrent same breakpoint call', (done) => {
        const asyncBreakpoint = new AsyncBreakpoints();

        asyncBreakpoint.addBeforeInstructionBreakpoint();

        Promise.all([
            asyncBreakpoint.waitBeforeInstructionBreakpoint(),
            asyncBreakpoint.waitBeforeInstructionBreakpoint(),
        ]).then(() => done()).catch(() => done('Not finished'));

        asyncBreakpoint.resolveBeforeInstructionBreakpoint();
        asyncBreakpoint.resolveAfterInstructionBreakpoint();
    });

    it('Concurrent different breakpoint break', (done) => {
        const asyncBreakpoint = new AsyncBreakpoints();

        asyncBreakpoint.addAfterInstructionBreakpoint();

        Promise.all([
            asyncBreakpoint.waitAfterInstructionBreakpoint(),
            asyncBreakpoint.waitAfterInstructionBreakpoint(),
        ]).catch(err => {
            try {
                chai.expect(err).to.be.instanceOf(BreakStackError);
                done();
            } catch (e) {
                done(e);
            }
        });

        asyncBreakpoint.breakStack();
    });

    it('Concurrent different breakpoint call', (done) => {
        const asyncBreakpoint = new AsyncBreakpoints();

        asyncBreakpoint.addBeforeInstructionBreakpoint();
        asyncBreakpoint.addAfterInstructionBreakpoint();

        Promise.all([
            asyncBreakpoint.waitBeforeInstructionBreakpoint(),
            asyncBreakpoint.waitAfterInstructionBreakpoint(),
        ]).then(() => done()).catch(() => done('Not finished'));

        asyncBreakpoint.resolveBeforeInstructionBreakpoint();
        asyncBreakpoint.resolveAfterInstructionBreakpoint();
    });

    it('Concurrent different breakpoint break', (done) => {
        const asyncBreakpoint = new AsyncBreakpoints();

        asyncBreakpoint.addBeforeInstructionBreakpoint();
        asyncBreakpoint.addAfterInstructionBreakpoint();

        Promise.all([
            asyncBreakpoint.waitBeforeInstructionBreakpoint(),
            asyncBreakpoint.waitAfterInstructionBreakpoint(),
        ]).catch(err => {
            try {
                chai.expect(err).to.be.instanceOf(BreakStackError);
                done();
            } catch (e) {
                done(e);
            }
        });

        asyncBreakpoint.breakStack();
    });
});

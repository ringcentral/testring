import { EventEmitter } from 'events';

import { BreakpointsTypes } from './constants';

type HasBreakpointCallback = (state: boolean) => Promise<void> | void;

type ReleaseBreakpointCallback = () => Promise<void> | void;

export default class AsyncBreakpoints extends EventEmitter {
    private breakpoints: Map<BreakpointsTypes, Promise<void>> = new Map();
    private breakpointCallbacks: Map<BreakpointsTypes, ReleaseBreakpointCallback[]> = new Map();

    private resolverEvent = 'resolver';

    constructor() {
        super();
    }

    private addBreakpoint(type: BreakpointsTypes, releaseCallback?: ReleaseBreakpointCallback): Promise<void> {
        if (this.breakpoints.has(type)) {
            return this.breakpoints.get(type) as Promise<void>;
        }

        const breakpoint = new Promise<void>((resolve) => {
            // this.on(this.resolverEvent, () => resolve());
            setTimeout(() => {
                resolve();
            }, 1000);
        });

        this.breakpoints.set(type, breakpoint);

        if (releaseCallback) {
            this.addReleaseCallback(type, releaseCallback);
        }

        return breakpoint;
    }

    private addReleaseCallback(type: BreakpointsTypes, releaseCallback: ReleaseBreakpointCallback) {
        if (this.breakpointCallbacks.has(type)) {
            const callbacks = this.breakpointCallbacks.get(type) as ReleaseBreakpointCallback[];
            this.breakpointCallbacks.set(type, [...callbacks, releaseCallback]);
        } else {
            this.breakpointCallbacks.set(type, [releaseCallback]);
        }
    }

    private async flushReleaseCallbacks(type: BreakpointsTypes) {
        if (this.breakpointCallbacks.has(type)) {
            const callbacks = this.breakpointCallbacks.get(type) as ReleaseBreakpointCallback[];
            this.breakpointCallbacks.delete(type);

            for (let callback of callbacks) {
                await callback();
            }
        }
    }

    async resolveBreakpoint(type: BreakpointsTypes) {
        setImmediate(() => {
            this.emit(this.resolverEvent, type);
        });

        await this.flushReleaseCallbacks(type);
    }

    async waitForBreakpoint(
        type: BreakpointsTypes,
        hasBreakpointCallback: HasBreakpointCallback
    ): Promise<void> {
        if (this.breakpoints.has(type)) {
            await hasBreakpointCallback(true);
            return this.breakpoints.get(type) as Promise<void>;
        } else {
            await hasBreakpointCallback(false);
            return Promise.resolve();
        }
    }

    public addBeforeInstructionBreakpoint(releaseCallback?: ReleaseBreakpointCallback) {
        this.addBreakpoint(BreakpointsTypes.beforeInstruction, releaseCallback);
    }

    public async waitBeforeInstructionBreakpoint(hasBreakpointCallback: HasBreakpointCallback = () => undefined) {
        return this.waitForBreakpoint(
            BreakpointsTypes.beforeInstruction,
            hasBreakpointCallback,
        );
    }

    public resolveBeforeInstructionBreakpoint() {
        this.resolveBreakpoint(BreakpointsTypes.beforeInstruction);
    }

    public addAfterInstructionBreakpoint(releaseCallback?: ReleaseBreakpointCallback) {
        this.addBreakpoint(BreakpointsTypes.afterInstruction, releaseCallback);
    }

    public async waitAfterInstructionBreakpoint(hasBreakpointCallback: HasBreakpointCallback = () => undefined) {
        return this.waitForBreakpoint(
            BreakpointsTypes.afterInstruction,
            hasBreakpointCallback,
        );
    }

    public resolveAfterInstructionBreakpoint() {
        this.resolveBreakpoint(BreakpointsTypes.afterInstruction);
    }
}

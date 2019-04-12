import { EventEmitter } from 'events';

import { BreakpointsTypes } from './constants';

type HasBreakpointCallback = (state: boolean) => Promise<void> | void;

export default class AsyncBreakpoints extends EventEmitter {
    private breakpoints: Map<BreakpointsTypes, Promise<void>> = new Map();

    private resolverEvent = 'resolveEvent';

    constructor() {
        super();
    }

    private addBreakpoint(type: BreakpointsTypes): Promise<void> {
        if (this.breakpoints.has(type)) {
            return this.breakpoints.get(type) as Promise<void>;
        }

        const breakpoint = new Promise<void>((resolve) => {
            const handler = (resolvedType) => {
                if (resolvedType === type) {
                    this.clearBreakpoint(type);
                    resolve();
                    this.off(this.resolverEvent, handler);
                }
            };
            this.on(this.resolverEvent, handler);
        });

        this.breakpoints.set(type, breakpoint);

        return breakpoint;
    }

    private clearBreakpoint(type: BreakpointsTypes) {
        this.breakpoints.delete(type);
    }

    resolveBreakpoint(type: BreakpointsTypes) {
        this.emit(this.resolverEvent, type);
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


    public addBeforeInstructionBreakpoint() {
        this.addBreakpoint(BreakpointsTypes.beforeInstruction);
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

    public isBeforeInstructionBreakpointActive() {
        return this.breakpoints.has(BreakpointsTypes.beforeInstruction);
    }


    public addAfterInstructionBreakpoint() {
        this.addBreakpoint(BreakpointsTypes.afterInstruction);
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

    public isAfterInstructionBreakpointActive() {
        return this.breakpoints.has(BreakpointsTypes.afterInstruction);
    }
}

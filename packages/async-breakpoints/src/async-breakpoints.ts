import { EventEmitter } from 'events';

import { BreakpointsTypes } from './constants';
import { BreakStackError } from './break-stack-error';

type HasBreakpointCallback = (state: boolean) => Promise<void> | void;

export class AsyncBreakpoints extends EventEmitter {
    private breakpoints: Map<BreakpointsTypes, Promise<void>> = new Map();

    private resolverEvent = 'resolveEvent';

    private breakStackEvent = 'breakStack';

    constructor() {
        super();
    }

    private addBreakpoint(type: BreakpointsTypes): Promise<void> {
        if (this.breakpoints.has(type)) {
            return this.breakpoints.get(type) as Promise<void>;
        }

        const breakpoint = new Promise<void>((resolve, reject) => {
            const releaseHandler = (resolvedType) => {
                if (resolvedType === type) {
                    this.clearBreakpoint(type);
                    // eslint-disable-next-line no-use-before-define
                    unsubscribe();
                    resolve();
                }
            };

            const breakStackHandler = () => {
                // eslint-disable-next-line no-use-before-define
                unsubscribe();
                reject(new BreakStackError('Release'));
            };

            const unsubscribe = () => {
                this.off(this.resolverEvent, releaseHandler);
                this.off(this.breakStackEvent, breakStackHandler);
            };

            this.on(this.resolverEvent, releaseHandler);
            this.on(this.breakStackEvent, breakStackHandler);
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

    public breakStack() {
        this.emit(this.breakStackEvent);
    }
}

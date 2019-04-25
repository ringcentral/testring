import { EventEmitter } from 'events';

import { BreakStackError } from './break-stack-error';

type HasBreakpointCallback = (state: boolean) => Promise<void> | void;

export enum BreakpointsTypes {
    beforeInstruction = 'beforeInstruction',
    afterInstruction = 'afterInstruction',
}

export enum BreakpointEvents {
    resolverEvent = 'resolveEvent',
    breakStackEvent = 'breakStack',
}

export class AsyncBreakpoints extends EventEmitter {
    private breakpoints: Map<BreakpointsTypes, Promise<void>> = new Map();

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
                this.removeListener(BreakpointEvents.resolverEvent, releaseHandler);
                this.removeListener(BreakpointEvents.breakStackEvent, breakStackHandler);
            };

            this.on(BreakpointEvents.resolverEvent, releaseHandler);
            this.on(BreakpointEvents.breakStackEvent, breakStackHandler);
        });

        this.breakpoints.set(type, breakpoint);

        return breakpoint;
    }

    private clearBreakpoint(type: BreakpointsTypes): void {
        this.breakpoints.delete(type);
    }

    private resolveBreakpoint(type: BreakpointsTypes): void {
        this.emit(BreakpointEvents.resolverEvent, type);
    }

    public breakStack(): void {
        this.emit(BreakpointEvents.breakStackEvent);
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


    public addBeforeInstructionBreakpoint(): void {
        this.addBreakpoint(BreakpointsTypes.beforeInstruction);
    }

    public async waitBeforeInstructionBreakpoint(
        hasBreakpointCallback: HasBreakpointCallback = () => undefined
    ): Promise<void> {
        return this.waitForBreakpoint(
            BreakpointsTypes.beforeInstruction,
            hasBreakpointCallback,
        );
    }

    public resolveBeforeInstructionBreakpoint(): void {
        this.resolveBreakpoint(BreakpointsTypes.beforeInstruction);
    }

    public isBeforeInstructionBreakpointActive(): boolean {
        return this.breakpoints.has(BreakpointsTypes.beforeInstruction);
    }


    public addAfterInstructionBreakpoint(): void {
        this.addBreakpoint(BreakpointsTypes.afterInstruction);
    }

    public async waitAfterInstructionBreakpoint(
        hasBreakpointCallback: HasBreakpointCallback = () => undefined
    ): Promise<void> {
        return this.waitForBreakpoint(
            BreakpointsTypes.afterInstruction,
            hasBreakpointCallback,
        );
    }

    public resolveAfterInstructionBreakpoint(): void {
        this.resolveBreakpoint(BreakpointsTypes.afterInstruction);
    }

    public isAfterInstructionBreakpointActive(): boolean {
        return this.breakpoints.has(BreakpointsTypes.afterInstruction);
    }
}

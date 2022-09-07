import {TestEvents} from '@testring-dev/types';

import {EventEmitter} from 'events';

import {asyncBreakpoints} from '@testring-dev/async-breakpoints';

type BeforeRunCallback = () => any;
type AfterRunCallback = () => any;

export class BusEmitter extends EventEmitter {
    private async addDelayToStack(): Promise<void> {
        new Promise((resolve) => setImmediate(resolve));
    }

    public async startedTest(): Promise<void> {
        this.emit(TestEvents.started);
        await this.addDelayToStack();
    }

    public async finishedTest(): Promise<void> {
        this.emit(TestEvents.finished);
        await this.addDelayToStack();
    }

    public async failedTest(error: Error): Promise<void> {
        this.emit(TestEvents.failed, error);
        await this.addDelayToStack();
    }
}

export class TestAPIController {
    private bus = new BusEmitter();

    private testID = '';

    private testParameters: object = {};

    private environmentParameters: object = {};

    private beforeRunCallbacks: BeforeRunCallback[] = [];

    private afterRunCallbacks: AfterRunCallback[] = [];

    public getBus() {
        return this.bus;
    }

    public setTestID(testID: string) {
        this.testID = testID;
    }

    public getTestID(): string {
        return this.testID;
    }

    public setTestParameters(parameters: object) {
        this.testParameters = parameters;
    }

    public getTestParameters(): object {
        return this.testParameters;
    }

    public setEnvironmentParameters(parameters: object) {
        this.environmentParameters = parameters;
    }

    public getEnvironmentParameters(): object {
        return this.environmentParameters;
    }

    public registerBeforeRunCallback(callback: BeforeRunCallback) {
        this.beforeRunCallbacks.push(callback);
    }

    public async flushBeforeRunCallbacks() {
        await asyncBreakpoints.waitBeforeInstructionBreakpoint();

        for (const callback of this.beforeRunCallbacks) {
            await callback();
        }

        this.beforeRunCallbacks = [];

        await asyncBreakpoints.waitAfterInstructionBreakpoint();
    }

    public registerAfterRunCallback(callback: AfterRunCallback) {
        this.afterRunCallbacks.push(callback);
    }

    public async flushAfterRunCallbacks() {
        await asyncBreakpoints.waitBeforeInstructionBreakpoint();

        for (const callback of this.afterRunCallbacks) {
            await callback();
        }

        this.afterRunCallbacks = [];

        await asyncBreakpoints.waitAfterInstructionBreakpoint();
    }
}

export const testAPIController = new TestAPIController();

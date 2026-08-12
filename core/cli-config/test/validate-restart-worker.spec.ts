/// <reference types="mocha" />

import * as chai from 'chai';
import {IConfig} from '@testring/types';
import {validateRestartWorker} from '../src/validate-restart-worker';
import {defaultConfiguration} from '../src/default-config';

const withRestartWorker = (restartWorker: IConfig['restartWorker']): IConfig => ({
    ...defaultConfiguration,
    restartWorker,
});

describe('validateRestartWorker', () => {
    it('should accept false (default)', () => {
        chai.expect(() =>
            validateRestartWorker(withRestartWorker(false)),
        ).to.not.throw();
    });

    it('should accept true', () => {
        chai.expect(() =>
            validateRestartWorker(withRestartWorker(true)),
        ).to.not.throw();
    });

    it("should accept 'always'", () => {
        chai.expect(() =>
            validateRestartWorker(withRestartWorker('always')),
        ).to.not.throw();
    });

    it('should accept 0', () => {
        chai.expect(() =>
            validateRestartWorker(withRestartWorker(0)),
        ).to.not.throw();
    });

    it('should accept a positive integer', () => {
        chai.expect(() =>
            validateRestartWorker(withRestartWorker(5)),
        ).to.not.throw();
    });

    it('should reject a negative number', () => {
        chai.expect(() =>
            validateRestartWorker(withRestartWorker(-1)),
        ).to.throw(/Invalid "restartWorker"/);
    });

    it('should reject a non-integer number', () => {
        chai.expect(() =>
            validateRestartWorker(withRestartWorker(1.5)),
        ).to.throw(/Invalid "restartWorker"/);
    });

    it('should reject an arbitrary string', () => {
        chai.expect(() =>
            validateRestartWorker(
                withRestartWorker('sometimes' as unknown as IConfig['restartWorker']),
            ),
        ).to.throw(/Invalid "restartWorker"/);
    });
});



export interface IAssertionSuccessMeta {
    isSoft: boolean;
    successMessage?: string;
    assertMessage?: string;
    originalMethod: string;
    args: any[];
}

export interface IAssertionErrorMeta extends IAssertionSuccessMeta {
    errorMessage?: string;
    error?: Error;
}

export interface IAssertionOptions {
    isSoft?: boolean;
    onSuccess?: (IAssertionSuccessMeta) => void | Promise<void>;
    onError?: (IAssertionErrorMeta) => void | Error | Promise<void | Error>;
}

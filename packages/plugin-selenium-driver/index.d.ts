interface FormDataEvent extends Event {
    readonly formData: FormData;
}

interface SubmitEvent extends Event {
    readonly submitter: HTMLElement | null;
}

interface ElementInternals {
    readonly [key: string]: any;
}

interface GetAnimationsOptions {
    readonly [key: string]: any;
}

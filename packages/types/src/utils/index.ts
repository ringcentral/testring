export interface IStack<T> {
    push(element: T): void;

    pop(): T | void;

    clean(): void;

    getLastElement(offset?: number): T | null;

    length: number;
}


export interface IQueue<T> {
    push(...elements: Array<T>): void;

    shift(): T | void;

    clean(): void;

    getFirstElement(offset?: number): T | null;

    length: number;
}

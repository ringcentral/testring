import { IStack } from '@testring/types';

export class Stack<T> implements IStack<T> {
    private array: Array<T>;

    constructor(initialArray?: Array<T>) {
        if (Array.isArray(initialArray)) {
            this.array = [...initialArray];
        } else {
            this.array = [];
        }
    }

    public push(element: T): void {
        this.array.push(element);
    }

    public pop(): T | void {
        return this.array.pop();
    }

    public clean(): void {
        this.array.length = 0;
    }

    public getLastElement(offset: number = 0): T | null {
        const elementIndex = this.array.length - 1 - offset;

        if (elementIndex < 0) {
            return null;
        }

        return this.array[elementIndex];
    }

    public get length(): number {
        return this.array.length;
    }

    [Symbol.iterator]() {
        return this.array[Symbol.iterator]();
    }
}

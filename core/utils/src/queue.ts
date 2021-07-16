import {IQueue} from '@testring/types';

export class Queue<T> implements IQueue<T> {
    private array: Array<T>;

    constructor(initialArray?: Array<T>) {
        if (Array.isArray(initialArray)) {
            this.array = [...initialArray];
        } else {
            this.array = [];
        }
    }

    public push(...elements: Array<T>) {
        this.array.push(...elements);
    }

    public shift(): T | void {
        return this.array.shift();
    }

    public clean(): void {
        this.array.length = 0;
    }

    /**
     *
     * @param {(T, number?)=>boolean} fn - function to filter elements for removal
     * @returns - number of elements removed
     */
    public remove(fn: <T>(T, number?) => boolean): number {
        const len = this.array.length;
        this.array = this.array.filter((item, index) => !fn(item, index));
        return len - this.array.length;
    }

    public getFirstElement(offset = 0): T | null {
        const elementIndex = offset;

        if (elementIndex >= this.array.length) {
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

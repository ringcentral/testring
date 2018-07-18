export class Queue<T> {
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

    public get length(): number {
        return this.array.length;
    }

    public getFirstElement(offset: number = 0): T | null {
        const elementIndex = offset;

        if (elementIndex >= this.array.length) {
            return null;
        }

        return this.array[elementIndex];
    }

    [Symbol.iterator]() {
        return this.array[Symbol.iterator]();
    }
}

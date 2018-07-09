export class Queue<T> {
    private array: Array<T>;

    constructor(initialArray?: Array<T>) {
        if (Array.isArray(initialArray)) {
            this.array = [...initialArray];
        } else {
            this.array = [];
        }
    }

    public push(element: T) {
        this.array.push(element);
    }

    public shift(): T | void {
        return this.array.shift();
    }

    public get length(): number {
        return this.array.length;
    }
}

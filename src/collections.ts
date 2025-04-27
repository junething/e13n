// TODO replace with a O(1) solution, linked list, double stack, ringbuffer?
export class Queue<T> {
    array: T[] = []
    constructor() {}
    push(...items: T[]) {
        this.array.push(...items);
    }
    take(): T | undefined {
        return this.array.shift()
    }
    count(): number {
        return this.array.length;
    }
}
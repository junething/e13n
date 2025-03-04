// TODO replace with a O(1) solution, linked list, double stack, ringbuffer?
export class Queue<T> {
    array: T[] = []
    finished: boolean = false
    constructor() {}
    push(item: T) {
        this.array.push(item);
    }
    take(): T | undefined {
        return this.array.shift()
    }
    size(): number {
        return this.array.length;
    }
}
import type { IntRange } from "type-fest";
export const batch = <T,>(array: T[], batchSize: number): T[][] =>
        batchSize < array.length
                ? [array.slice(0, batchSize), ...batch(array.slice(batchSize), batchSize)]
                : [array];
export const throwErr = (msg: string): never => {
        throw new Error(msg);
}
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
export const parseIntStrict = (str: string): number => (str.trim() == '') ? NaN : Number(str);
export type Percentage = IntRange<0, 101>;
export const tupleApplySnd = <F, S, N>(fn: ((s: S) => N)): ((t: [F, S]) => [F, N]) =>
        ([f, s]) => [f, fn(s)];
export function* take<T>(iterator: Iterator<T>, count: number): Generator<T> {
        let item: T;
        while ((item = iterator.next().value) && count > 0) {
                yield item;
        }
}
export const takeAsync =  async <T>(iterator: AsyncIterator<T>, count?: number): Promise<T[]> => {
        let items: T[] = [];
        let item: T;
        while ((item = (await iterator.next()).value) && (count == undefined || count-- > 0)) {
                items.push(item);
        }
        return items;
}
export function* toGenerator <T extends Iterable<any>>(array: T): Generator<T> {
        for(let item of array) yield item;
}
export async function* toAsyncGenerator <T>(array: Iterable<T>): AsyncGenerator<T> {
        for(let item of array) yield item;
}
export const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const escapeRegExpReplacement = (str: string) => str.replace(/\$/g, '$$$$');


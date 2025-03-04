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
export type Percentage = IntRange<0,101>;
export const tupleApplySnd = <F,S,N>(fn: ((s: S) => N)): ((t: [F, S]) => [F, N]) =>
        ([f, s]) => [f, fn(s)];
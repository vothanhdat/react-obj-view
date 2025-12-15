/**
 * Polyfill for Promise.withResolvers() which is available in Node 22+ but not in Node 20
 * Creates a promise with its resolve and reject functions exposed
 * 
 * This function mimics the behavior of the native Promise.withResolvers() API:
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/withResolvers
 */
export function promiseWithResolvers<T = void>(): PromiseWithResolvers<T> {
    // These will be assigned synchronously in the Promise constructor below
    let resolve: (value: T | PromiseLike<T>) => void;
    let reject: (reason?: any) => void;
    
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    
    // Non-null assertion is safe here because the Promise constructor
    // executes synchronously, guaranteeing resolve and reject are assigned
    return {
        promise,
        resolve: resolve!,
        reject: reject!,
    };
}

/**
 * Polyfill for Promise.withResolvers() which is available in Node 22+ but not in Node 20
 * Creates a promise with its resolve and reject functions exposed
 */
export function promiseWithResolvers<T = void>(): PromiseWithResolvers<T> {
    let resolve: (value: T | PromiseLike<T>) => void;
    let reject: (reason?: any) => void;
    
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    
    return {
        promise,
        resolve: resolve!,
        reject: reject!,
    };
}

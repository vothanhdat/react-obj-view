import { hidePrototype } from "../getEntries";
import { ResolverEntry, ResolverFn } from "../types";
import { weakMapCache } from "./_shared";
import { ENUMERABLE_BIT } from "../meta" with {type: "macro"};

const PendingSymbol = Symbol("Pending");

const getPromiseStatus = weakMapCache(
    (e: Promise<any>) => {
        let p = Promise
            .race([e, Promise.resolve(PendingSymbol)])
            .then(
                (result) => result == PendingSymbol
                    ? ({ status: "pending" })
                    : ({ status: "resolved", result }),
                (error) => ({ status: "rejected", result: error })
            );

        return {
            status: p.then(e => e.status),
            result: p.then(e => e.result),
        };
    }
);

export class InternalPromise {
    [hidePrototype] = true
    static #cache = new WeakMap();

    static getInstance(e: Promise<any>) {
        if (!this.#cache.has(e)) {
            this.#cache.set(e, new InternalPromise(e));
        }
        return this.#cache.get(e);
    }

    private constructor(
        public promise: Promise<any>,
        public resolved = false,
        public value: any = undefined

    ) {
        promise
            .then(r => {
                this.resolved = true
                this.value = r
            })
            .catch(() => { });
        // console.log("new InternalPromise", this)

    }
}


export const promiseResolver: ResolverFn<Promise<any>> = function* (
    promise: Promise<any>,
    next,
    isPreview
) {
    let { result, status } = getPromiseStatus(promise);
    const entry: ResolverEntry = [undefined as any, undefined, isPreview ? ENUMERABLE_BIT : 0];

    entry[0] = "[[status]]";
    entry[1] = InternalPromise.getInstance(status);
    yield entry;

    entry[0] = "[[result]]";
    entry[1] = InternalPromise.getInstance(result);
    yield entry;

    yield* next(promise);
};


export const internalPromiseResolver: ResolverFn<InternalPromise> = function* (
    promise: InternalPromise,
    next,
    isPreview
) {
    if (promise.resolved) {
        yield* next(promise.value)
    }
}
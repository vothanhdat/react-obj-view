import { ResolverFn } from "./types";

const MapIterater = Object.getPrototypeOf(new Map().entries())

export class CustomIterator {
    static name = ""

    constructor(
        public iterator: () => IteratorObject<any>,
        public size: number | undefined = undefined
    ) { }

    toString() {
        return ""
    }
}

export class CustomEntry {
    static name = ""

    constructor(
        public key: any,
        public value: any
    ) { }
    toString() {
        return ""
    }
}

const weakMapCache = <T extends (e: any) => any>(fn: T) => {

    let cache = new WeakMap()


    return ((e: any) => {
        if (!cache.has(e)) {
            cache.set(e, fn(e))
        }

        return cache.get(e)

    }) as T
}


export class InternalPromise {

    static #cache = new WeakMap()

    static getInstance(e: Promise<any>) {
        if (!this.#cache.has(e)) {
            this.#cache.set(e, new InternalPromise(e))
        }
        return this.#cache.get(e)
    }

    private constructor(
        public promise: Promise<any>,
        public value: any = undefined

    ) {
        promise
            .then(r => this.value = r)
            .catch(() => { })
    }
}

const iteraterResolver: ResolverFn<CustomIterator> = (
    e,
    cb,
    next,
    _isPreview,
) => {
    const iterator = e.iterator()

    if (Object.getPrototypeOf(iterator) == MapIterater) {
        let index = 0

        for (let [key, value] of iterator) {
            if (cb(
                index++,
                new CustomEntry(key, value),
                true
            )) return
        }
    } else {
        let index = 0

        for (let entry of iterator) {
            if (cb(
                index++,
                entry,
                true
            )) return;
        }
    }

    next(e);
}

const mapResolver: ResolverFn<Map<any, any>> = (
    map,
    cb,
    next,
    isPreview,
) => {
    if (isPreview) {
        let index = 0
        for (let [key, value] of map.entries()) {
            cb(
                index++,
                new CustomEntry(key, value),
                true
            )
        }
    } else {
        cb(
            "[[Entries]]",
            new CustomIterator(() => map.entries(), map.size),
            false
        )

        cb(
            "size",
            map.size,
            true
        )
    }

    next(map)

}

const setResolver: ResolverFn<Set<any>> = (
    set: Set<any>,
    cb,
    next,
    isPreview,
) => {
    if (isPreview) {
        let index = 0
        for (let value of set.values()) cb(
            index++,
            value,
            true
        )

    } else {
        cb(
            "[[Entries]]",
            new CustomIterator(() => set.values(), set.size),
            false
        )

        cb(
            "size",
            set.size,
            true
        )
    }
    next(set)
}

const PendingSymbol = Symbol("Pending")

const getPromiseStatus = weakMapCache(
    (e: Promise<any>) => {
        let p = Promise
            .race([e, Promise.resolve(PendingSymbol)])
            .then(
                (result) => (console.log({ result }), result) == PendingSymbol
                    ? ({ status: "pending" })
                    : ({ status: "resolved", result }),
                (error) => ({ status: "rejected", result: error }),
            )

        return {
            status: p.then(e => e.status),
            result: p.then(e => e.result),
        }
    }
)

const promiseResolver: ResolverFn<Promise<any>> = (
    promise: Promise<any>,
    cb,
    next,
    isPreview,
) => {
    let { result, status } = getPromiseStatus(promise)
    cb(
        "[[status]]",
        InternalPromise.getInstance(status),
        isPreview
    )
    cb(
        "[[result]]",
        InternalPromise.getInstance(result),
        isPreview
    )
    next(promise);
}

export const DEFAULT_RESOLVER = new Map<any, ResolverFn>([
    // [Error, errorResolver],
    [Map, mapResolver],
    [Set, setResolver],
    [CustomIterator, iteraterResolver],
    [Promise, promiseResolver],
]);


import { Entry, JSONViewCtx, ResolverFn } from "./types";


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

const iteraterResolver: ResolverFn = function* (
    e: CustomIterator,
    entries: Generator<Entry, any, any>,
    isPreview: boolean
) {
    for (let e of entries) { }

    let iterator = e.iterator()

    if (Object.getPrototypeOf(iterator) == MapIterater) {
        let index = 0

        for (let [key, value] of iterator) {
            yield {
                key: index++,
                value: new CustomEntry(key, value),
                enumerable: true
            }
        }
    } else {
        let index = 0

        for (let entry of iterator) {
            yield {
                key: index++,
                value: entry,
                enumerable: true
            }
        }
    }

}

const mapResolver: ResolverFn = function* (
    map: Map<any, any>,
    entries: Generator<Entry, any, any>,
    isPreview: boolean
) {
    if (isPreview) {
        let index = 0
        for (let [key, value] of map.entries()) {
            yield {
                key: index++,
                value: new CustomEntry(key, value),
                enumerable: true
            }
        }
    } else {
        yield {
            key: "[[Entries]]",
            value: new CustomIterator(() => map.entries(), map.size),
            enumerable: false
        }

        yield {
            key: "size",
            value: map.size,
            enumerable: true
        }
    }

    for (let e of entries) {
        yield e
    }
}

const setResolver: ResolverFn = function* (
    set: Set<any>,
    entries: Generator<Entry, any, any>,
    isPreview: boolean
) {
    if (isPreview) {
        for (let value of set.values()) {
            let index = 0
            yield {
                key: index++,
                value,
                enumerable: true
            }
        }
    } else {

        yield {
            key: "[[Entries]]",
            value: new CustomIterator(() => set.values(), set.size),
            enumerable: false
        }

        yield {
            key: "size",
            value: set.size,
            enumerable: true
        }
    }


    for (let e of entries) {
        yield e
    }
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

const promiseResolver: ResolverFn = function* (
    e: Promise<any>,
    entries: Generator<Entry, any, any>,
    isPreview: boolean
) {
    let { result, status } = getPromiseStatus(e)

    yield {
        key: "[[status]]",
        value: InternalPromise.getInstance(status),
        enumerable: isPreview
    }
    yield {
        key: "[[result]]",
        value: InternalPromise.getInstance(result),
        enumerable: isPreview
    }

    for (let e of entries) {
        yield e
    }
}


export const DEFAULT_RESOLVER: JSONViewCtx['resolver'] = new Map<any, ResolverFn>([
    // [Error, errorResolver],
    [Map, mapResolver],
    [Set, setResolver],
    [CustomIterator, iteraterResolver],
    [Promise, promiseResolver],
]);



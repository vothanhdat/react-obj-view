import { Entry, JSONViewCtx, ResolverFn } from "./types";


const MapIterater = Object.getPrototypeOf(new Map().entries())

class CustomIterator {
    static name = ""

    constructor(
        public iterator: () => IteratorObject<any>,
        public size: number | undefined = undefined
    ) { }

    toString() {
        return ""
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
        for (let [key, value] of iterator) {
            yield {
                key,
                value,
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
        for (let [key, value] of map.entries()) {
            yield {
                key,
                value,
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
        for (let [key, value] of set.entries()) {
            yield {
                key,
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



const errorResolver: ResolverFn = function* (
    e: Error,
    entries: Generator<Entry, any, any>,
    isPreview: boolean
) {
    yield {
        key: "name",
        value: e.name,
        enumerable: false
    }
    yield {
        key: "message",
        value: e.message,
        enumerable: false
    }

    yield {
        key: "stack",
        value: e.stack,
        enumerable: false
    }
    for (let e of entries) {
        yield e
    }
}



export const DEFAULT_RESOLVER: JSONViewCtx['resolver'] = new Map<any, ResolverFn>([
    [Error, errorResolver],
    [Map, mapResolver],
    [Set, setResolver],
    [CustomIterator, iteraterResolver],
]);



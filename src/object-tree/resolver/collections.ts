import { hidePrototype } from "../getEntries";
import { ResolverEntry, ResolverFn } from "../types";
import { weakMapCache } from "./_shared";
import { ENUMERABLE_BIT } from "../meta" with {type: "macro"};


const MapIterater = Object.getPrototypeOf(new Map().entries());

export class CustomIterator {
    [hidePrototype] = true
    static name = "";
    static getIterator = weakMapCache(
        (e: Set<any> | Map<any, any>) => new CustomIterator(
            e instanceof Map ? () => e.entries()
                : e instanceof Set ? () => e.values()
                    : () => [] as never,
            e instanceof Map ? e.size
                : e instanceof Set ? e.size
                    : 0
        )
    )

    private constructor(
        public iterator: () => IteratorObject<any>,
        public size: number | undefined = undefined
    ) { }

    toString() {
        return "";
    }
}

export class CustomEntry {
    [hidePrototype] = true
    static name = "";

    private static getEntryMap = weakMapCache(iterator => new Map<any, CustomEntry>())

    static getEntry(ref: any, key: any, value: any) {
        let map = this.getEntryMap(ref)
        let entry = map.get(key)
        if (entry?.value !== value || (!map?.has(key))) {
            map.set(key, entry = new CustomEntry(key, value))
        }
        return entry
    }

    private constructor(
        public key: any,
        public value: any
    ) { }

    toString() {
        return "";
    }

}

export const iteraterResolver: ResolverFn<CustomIterator> = function* (
    e,
    next,
    _isPreview
) {
    const iterator = e.iterator();
    const entry: ResolverEntry = [undefined as any, undefined, 0];

    if (Object.getPrototypeOf(iterator) == MapIterater) {
        let index = 0;

        for (let [key, value] of iterator) {
            entry[0] = index++;
            entry[1] = CustomEntry.getEntry(e, key, value);
            entry[2] = ENUMERABLE_BIT;
            yield entry;
        }
    } else {
        let index = 0;

        for (let val of iterator) {
            entry[0] = index++;
            entry[1] = val;
            entry[2] = ENUMERABLE_BIT;
            yield entry;
        }
    }

};

export const mapResolver: ResolverFn<Map<any, any>> = function* (
    map,
    next,
    isPreview
) {
    if (isPreview) {
        let index = 0;
        const entry: ResolverEntry = [undefined as any, undefined, 0];
        for (let [key, value] of map.entries()) {
            entry[0] = index++;
            entry[1] = CustomEntry.getEntry(map, key, value);
            entry[2] = ENUMERABLE_BIT;
            yield entry;
        }
    } else {
        yield [
            "[[Entries]]",
            CustomIterator.getIterator(map),
            0,
        ];

        yield ["size", map.size, ENUMERABLE_BIT];
    }

    yield* next(map);

};

export const setResolver: ResolverFn<Set<any>> = function* (
    set: Set<any>,
    next,
    isPreview
) {
    if (isPreview) {
        let index = 0;
        const entry: ResolverEntry = [undefined as any, undefined, 0];
        for (let value of set.values()) {
            entry[0] = index++;
            entry[1] = value;
            entry[2] = ENUMERABLE_BIT;
            yield entry;
        }

    } else {
        yield [
            "[[Entries]]",
            CustomIterator.getIterator(set),
            0
        ];

        yield ["size", set.size, ENUMERABLE_BIT];
    }
    yield* next(set);
};


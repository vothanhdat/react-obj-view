import { hidePrototype } from "../getEntries";
import { ResolverFn } from "../types";
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

    if (Object.getPrototypeOf(iterator) == MapIterater) {
        let index = 0;

        for (let [key, value] of iterator) {
            yield [
                index++,
                CustomEntry.getEntry(e, key, value),
                ENUMERABLE_BIT
            ];
        }
    } else {
        let index = 0;

        for (let entry of iterator) {
            yield [index++, entry, ENUMERABLE_BIT];
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
        for (let [key, value] of map.entries()) {
            yield [
                index++,
                CustomEntry.getEntry(map, key, value),
                ENUMERABLE_BIT
            ];
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
        for (let value of set.values())
            yield [index++, value, ENUMERABLE_BIT];

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


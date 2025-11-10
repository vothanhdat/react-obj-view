import { ResolverFn } from "../types";
import { weakMapCache } from "./_shared";

const MapIterater = Object.getPrototypeOf(new Map().entries());

export class CustomIterator {
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

export const iteraterResolver: ResolverFn<CustomIterator> = (
    e,
    cb,
    next,
    _isPreview
) => {
    const iterator = e.iterator();

    if (Object.getPrototypeOf(iterator) == MapIterater) {
        let index = 0;

        for (let [key, value] of iterator) {
            if (cb(
                index++,
                CustomEntry.getEntry(e, key, value),
                true
            )) return;
        }
    } else {
        let index = 0;

        for (let entry of iterator) {
            if (cb(index++, entry, true))
                return;
        }
    }

};

export const mapResolver: ResolverFn<Map<any, any>> = (
    map,
    cb,
    next,
    isPreview
) => {
    if (isPreview) {
        let index = 0;
        for (let [key, value] of map.entries()) {
            cb(
                index++,
                CustomEntry.getEntry(map, key, value),
                // new CustomEntry(key, value),
                true
            );
        }
    } else {
        cb(
            "[[Entries]]",
            CustomIterator.getIterator(map),
            // new CustomIterator(() => map.entries(), map.size),
            false
        );

        cb("size", map.size, true);
    }

    next(map);

};

export const setResolver: ResolverFn<Set<any>> = (
    set: Set<any>,
    cb,
    next,
    isPreview
) => {
    if (isPreview) {
        let index = 0;
        for (let value of set.values())
            cb(index++, value, true);

    } else {
        cb(
            "[[Entries]]",
            CustomIterator.getIterator(set),
            false
        );

        cb("size", set.size, true);
    }
    next(set);
};

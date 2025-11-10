import { ResolverFn } from "../types";

const MapIterater = Object.getPrototypeOf(new Map().entries());

export class CustomIterator {
    static name = "";

    constructor(
        public iterator: () => IteratorObject<any>,
        public size: number | undefined = undefined
    ) { }

    toString() {
        return "";
    }
}

export class CustomEntry {
    static name = "";

    constructor(
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
                new CustomEntry(key, value),
                true
            )) return;
        }
    } else {
        let index = 0;

        for (let entry of iterator) {
            if (cb(
                index++,
                entry,
                true
            )) return;
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
                new CustomEntry(key, value),
                true
            );
        }
    } else {
        cb(
            "[[Entries]]",
            new CustomIterator(() => map.entries(), map.size),
            false
        );

        cb(
            "size",
            map.size,
            true
        );
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
        for (let value of set.values()) cb(
            index++,
            value,
            true
        );

    } else {
        cb(
            "[[Entries]]",
            new CustomIterator(() => set.values(), set.size),
            false
        );

        cb(
            "size",
            set.size,
            true
        );
    }
    next(set);
};

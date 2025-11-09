import { getPropertyValue, propertyIsEnumerable } from "../ObjectViewV2/utils/createIterator";
import type { WalkingConfig } from "./NodeData";
import { InternalPromise } from "./resolver";
import type { Entry } from "./types";



export const getEntriesOrignal = (value: any, config: WalkingConfig): Entry[] => {

    const shouldIterate = (typeof value === 'object' && value !== null) || typeof value === 'function';

    if (!shouldIterate) return [];

    let entries: Entry[] = []

    if (value instanceof Array) {

        for (let index = 0; index < value.length; index++) {
            entries.push({
                key: index,
                value: value[index],
                enumerable: true
            })
        }

    } else {

        const keys = config.nonEnumerable
            ? Object.getOwnPropertyNames(value)
            : Object.keys(value)

        for (let index = 0; index < keys.length; index++) {
            const key = keys[index]
            const enumerable = config.nonEnumerable ? propertyIsEnumerable.call(value, key) : true
            entries.push({
                key,
                value: enumerable ? value[key] : getPropertyValue(value, key),
                enumerable,
            })
        }

    }

    if (config.symbol) {
        for (var symbol of Object.getOwnPropertySymbols(value)) {
            entries.push({
                key: symbol,
                value: getPropertyValue(value, symbol),
                enumerable: propertyIsEnumerable.call(value, symbol),
            });
        }
    }

    if (config.nonEnumerable && value !== Object.prototype /* already added */) {
        entries.push({
            key: '[[Prototype]]',
            value: Object.getPrototypeOf(value),
            enumerable: false,
        });
    }


    return entries
};


export const getEntries = function (
    value: any,
    config: WalkingConfig,
    isPreview = false,
): Entry[] {
    const prototype = value?.constructor

    let baseEntries: Entry[] | undefined = undefined;

    if (prototype && value instanceof value?.constructor && config.resolver?.has(value?.constructor)) {
        baseEntries = getEntriesOrignal(value, config);
        const resolverResult = config.resolver?.get(value?.constructor)?.(
            value,
            baseEntries,
            isPreview,
        )

        if (resolverResult)
            return resolverResult;
    }
    if (value instanceof InternalPromise) {
        return getEntries(value.value, config, isPreview)
    }
    return baseEntries || getEntriesOrignal(value, config)

};


export const getEntriesCbOriginal = (
    value: unknown,
    config: WalkingConfig,
    cb: (key: PropertyKey, value: unknown, enumerable: boolean) => boolean | void
) => {

    const shouldIterate = (typeof value === 'object' && value !== null) || typeof value === 'function';

    if (!shouldIterate) return;

    if (value instanceof Array) {

        for (let index = 0; index < value.length; index++) {
            if (cb(index, value[index], true))
                return;
        }

    } else {
        const nonEnumerable = config.nonEnumerable

        const keys = nonEnumerable
            ? Object.getOwnPropertyNames(value)
            : Object.keys(value)

        for (let key of keys) {
            const enumerable = config.nonEnumerable ? propertyIsEnumerable.call(value, key) : true
            if (cb(
                key,
                enumerable ? value[key] : getPropertyValue(value, key),
                enumerable,
            )) return;
        }

    }

    if (config.symbol) {
        for (var symbol of Object.getOwnPropertySymbols(value)) {
            if (cb(
                symbol,
                getPropertyValue(value, symbol),
                propertyIsEnumerable.call(value, symbol),
            )) return;
        }
    }

    if (config.nonEnumerable && value !== Object.prototype) {
        if (cb(
            '[[Prototype]]',
            Object.getPrototypeOf(value),
            false,
        )) return;
    }

};

// const bindGetEntriesCbOriginal = (config: WalkingConfig, cb) => (value: unknown) => getEntriesCbOriginal(value, config, cb)

export const getEntriesCb = (
    value: unknown,
    config: WalkingConfig,
    isPreview: boolean,
    cb: (key: PropertyKey, value: unknown, enumerable: boolean) => boolean | void
) => {

    const prototype = value?.constructor

    if (prototype && value instanceof prototype && config.resolver?.has(prototype)) {
        config.resolver?.get(prototype)?.(
            value,
            cb,
            (value) => getEntriesCbOriginal(value, config, cb),
            // bindGetEntriesCbOriginal(config, cb),
            isPreview,
        )
    } else {
        getEntriesCbOriginal(value, config, cb)
    }

};

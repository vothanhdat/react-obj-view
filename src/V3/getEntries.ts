import { getPropertyValue, propertyIsEnumerable } from "../ObjectViewV2/utils/createIterator";
import type { WalkingConfig } from "./NodeData";
import { InternalPromise } from "./resolver";
import type { Entry } from "./types";

export const getEntriesOrignal = function* (value: any, config: WalkingConfig): Generator<Entry, void, unknown> {

    const shouldIterate = (typeof value === 'object' && value !== null) || typeof value === 'function';

    if (!shouldIterate) return;

    if (value instanceof Array) {

        for (let key = 0; key < value.length; key++) {
            yield { key, value: value[key], enumerable: true };
        }

    } else {
        const keys = config.nonEnumerable
            ? Object.getOwnPropertyNames(value)
            : Object.keys(value)

        for (var key of keys) {
            yield {
                key,
                value: getPropertyValue(value, key),
                enumerable: propertyIsEnumerable.call(value, key),
            };
        }
    }

    if (config.symbol) {
        for (var symbol of Object.getOwnPropertySymbols(value)) {
            yield {
                key: symbol,
                value: getPropertyValue(value, symbol),
                enumerable: propertyIsEnumerable.call(value, symbol),
            };
        }
    }

    if (config.nonEnumerable && value !== Object.prototype /* already added */) {
        yield {
            key: '[[Prototype]]',
            value: Object.getPrototypeOf(value),
            enumerable: false,
        };
    }
};



export const getEntries = function (
    value: any,
    config: WalkingConfig,
    isPreview = false,
): Generator<Entry, void, unknown> {
    const prototype = value?.constructor
    if (prototype && value instanceof value?.constructor && config.resolver?.has(value?.constructor)) {
        let iterator = config.resolver?.get(value?.constructor)?.(
            value,
            getEntriesOrignal(value, config),
            isPreview,
        )

        if (iterator)
            return iterator;
    }
    if (value instanceof InternalPromise) {
        return getEntries(value.value, config, isPreview)
    }
    return getEntriesOrignal(value, config)

};

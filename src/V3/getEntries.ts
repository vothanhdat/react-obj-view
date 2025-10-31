import { getPropertyValue, propertyIsEnumerable } from "../ObjectViewV2/utils/createIterator";
import type { WalkingConfig } from "./NodeData";

export const getEntriesOrignal = function* (value: any, config: WalkingConfig) {

    const shouldIterate = (typeof value === 'object' && value !== null) || typeof value === 'function';

    if (!shouldIterate) return;

    if (Array.isArray(value)) {

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

    if (config.nonEnumerable && value !== Object.prototype /* already added */) {
        yield {
            key: '__proto__',
            value: Object.getPrototypeOf(value),
            enumerable: false,
        };
    }
};



export const getEntries = function (value: any, config: WalkingConfig) {

    if (config.resolver?.has(value?.constructor)) {
        let iterator = config.resolver?.get(value?.constructor)?.(
            value,
            getEntriesOrignal(value, config),
            false,
        )

        if (iterator)
            return iterator;
    }
    return getEntriesOrignal(value, config)

};

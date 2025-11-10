import { getPropertyValue, propertyIsEnumerable } from "../ObjectViewV2/utils/object";
import { LazyValue } from "./LazyValueWrapper";
import { InternalPromise } from "./resolvers/promise";
import { WalkingConfig } from "./types";


export const getEntriesCbOriginal = (
    value: any,
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

        if (config.nonEnumerable) {
            for (let key of Object.getOwnPropertyNames(value)) {
                const descriptor = Object.getOwnPropertyDescriptor(value, key)
                if (cb(
                    key,
                    descriptor?.get ? LazyValue.getInstance(value, key) : descriptor?.value,
                    descriptor?.enumerable!
                )) return;
            }
        } else {
            for (let key in value) {
                if (cb(
                    key,
                    (value as any)[key],
                    true,
                )) return;
            }
        }

    }

    if (config.symbol) {
        for (var symbol of Object.getOwnPropertySymbols(value)) {

            if (cb(
                symbol,
                value[symbol],
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


    // if (value instanceof InternalPromise && value.resolved) {
    //     value = value.value
    //     // console.log("value.value", value.value)
    // }

    const prototype = value
        ? (value.constructor ?? Object.getPrototypeOf(value).constructor)
        : undefined

    // console.log(value, prototype, prototype && value instanceof prototype, config.resolver?.has(prototype))

    if (prototype && value instanceof prototype && config.resolver?.has(prototype)) {
        config.resolver?.get(prototype)?.(
            value,
            cb,
            (value, callback = cb) => getEntriesCbOriginal(value, config, callback),
            isPreview,
        )
    } else {
        getEntriesCbOriginal(value, config, cb)
    }

};

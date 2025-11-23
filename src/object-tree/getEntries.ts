import { LazyValue } from "./custom-class/LazyValueWrapper";
import { WalkingConfig } from "./types";
import { propertyIsEnumerable } from "./utils/object";
import { ENUMERABLE_BIT } from "./meta" with {type: "macro"};

export const hidePrototype = Symbol()

export const getEntriesCbOriginal = (
    value: any,
    config: WalkingConfig,
    cb: (key: PropertyKey, value: unknown, meta: number) => boolean | void
) => {

    const shouldIterate = (typeof value === 'object' && value !== null) || typeof value === 'function';

    if (!shouldIterate) return;

    if (value instanceof Array) {

        for (let index = 0; index < value.length; index++) {
            if (cb(index, value[index], ENUMERABLE_BIT))
                return;
        }

    } else {

        if (config.nonEnumerable) {
            for (let key of Object.getOwnPropertyNames(value)) {
                const descriptor = Object.getOwnPropertyDescriptor(value, key)
                if (cb(
                    key,
                    descriptor?.get ? LazyValue.getInstance(value, key) : descriptor?.value,
                    descriptor?.enumerable ? ENUMERABLE_BIT : 0
                )) return;
            }
        } else {
            for (let key in value) {
                if (cb(
                    key,
                    (value as any)[key],
                    ENUMERABLE_BIT,
                )) return;
            }
        }

    }

    if (config.symbol) {
        for (var symbol of Object.getOwnPropertySymbols(value)) {

            if (cb(
                symbol,
                value[symbol],
                propertyIsEnumerable.call(value, symbol) ? ENUMERABLE_BIT : 0,
            )) return;
        }
    }

    if (config.nonEnumerable && value !== Object.prototype && !value[hidePrototype]) {
        if (cb(
            '[[Prototype]]',
            Object.getPrototypeOf(value),
            0,
        )) return;
    }

};

export const getEntriesCb = (
    value: unknown,
    config: WalkingConfig,
    isPreview: boolean,
    stableRef: unknown,
    cb: (key: PropertyKey, value: unknown, meta: number) => boolean | void
) => {

    const prototype = value
        ? (value.constructor ?? Object.getPrototypeOf(value)?.constructor)
        : undefined


    if (prototype && config.resolver?.has(prototype) && value instanceof prototype) {
        config.resolver?.get(prototype)?.(
            value,
            cb,
            (value, callback = cb) => getEntriesCbOriginal(value, config, callback),
            isPreview,
            config,
            stableRef,
        )
    } else {
        getEntriesCbOriginal(value, config, cb)
    }

};

import { LazyValue } from "./custom-class/LazyValueWrapper";
import { ResolverEntry, WalkingConfig } from "./types";
import { propertyIsEnumerable } from "./utils/object";
import { ENUMERABLE_BIT } from "./meta" with {type: "macro"};

export const hidePrototype = Symbol()

export function* getEntriesOriginal(
    value: any,
    config: WalkingConfig,
): IterableIterator<ResolverEntry> {

    const shouldIterate = (typeof value === 'object' && value !== null) || typeof value === 'function';

    if (!shouldIterate) return;

    if (value instanceof Array) {

        for (let index = 0; index < value.length; index++) {
            yield [index, value[index], ENUMERABLE_BIT];
        }

    } else {

        if (config.nonEnumerable) {
            for (let key of Object.getOwnPropertyNames(value)) {
                const descriptor = Object.getOwnPropertyDescriptor(value, key)
                yield [
                    key,
                    descriptor?.get ? LazyValue.getInstance(value, key) : descriptor?.value,
                    descriptor?.enumerable ? ENUMERABLE_BIT : 0
                ];
            }
        } else {
            for (let key in value) {
                yield [
                    key,
                    (value as any)[key],
                    ENUMERABLE_BIT,
                ];
            }
        }

    }

    if (config.symbol) {
        for (var symbol of Object.getOwnPropertySymbols(value)) {
            yield [
                symbol,
                value[symbol],
                propertyIsEnumerable.call(value, symbol) ? ENUMERABLE_BIT : 0,
            ];
        }
    }

    if (config.nonEnumerable && value !== Object.prototype && !value[hidePrototype]) {
        yield [
            '[[Prototype]]',
            Object.getPrototypeOf(value),
            0,
        ];
    }

};

export function* getEntries(
    value: unknown,
    config: WalkingConfig,
    isPreview: boolean,
    stableRef: unknown,
): IterableIterator<ResolverEntry> {

    const prototype = value
        ? (value.constructor ?? Object.getPrototypeOf(value)?.constructor)
        : undefined

    if (prototype && value instanceof prototype && config.resolver?.has(prototype)) {
        yield* config.resolver?.get(prototype)!(
            value,
            (value) => getEntriesOriginal(value, config),
            isPreview,
            config,
            stableRef,
        )
    } else {
        yield* getEntriesOriginal(value, config)
    }

};

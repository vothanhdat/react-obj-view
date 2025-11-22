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

    const entry: ResolverEntry = [undefined as any, undefined, 0];

    if (value instanceof Array) {

        for (let index = 0; index < value.length; index++) {
            entry[0] = index;
            entry[1] = value[index];
            entry[2] = ENUMERABLE_BIT;
            yield entry;
        }

    } else {

        if (config.nonEnumerable) {
            for (let key of Object.getOwnPropertyNames(value)) {
                const descriptor = Object.getOwnPropertyDescriptor(value, key)
                entry[0] = key;
                entry[1] = descriptor?.get ? LazyValue.getInstance(value, key) : descriptor?.value;
                entry[2] = descriptor?.enumerable ? ENUMERABLE_BIT : 0;
                yield entry;
            }
        } else {
            for (let key in value) {
                entry[0] = key;
                entry[1] = (value as any)[key];
                entry[2] = ENUMERABLE_BIT;
                yield entry;
            }
        }

    }

    if (config.symbol) {
        for (var symbol of Object.getOwnPropertySymbols(value)) {
            entry[0] = symbol;
            entry[1] = value[symbol];
            entry[2] = propertyIsEnumerable.call(value, symbol) ? ENUMERABLE_BIT : 0;
            yield entry;
        }
    }

    if (config.nonEnumerable && value !== Object.prototype && !value[hidePrototype]) {
        entry[0] = '[[Prototype]]';
        entry[1] = Object.getPrototypeOf(value);
        entry[2] = 0;
        yield entry;
    }

};

export function getEntries(
    value: unknown,
    config: WalkingConfig,
    isPreview: boolean,
    stableRef: unknown,
): IterableIterator<ResolverEntry> {

    const prototype = value
        ? (value.constructor ?? Object.getPrototypeOf(value)?.constructor)
        : undefined

    if (prototype && value instanceof prototype && config.resolver?.has(prototype)) {
        return config.resolver?.get(prototype)!(
            value,
            (value) => getEntriesOriginal(value, config),
            isPreview,
            config,
            stableRef,
        )
    } else {
        return getEntriesOriginal(value, config)
    }

};

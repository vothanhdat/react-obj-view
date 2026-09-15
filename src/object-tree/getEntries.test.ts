import { describe, it, expect, vi } from 'vitest';
import { getEntriesCb, getEntriesCbOriginal } from './getEntries';
import { WalkingConfig } from './types';
import { LazyValue, LazyValueError } from './custom-class/LazyValueWrapper';
import { ENUMERABLE_BIT } from './meta';

describe('getEntriesCbOriginal', () => {
    const defaultConfig: WalkingConfig = {
        nonEnumerable: false,
        symbol: false,
        resolver: new Map(),
        expandDepth: 0,
    };

    it('should iterate over array indices', () => {
        const arr = [1, 2, 3];
        const cb = vi.fn();
        getEntriesCbOriginal(arr, defaultConfig, cb);

        expect(cb).toHaveBeenCalledTimes(3);
        expect(cb).toHaveBeenCalledWith(0, 1, ENUMERABLE_BIT);
        expect(cb).toHaveBeenCalledWith(1, 2, ENUMERABLE_BIT);
        expect(cb).toHaveBeenCalledWith(2, 3, ENUMERABLE_BIT);
    });

    it('should iterate over object properties', () => {
        const obj = { a: 1, b: 2 };
        const cb = vi.fn();
        getEntriesCbOriginal(obj, defaultConfig, cb);

        expect(cb).toHaveBeenCalledTimes(2);
        expect(cb).toHaveBeenCalledWith('a', 1, ENUMERABLE_BIT);
        expect(cb).toHaveBeenCalledWith('b', 2, ENUMERABLE_BIT);
    });

    it('should handle non-enumerable properties when enabled', () => {
        const obj = {};
        Object.defineProperty(obj, 'hidden', {
            value: 'secret',
            enumerable: false,
        });
        const config = { ...defaultConfig, nonEnumerable: true };
        const cb = vi.fn();

        getEntriesCbOriginal(obj, config, cb);

        expect(cb).toHaveBeenCalledWith('hidden', 'secret', 0);
        expect(cb).toHaveBeenCalledWith('[[Prototype]]', Object.prototype, 0);
    });

    it('should handle getters as LazyValue when non-enumerable enabled', () => {
        const obj = {
            get computed() { return 'value'; }
        };
        const config = { ...defaultConfig, nonEnumerable: true };
        const cb = vi.fn();

        getEntriesCbOriginal(obj, config, cb);

        expect(cb).toHaveBeenCalledWith('computed', expect.any(LazyValue), ENUMERABLE_BIT);
    });

    it('should handle symbols when enabled', () => {
        const sym = Symbol('test');
        const obj = { [sym]: 'symbolValue' };
        const config = { ...defaultConfig, symbol: true };
        const cb = vi.fn();

        getEntriesCbOriginal(obj, config, cb);

        expect(cb).toHaveBeenCalledWith(sym, 'symbolValue', ENUMERABLE_BIT);
    });

    it('should stop iteration if callback returns true', () => {
        const arr = [1, 2, 3];
        const cb = vi.fn().mockReturnValueOnce(true);
        getEntriesCbOriginal(arr, defaultConfig, cb);

        expect(cb).toHaveBeenCalledTimes(1);
        expect(cb).toHaveBeenCalledWith(0, 1, ENUMERABLE_BIT);
    });

    it.each(['own', 'inherited', 'array', 'symbol'] as const)(
        'should report a throwing %s getter and continue enumerating',
        kind => {
            const key = kind === 'symbol' ? Symbol('broken') : kind === 'array' ? 0 : 'broken';
            const source = kind === 'array' ? [0, 'after'] : {};
            const getter = vi.fn(() => { throw new Error('getter failed'); });
            Object.defineProperty(source, key, { enumerable: true, get: getter });
            const value = kind === 'inherited' ? Object.create(source) : source;
            const cb = vi.fn();

            getEntriesCbOriginal(value, { ...defaultConfig, symbol: true }, cb);

            expect(getter).toHaveBeenCalledTimes(1);
            expect(cb).toHaveBeenCalledWith(key, expect.any(LazyValueError), ENUMERABLE_BIT);
            const failure = cb.mock.calls.find(([entryKey]) => entryKey === key)![1];
            expect(String(failure)).toContain('getter failed');

            // A failed read must not prevent later properties from being visited.
            if (kind === 'array') {
                expect(cb).toHaveBeenCalledWith(1, 'after', ENUMERABLE_BIT);
            }
        }
    );

    it('should continue after a throwing getter while preserving successful getter values', () => {
        const value = {
            get broken() { throw new Error('getter failed'); },
            get valid() { return null; },
            after: 42,
        };
        const cb = vi.fn();

        getEntriesCbOriginal(value, defaultConfig, cb);

        expect(cb).toHaveBeenCalledWith('valid', null, ENUMERABLE_BIT);
        expect(cb).toHaveBeenCalledWith('after', 42, ENUMERABLE_BIT);
    });

    it('should propagate callback errors instead of treating them as getter failures', () => {
        const error = new Error('callback failed');
        expect(() => getEntriesCbOriginal({ a: 1 }, defaultConfig, () => { throw error; }))
            .toThrow(error);
    });
});

describe('getEntriesCb', () => {
    const defaultConfig: WalkingConfig = {
        nonEnumerable: false,
        symbol: false,
        resolver: new Map(),
        expandDepth: 0,
    };

    it('should use resolver if available', () => {
        class Custom {}
        const instance = new Custom();
        const resolverFn = vi.fn();
        const config = {
            ...defaultConfig,
            resolver: new Map([[Custom, resolverFn]]),
        };
        const cb = vi.fn();

        getEntriesCb(instance, config, false, {}, cb);

        expect(resolverFn).toHaveBeenCalled();
    });

    it('should fallback to original if no resolver matches', () => {
        const obj = { a: 1 };
        const cb = vi.fn();
        getEntriesCb(obj, defaultConfig, false, {}, cb);

        expect(cb).toHaveBeenCalledWith('a', 1, ENUMERABLE_BIT);
    });
});

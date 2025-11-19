import { describe, it, expect, vi } from 'vitest';
import { getEntriesCb, getEntriesCbOriginal } from './getEntries';
import { WalkingConfig } from './types';
import { LazyValue } from './custom-class/LazyValueWrapper';

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
        expect(cb).toHaveBeenCalledWith(0, 1, true);
        expect(cb).toHaveBeenCalledWith(1, 2, true);
        expect(cb).toHaveBeenCalledWith(2, 3, true);
    });

    it('should iterate over object properties', () => {
        const obj = { a: 1, b: 2 };
        const cb = vi.fn();
        getEntriesCbOriginal(obj, defaultConfig, cb);

        expect(cb).toHaveBeenCalledTimes(2);
        expect(cb).toHaveBeenCalledWith('a', 1, true);
        expect(cb).toHaveBeenCalledWith('b', 2, true);
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

        expect(cb).toHaveBeenCalledWith('hidden', 'secret', false);
        expect(cb).toHaveBeenCalledWith('[[Prototype]]', Object.prototype, false);
    });

    it('should handle getters as LazyValue when non-enumerable enabled', () => {
        const obj = {
            get computed() { return 'value'; }
        };
        const config = { ...defaultConfig, nonEnumerable: true };
        const cb = vi.fn();

        getEntriesCbOriginal(obj, config, cb);

        expect(cb).toHaveBeenCalledWith('computed', expect.any(LazyValue), true);
    });

    it('should handle symbols when enabled', () => {
        const sym = Symbol('test');
        const obj = { [sym]: 'symbolValue' };
        const config = { ...defaultConfig, symbol: true };
        const cb = vi.fn();

        getEntriesCbOriginal(obj, config, cb);

        expect(cb).toHaveBeenCalledWith(sym, 'symbolValue', true);
    });

    it('should stop iteration if callback returns true', () => {
        const arr = [1, 2, 3];
        const cb = vi.fn().mockReturnValueOnce(true);
        getEntriesCbOriginal(arr, defaultConfig, cb);

        expect(cb).toHaveBeenCalledTimes(1);
        expect(cb).toHaveBeenCalledWith(0, 1, true);
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

        expect(cb).toHaveBeenCalledWith('a', 1, true);
    });
});

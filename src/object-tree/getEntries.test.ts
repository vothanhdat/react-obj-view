import { describe, it, expect, vi } from 'vitest';
import { getEntries, getEntriesOriginal } from './getEntries';
import { WalkingConfig } from './types';
import { LazyValue } from './custom-class/LazyValueWrapper';
import { ENUMERABLE_BIT } from './meta';

describe('getEntriesOriginal', () => {
    const defaultConfig: WalkingConfig = {
        nonEnumerable: false,
        symbol: false,
        resolver: new Map(),
        expandDepth: 0,
    };

    it('should iterate over array indices', () => {
        const arr = [1, 2, 3];
        const entries = Array.from(getEntriesOriginal(arr, defaultConfig), e => [...e]);

        expect(entries).toHaveLength(3);
        expect(entries[0]).toEqual([0, 1, ENUMERABLE_BIT]);
        expect(entries[1]).toEqual([1, 2, ENUMERABLE_BIT]);
        expect(entries[2]).toEqual([2, 3, ENUMERABLE_BIT]);
    });

    it('should iterate over object properties', () => {
        const obj = { a: 1, b: 2 };
        const entries = Array.from(getEntriesOriginal(obj, defaultConfig), e => [...e]);

        expect(entries).toHaveLength(2);
        expect(entries[0]).toEqual(['a', 1, ENUMERABLE_BIT]);
        expect(entries[1]).toEqual(['b', 2, ENUMERABLE_BIT]);
    });

    it('should handle non-enumerable properties when enabled', () => {
        const obj = {};
        Object.defineProperty(obj, 'hidden', {
            value: 'secret',
            enumerable: false,
        });
        const config = { ...defaultConfig, nonEnumerable: true };
        
        const entries = Array.from(getEntriesOriginal(obj, config), e => [...e]);

        expect(entries).toContainEqual(['hidden', 'secret', 0]);
        expect(entries).toContainEqual(['[[Prototype]]', Object.prototype, 0]);
    });

    it('should handle getters as LazyValue when non-enumerable enabled', () => {
        const obj = {
            get computed() { return 'value'; }
        };
        const config = { ...defaultConfig, nonEnumerable: true };
        
        const entries = Array.from(getEntriesOriginal(obj, config), e => [...e]);

        const computedEntry = entries.find(e => e[0] === 'computed');
        expect(computedEntry).toBeDefined();
        expect(computedEntry![1]).toBeInstanceOf(LazyValue);
        expect(computedEntry![2]).toBe(ENUMERABLE_BIT);
    });

    it('should handle symbols when enabled', () => {
        const sym = Symbol('test');
        const obj = { [sym]: 'symbolValue' };
        const config = { ...defaultConfig, symbol: true };
        
        const entries = Array.from(getEntriesOriginal(obj, config), e => [...e]);

        expect(entries).toContainEqual([sym, 'symbolValue', ENUMERABLE_BIT]);
    });
});

describe('getEntries', () => {
    const defaultConfig: WalkingConfig = {
        nonEnumerable: false,
        symbol: false,
        resolver: new Map(),
        expandDepth: 0,
    };

    it('should use resolver if available', () => {
        class Custom {}
        const instance = new Custom();
        const resolverFn = vi.fn(function* () {});
        const config = {
            ...defaultConfig,
            resolver: new Map([[Custom, resolverFn]]),
        };
        
        Array.from(getEntries(instance, config, false, null));

        expect(resolverFn).toHaveBeenCalled();
    });

    it('should fallback to original if no resolver matches', () => {
        const obj = { a: 1 };
        const config = { ...defaultConfig };
        
        const entries = Array.from(getEntries(obj, config, false, null), e => [...e]);

        expect(entries).toHaveLength(1);
        expect(entries[0]).toEqual(['a', 1, ENUMERABLE_BIT]);
    });
});

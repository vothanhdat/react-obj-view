import { describe, it, expect, vi } from 'vitest';
import { groupArrayResolver, groupObjectResolver } from './grouped';
import { WalkingConfig } from '../types';

describe('groupArrayResolver', () => {
    const defaultConfig: WalkingConfig = {
        nonEnumerable: false,
        symbol: false,
        resolver: new Map(),
        expandDepth: 0,
    };

    it('should group array items when length exceeds size', () => {
        const arr = new Array(100).fill(0);
        const size = 10;
        const resolver = groupArrayResolver(size);
        const next = vi.fn(function* () {});
        const stableRef = {};

        Array.from(resolver(arr, next, false, defaultConfig, stableRef));

        expect(next).toHaveBeenCalled();
        const grouped = next.mock.calls[0][0];
        // Check if it's a proxy or grouped structure (implementation detail dependent)
        // But we know it shouldn't be the original array if grouped
        expect(grouped).not.toBe(arr);
    });

    it('should not group array items when length is within size', () => {
        const arr = new Array(5).fill(0);
        const size = 10;
        const resolver = groupArrayResolver(size);
        const next = vi.fn(function* () {});
        const stableRef = {};

        Array.from(resolver(arr, next, false, defaultConfig, stableRef));

        expect(next).toHaveBeenCalledWith(arr);
    });

    it('should not group in preview mode', () => {
        const arr = new Array(100).fill(0);
        const size = 10;
        const resolver = groupArrayResolver(size);
        const next = vi.fn(function* () {});
        const stableRef = {};

        Array.from(resolver(arr, next, true, defaultConfig, stableRef));

        expect(next).toHaveBeenCalledWith(arr);
    });
});

describe('groupObjectResolver', () => {
    const defaultConfig: WalkingConfig = {
        nonEnumerable: false,
        symbol: false,
        resolver: new Map(),
        expandDepth: 0,
    };

    it('should group object properties when size exceeds limit', () => {
        const obj = {} as any;
        for (let i = 0; i < 20; i++) {
            obj[`key${i}`] = i;
        }
        const size = 10;
        const resolver = groupObjectResolver(size);
        const next = vi.fn(function* () {});
        const stableRef = {};

        Array.from(resolver(obj, next, false, defaultConfig, stableRef));

        expect(next).toHaveBeenCalled();
        const grouped = next.mock.calls[0][0];
        expect(grouped).not.toBe(obj);
    });

    it('should not group in preview mode', () => {
        const obj = {} as any;
        const size = 10;
        const resolver = groupObjectResolver(size);
        const next = vi.fn(function* () {});
        const stableRef = {};

        Array.from(resolver(obj, next, true, defaultConfig, stableRef));

        expect(next).toHaveBeenCalledWith(obj);
    });
});

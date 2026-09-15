import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { objectTreeWalkingFactory, parseWalkingMeta } from '../../object-tree/objectWalkingAdapter';
import { useReactTree } from './useReactTree';

describe('tree navigation', () => {
    beforeEach(() => { vi.useFakeTimers(); });
    afterEach(() => {
        cleanup();
        vi.clearAllTimers();
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    const setup = async () => {
        const config = { nonEnumerable: false, symbol: false };
        const value = { child: { answer: 42 } };
        const hook = renderHook(() => useReactTree({
            factory: objectTreeWalkingFactory,
            config,
            expandDepth: 1,
            metaParser: parseWalkingMeta,
            value,
            name: 'root',
            iterateSize: 1,
        }));
        await act(async () => { await vi.advanceTimersByTimeAsync(100); });
        return hook;
    };

    it('finds an already visible path immediately', async () => {
        const { result } = await setup();
        await expect(result.current.expandAndGetIndex(['child'])).resolves.toBe(1);
    });

    it('expands collapsed ancestors and resolves the target index', async () => {
        const { result } = await setup();
        let navigation!: Promise<number>;
        act(() => { navigation = result.current.expandAndGetIndex(['child', 'answer']); });
        await act(async () => { await vi.advanceTimersByTimeAsync(100); });
        await expect(navigation).resolves.toBe(2);
    });

    it('settles a missing path when traversal finishes', async () => {
        const { result } = await setup();
        const settled = vi.fn();
        act(() => { void result.current.expandAndGetIndex(['missing']).then(settled); });
        await act(async () => { await vi.advanceTimersByTimeAsync(100); });
        expect(settled).toHaveBeenCalledWith(-1);
    });

    it('times out even if traversal stops emitting events', async () => {
        const { result } = await setup();
        vi.stubGlobal('requestIdleCallback', vi.fn());
        const settled = vi.fn();
        act(() => { void result.current.expandAndGetIndex(['missing']).then(settled); });
        await act(async () => { await vi.advanceTimersByTimeAsync(1999); });
        expect(settled).not.toHaveBeenCalled();
        await act(async () => { await vi.advanceTimersByTimeAsync(1); });
        expect(settled).toHaveBeenCalledWith(-1);
    });
});

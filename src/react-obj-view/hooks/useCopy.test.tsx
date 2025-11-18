import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCopy } from './useCopy';

describe('useCopy', () => {
    let writeTextMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        // Mock clipboard API
        writeTextMock = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', {
            value: {
                writeText: writeTextMock,
            },
            writable: true,
            configurable: true,
        });

        // Mock requestIdleCallback to execute immediately
        (window as any).requestIdleCallback = (cb: Function) => {
            cb();
            return 0;
        };
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should initialize with correct default state', () => {
        const { result } = renderHook(() => useCopy());

        expect(result.current.copying).toBe(false);
        expect(result.current.copySuccess).toBe(false);
        expect(result.current.copyError).toBeUndefined();
        expect(result.current.canCopy).toBe(true);
    });

    it('should handle successful copy operation', async () => {
        const { result } = renderHook(() => useCopy());

        await act(async () => {
            result.current.handleCopy(async () => 'test value');
        });

        expect(result.current.copySuccess).toBe(true);
        expect(result.current.copying).toBe(false);
        expect(writeTextMock).toHaveBeenCalledWith('test value');
    });

    it('should handle copy error', async () => {
        writeTextMock.mockRejectedValue(new Error('Copy failed'));
        const { result } = renderHook(() => useCopy());

        await act(async () => {
            result.current.handleCopy(async () => 'test value');
        });

        expect(result.current.copyError).toBeDefined();
        expect(result.current.copying).toBe(false);
        expect(result.current.copySuccess).toBe(false);
    });

    it('should allow manual reset', async () => {
        const { result } = renderHook(() => useCopy());

        await act(async () => {
            result.current.handleCopy(async () => 'test value');
        });

        expect(result.current.copySuccess).toBe(true);

        act(() => {
            result.current.handleReset();
        });

        expect(result.current.copySuccess).toBe(false);
        expect(result.current.copyError).toBeUndefined();
        expect(result.current.copying).toBe(false);
        expect(result.current.canCopy).toBe(true);
    });

    it('should handle callback that throws during execution', async () => {
        const { result } = renderHook(() => useCopy());

        await act(async () => {
            result.current.handleCopy(async () => {
                throw new Error('Callback failed');
            });
        });

        expect(result.current.copyError).toBeDefined();
        expect(result.current.copying).toBe(false);
        expect(result.current.copySuccess).toBe(false);
    });
});

import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { LazyValue, LazyValueError } from '../../object-tree/custom-class/LazyValueWrapper';
import { useLazyValue } from './useLazyValue';

describe('useLazyValue', () => {
    it.each([null, undefined, false, 0, ''])('preserves %s when a getter is evaluated', expected => {
        const object = { get value() { return expected; } };
        const value = LazyValue.getInstance(object, 'value');
        const { result } = renderHook(() => useLazyValue({ value }));

        act(() => result.current.lazyValueEmit?.());

        expect(result.current.lazyValueInited).toBe(true);
        expect(result.current.renderValue).toBe(expected);
    });

    it('shows a getter error after evaluation', () => {
        const object = { get value() { throw new Error('failed'); } };
        const value = LazyValue.getInstance(object, 'value');
        const { result } = renderHook(() => useLazyValue({ value }));

        act(() => result.current.lazyValueEmit?.());

        expect(result.current.renderValue).toBeInstanceOf(LazyValueError);
    });
});

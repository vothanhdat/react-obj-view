import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import React, { createRef } from 'react';
import { ObjectView } from './ObjectView';

describe('ObjectView Search Integration', () => {
    // Mock the VirtualScroller to avoid layout issues in jsdom
    vi.mock('../libs/virtual-scroller/VirtualScroller', () => ({
        VirtualScroller: ({ Component, ...props }: any) => {
            return <div data-testid="virtual-scroller"></div>
        }
    }));

    beforeEach(() => {
        vi.useFakeTimers();
        // Mock requestIdleCallback and requestAnimationFrame to run immediately
        vi.stubGlobal('requestIdleCallback', (cb: any) => setTimeout(cb, 0));
        vi.stubGlobal('requestAnimationFrame', (cb: any) => setTimeout(cb, 0));
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    const simpleData = {
        name: "test",
        id: 123,
        nested: {
            foo: "bar",
            baz: 456
        },
        list: [1, 2, 3]
    };

    it('should expose search method via ref', () => {
        const ref = createRef<any>();
        render(<ObjectView valueGetter={() => simpleData} ref={ref} />);

        expect(ref.current).toBeDefined();
        expect(ref.current.search).toBeInstanceOf(Function);
        expect(ref.current.scrollToPaths).toBeInstanceOf(Function);
    });

    it('should find exact matches', async () => {
        const ref = createRef<any>();
        render(<ObjectView valueGetter={() => simpleData} ref={ref} />);

        // Allow initial walk to complete
        await act(async () => {
            vi.runAllTimers();
        });

        const results: any[] = [];
        await act(async () => {
            await ref.current.search("foo", (batch: any[]) => {
                results.push(...batch);
            }, { fullSearch: true });
            vi.runAllTimers();
        });

        // "foo" is a key in nested object
        expect(results.length).toBeGreaterThan(0);
        expect(results.some(path => path.join('.') === 'nested.foo')).toBe(true);
    });

    it('should find values', async () => {
        const ref = createRef<any>();
        render(<ObjectView valueGetter={() => simpleData} ref={ref} />);

        // Allow initial walk to complete
        await act(async () => {
            vi.runAllTimers();
        });

        const results: any[] = [];
        await act(async () => {
            await ref.current.search("bar", (batch: any[]) => {
                results.push(...batch);
            }, { fullSearch: true });
            vi.runAllTimers();
        });

        // "bar" is the value of nested.foo
        expect(results.length).toBeGreaterThan(0);
        // Depending on implementation, it might return path to key or containing object.
        // Usually search finds the property/value and returns path to it.
        // nested.foo has value "bar".
        expect(results.some(path => path.join('.') === 'nested.foo')).toBe(true);
    });

    it('should respect case insensitivity by default', async () => {
        const ref = createRef<any>();
        render(<ObjectView valueGetter={() => simpleData} ref={ref} />);

        // Allow initial walk to complete
        await act(async () => {
            vi.runAllTimers();
        });

        const results: any[] = [];
        await act(async () => {
            await ref.current.search("TEST", (batch: any[]) => {
                results.push(...batch);
            }, { fullSearch: true });
            vi.runAllTimers();
        });

        // "test" is the value of name
        expect(results.length).toBeGreaterThan(0);
        expect(results.some(path => path.join('.') === 'name')).toBe(true);
    });
});

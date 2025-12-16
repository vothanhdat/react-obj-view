import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, fireEvent } from '@testing-library/react';
import React, { createRef } from 'react';
import { ObjectView } from '../ObjectView';
import { ObjectViewHandle } from '../types';
import { SearchComponent } from './SearchComponent';

describe('ObjectView Search Integration', () => {
    // Mock the VirtualScroller to avoid layout issues in jsdom
    vi.mock('../libs/virtual-scroller/VirtualScroller', () => ({
        VirtualScroller: ({ Component, ...props }: any) => {
            return <div data-testid="virtual-scroller"></div>
        }
    }));
    // Mock the spinner to avoid interval-driven updates during tests
    vi.mock('../LoadingSimple', () => ({
        LoadingSimple: () => <span>Loading...</span>,
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

    const buildFilter = (term: string) => {
        const lowered = term.toLowerCase();
        const matcher = lowered.split(/\s+/).filter(Boolean);

        const filterFn = (value: unknown, key: PropertyKey) => {
            const haystack = [key, value]
                .map((v) => {
                    try { return String(v).toLowerCase(); } catch { return ""; }
                })
                .join(" ");

            return matcher.every((token) => haystack.includes(token));
        };

        const markTerm = matcher.length ? new RegExp(matcher.join("|"), "gi") : undefined;

        return { filterFn, markTerm } as const;
    };

    it('should expose search method via ref', async () => {
        const ref = createRef<ObjectViewHandle>();
        render(<ObjectView valueGetter={() => simpleData} ref={ref} />);

        // Allow initial walk to complete to silence "act" warnings
        await act(async () => {
            vi.runAllTimers();
        });

        expect(ref.current).toBeDefined();
        expect(ref.current?.search).toBeInstanceOf(Function);
        expect(ref.current?.scrollToPaths).toBeInstanceOf(Function);
    });

    it('should find exact matches', async () => {
        const ref = createRef<ObjectViewHandle>();
        render(<ObjectView valueGetter={() => simpleData} ref={ref} />);

        // Allow initial walk to complete
        await act(async () => {
            vi.runAllTimers();
        });

        const results: any[] = [];
        const { filterFn, markTerm } = buildFilter("foo");
        await act(async () => {
            await ref.current?.search(filterFn, markTerm, (batch: any[]) => {
                results.push(...batch);
            }, { fullSearch: true });
            vi.runAllTimers();
        });

        // "foo" is a key in nested object
        expect(results.length).toBeGreaterThan(0);
        expect(results.some(path => path.join('.') === 'nested.foo')).toBe(true);
    });

    it('should find values', async () => {
        const ref = createRef<ObjectViewHandle>();
        render(<ObjectView valueGetter={() => simpleData} ref={ref} />);

        // Allow initial walk to complete
        await act(async () => {
            vi.runAllTimers();
        });

        const results: any[] = [];
        const { filterFn, markTerm } = buildFilter("bar");
        await act(async () => {
            await ref.current?.search(filterFn, markTerm, (batch: any[]) => {
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
        const ref = createRef<ObjectViewHandle>();
        render(<ObjectView valueGetter={() => simpleData} ref={ref} />);

        // Allow initial walk to complete
        await act(async () => {
            vi.runAllTimers();
        });

        const results: any[] = [];
        const { filterFn, markTerm } = buildFilter("TEST");
        await act(async () => {
            await ref.current?.search(filterFn, markTerm, (batch: any[]) => {
                results.push(...batch);
            }, { fullSearch: true });
            vi.runAllTimers();
        });

        // "test" is the value of name
        expect(results.length).toBeGreaterThan(0);
        expect(results.some(path => path.join('.') === 'name')).toBe(true);
    });

    it('should clear search term and close on Escape key', async () => {
        const onClose = vi.fn();
        const { getByPlaceholderText } = render(
            <SearchComponent
                active={true}
                onClose={onClose}
                handleSearch={vi.fn().mockResolvedValue(undefined)}
                scrollToPaths={vi.fn()}
            />
        );

        await act(async () => {
            vi.runOnlyPendingTimers();
        });

        const input = getByPlaceholderText('Type to search ...') as HTMLInputElement;

        await act(async () => {
            fireEvent.change(input, { target: { value: 'hello' } });
        });
        expect(input.value).toBe('hello');

        await act(async () => {
            fireEvent.keyDown(input, { key: 'Escape' });
        });

        await act(async () => {
            vi.runOnlyPendingTimers();
        });

        expect(input.value).toBe('');
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});

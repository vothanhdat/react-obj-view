import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useObjectViewSearch } from "./useObjectViewSearch";


describe("useObjectViewSearch", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it("calls handleSearch with undefined args when query is empty", async () => {
        const handleSearch = vi.fn().mockResolvedValue(undefined);
        const options = {};
        const scrollToPaths = vi.fn();

        renderHook(() =>
            useObjectViewSearch({
                active: true,
                handleSearch,
                scrollToPaths,
                options,
            })
        );

        await act(async () => {
            vi.runOnlyPendingTimers();
            await Promise.resolve();
        });

        expect(handleSearch).toHaveBeenCalled();
        const [filterFn, markTerm] = handleSearch.mock.calls.at(-1)!;
        expect(filterFn).toBeUndefined();
        expect(markTerm).toBeUndefined();
    });

    it("debounces input and builds filterFn + markTerm", async () => {
        const handleSearch = vi.fn().mockResolvedValue(undefined);
        const options = {};
        const scrollToPaths = vi.fn();

        const { result } = renderHook(() =>
            useObjectViewSearch({
                active: true,
                handleSearch,
                scrollToPaths,
                options,
            })
        );

        handleSearch.mockClear();

        act(() => {
            result.current.setSearchTerm("foo bar");
        });

        act(() => {
            vi.advanceTimersByTime(100);
        });

        await act(async () => {
            await Promise.resolve();
        });

        expect(handleSearch).toHaveBeenCalled();
        const [filterFn, markTerm] = handleSearch.mock.calls.at(-1)!;
        expect(typeof filterFn).toBe("function");
        expect(markTerm).toBeInstanceOf(RegExp);

        // The matcher checks token order across key/value string.
        expect(filterFn("bar", "foo", [])).toBe(true);
        expect(filterFn("bar", "nope", [])).toBe(false);
    });

    it("accumulates streamed results and scrolls on prev/next", async () => {
        const scrollToPaths = vi.fn();
        const options = {};

        const handleSearch = vi.fn(async (
            _filterFn: any,
            _markTerm: any,
            onResult: (results: any[][]) => void
        ) => {
            onResult([["a"], ["b"]]);
            onResult([["c"]]);
        });

        const { result } = renderHook(() =>
            useObjectViewSearch({
                active: true,
                handleSearch,
                scrollToPaths,
                options,
            })
        );

        // Ignore the initial empty-query search.
        handleSearch.mockClear();
        scrollToPaths.mockClear();

        act(() => {
            result.current.setSearchTerm("a");
        });

        act(() => {
            vi.advanceTimersByTime(100);
        });

        await act(async () => {
            await Promise.resolve();
        });

        // Allow state updates from onResult batching.
        await act(async () => {
            await Promise.resolve();
        });

        expect(handleSearch).toHaveBeenCalled();
        expect(result.current.results.results.length).toBe(3);

        // Initial position should scroll to first result.
        expect(scrollToPaths).toHaveBeenCalled();
        expect(scrollToPaths.mock.calls.at(-1)![0]).toEqual(["a"]);

        act(() => {
            result.current.next();
        });

        await act(async () => {
            await Promise.resolve();
        });

        expect(scrollToPaths.mock.calls.at(-1)![0]).toEqual(["b"]);

        act(() => {
            result.current.prev();
        });

        await act(async () => {
            await Promise.resolve();
        });

        expect(scrollToPaths.mock.calls.at(-1)![0]).toEqual(["a"]);
    });
});

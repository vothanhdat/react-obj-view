import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useWrapper } from "./useWrapper";

describe("useWrapper", () => {
    it("returns a callback that always yields the latest value", () => {
        const { result, rerender } = renderHook(({ value }: { value: string }) => useWrapper(value), {
            initialProps: { value: "first" },
        });

        const firstCallback = result.current;
        expect(firstCallback()).toBe("first");

        rerender({ value: "second" });
        const secondCallback = result.current;

        expect(secondCallback()).toBe("second");
        expect(secondCallback).not.toBe(firstCallback);
    });

    it("memoizes the callback while the value stays the same", () => {
        const { result, rerender } = renderHook(({ value }: { value: number }) => useWrapper(value), {
            initialProps: { value: 1 },
        });

        const initialCallback = result.current;
        expect(initialCallback()).toBe(1);

        rerender({ value: 1 });

        expect(result.current).toBe(initialCallback);
    });
});

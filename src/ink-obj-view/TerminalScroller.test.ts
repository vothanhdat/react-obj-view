import { describe, expect, it } from "vitest";
import { clampFirstVisible } from "./TerminalScroller";

describe("clampFirstVisible", () => {
    it("returns 0 when totalRows is 0", () => {
        expect(clampFirstVisible(0, 0, 10, 0)).toBe(0);
    });

    it("keeps first visible when focus is in range", () => {
        expect(clampFirstVisible(5, 0, 10, 100)).toBe(0);
    });

    it("scrolls down when focus moves past visible window", () => {
        const next = clampFirstVisible(15, 0, 10, 100);
        expect(next).toBeGreaterThan(0);
        expect(next).toBeLessThanOrEqual(15);
    });

    it("scrolls up when focus moves above first visible", () => {
        const next = clampFirstVisible(2, 20, 10, 100);
        expect(next).toBeLessThanOrEqual(2);
    });

    it("caps first visible at max scroll position", () => {
        expect(clampFirstVisible(99, 50, 10, 100)).toBeLessThanOrEqual(90);
    });
});

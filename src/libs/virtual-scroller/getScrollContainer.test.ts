import { afterEach, describe, expect, it, vi } from "vitest";
import { getScrollContainer } from "./getScrollContainer";

const styleWithOverflow = (overflowValue: string): CSSStyleDeclaration => ({
    overflowY: overflowValue,
    overflow: overflowValue,
} as CSSStyleDeclaration);

describe("getScrollContainer", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("returns the element itself when it is scrollable", () => {
        const element = document.createElement("div");
        vi.spyOn(window, "getComputedStyle").mockReturnValue(styleWithOverflow("auto"));

        expect(getScrollContainer(element)).toBe(element);
    });

    it("bubbles up to the first scrollable ancestor", () => {
        const parent = document.createElement("section");
        const child = document.createElement("div");
        parent.appendChild(child);

        const styles = new Map<HTMLElement, CSSStyleDeclaration>([
            [child, styleWithOverflow("hidden")],
            [parent, styleWithOverflow("scroll")],
        ]);

        vi.spyOn(window, "getComputedStyle").mockImplementation((target: Element) => {
            return styles.get(target as HTMLElement) ?? styleWithOverflow("visible");
        });

        expect(getScrollContainer(child)).toBe(parent);
    });

    it("falls back to the documentElement when nothing is scrollable", () => {
        const element = document.createElement("article");
        const ancestor = document.createElement("main");
        ancestor.appendChild(element);

        vi.spyOn(window, "getComputedStyle").mockReturnValue(styleWithOverflow("visible"));

        expect(getScrollContainer(element)).toBe(document.documentElement);
    });
});

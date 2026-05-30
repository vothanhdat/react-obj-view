import { describe, expect, it } from "vitest";
import { formatValueRaw, formatValuePreview, segmentsText } from "./formatValue";
import { themeDark } from "../tui-obj-view-themes";
import { DEFAULT_RESOLVER, TYPED_ARRAY_RESOLVERS } from "../object-tree";

const resolver = new Map([...DEFAULT_RESOLVER, ...TYPED_ARRAY_RESOLVERS]);

describe("formatValueRaw", () => {
    it("formats primitives", () => {
        expect(segmentsText(formatValueRaw(true, themeDark))).toBe("true");
        expect(segmentsText(formatValueRaw(42, themeDark))).toBe("42");
        expect(segmentsText(formatValueRaw(123n, themeDark))).toBe("123n");
        expect(segmentsText(formatValueRaw("hi", themeDark))).toBe('"hi"');
        expect(segmentsText(formatValueRaw(null, themeDark))).toBe("null");
        expect(segmentsText(formatValueRaw(undefined, themeDark))).toBe("undefined");
    });

    it("formats arrays/objects as type labels", () => {
        expect(segmentsText(formatValueRaw([1, 2], themeDark))).toBe("Array(2)");
        expect(segmentsText(formatValueRaw({ a: 1 }, themeDark))).toBe("{…}");
        expect(segmentsText(formatValueRaw(new Map([[1, 2]]), themeDark))).toBe("Map(1)");
        expect(segmentsText(formatValueRaw(new Set([1]), themeDark))).toBe("Set(1)");
    });

    it("escapes special chars in strings", () => {
        expect(segmentsText(formatValueRaw("a\nb", themeDark))).toBe('"a\\nb"');
    });

    it("attaches a theme entry per segment", () => {
        const segs = formatValueRaw("hi", themeDark);
        expect(segs).toHaveLength(1);
        expect(segs[0].entry).toBeDefined();
    });
});

describe("formatValuePreview", () => {
    it("renders inline preview for objects", () => {
        const text = segmentsText(formatValuePreview({ a: 1, b: 2 }, { theme: themeDark, resolver }));
        expect(text).toContain("a: 1");
        expect(text).toContain("b: 2");
        expect(text.startsWith("{")).toBe(true);
        expect(text.endsWith("}")).toBe(true);
    });

    it("renders inline preview for arrays without keys", () => {
        const text = segmentsText(formatValuePreview([10, 20, 30], { theme: themeDark, resolver }));
        expect(text).toContain("10");
        expect(text).toContain("20");
        expect(text).not.toContain("0: 10");
    });

    it("truncates long previews", () => {
        const text = segmentsText(formatValuePreview({ a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7 }, { theme: themeDark, resolver }));
        expect(text).toContain(",…");
    });
});

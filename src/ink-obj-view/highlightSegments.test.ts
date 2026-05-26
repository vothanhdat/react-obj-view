import { describe, expect, it } from "vitest";
import { buildMarkRegex, highlightSegments } from "./highlightSegments";
import { segmentsText } from "./formatValue";

const markEntry = { inverse: true };

describe("buildMarkRegex", () => {
    it("returns undefined for empty term", () => {
        expect(buildMarkRegex(undefined)).toBeUndefined();
        expect(buildMarkRegex("")).toBeUndefined();
        expect(buildMarkRegex("   ")).toBeUndefined();
    });

    it("escapes regex metachars and joins tokens", () => {
        const r = buildMarkRegex("a.b c")!;
        expect(r.source).toBe("(a\\.b|c)");
        expect("a.b".match(r)).not.toBeNull();
    });

    it("returns regex inputs unchanged", () => {
        const r = /foo/g;
        expect(buildMarkRegex(r)).toBe(r);
    });
});

describe("highlightSegments", () => {
    it("returns input unchanged when regex is undefined", () => {
        const segs = [{ text: "hello", entry: { color: "red" } }];
        expect(highlightSegments(segs, undefined, markEntry)).toBe(segs);
    });

    it("splits matched runs and merges mark entry", () => {
        const segs = [{ text: "hello world hello", entry: { color: "red" } }];
        const out = highlightSegments(segs, /hello/gi, markEntry);
        expect(segmentsText(out)).toBe("hello world hello");
        const inverted = out.filter(s => (s.entry as any).inverse);
        expect(inverted).toHaveLength(2);
        expect(inverted.every(s => s.text.toLowerCase() === "hello")).toBe(true);
    });

    it("handles segments without matches", () => {
        const segs = [{ text: "abc", entry: { color: "red" } }];
        const out = highlightSegments(segs, /xyz/gi, markEntry);
        expect(out).toEqual(segs);
    });
});

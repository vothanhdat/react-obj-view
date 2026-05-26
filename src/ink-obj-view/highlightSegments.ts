import { InkThemeEntry } from "../ink-obj-view-themes";
import { Segment } from "./formatValue";

export const highlightSegments = (
    segments: Segment[],
    regex: RegExp | undefined,
    markEntry: InkThemeEntry,
): Segment[] => {
    if (!regex) return segments;

    const safeRegex = regex.global ? regex : new RegExp(regex.source, regex.flags + "g");

    const out: Segment[] = [];

    for (const seg of segments) {
        if (!seg.text) {
            out.push(seg);
            continue;
        }

        safeRegex.lastIndex = 0;
        let lastIndex = 0;
        let matched = false;
        let m: RegExpExecArray | null;
        while ((m = safeRegex.exec(seg.text)) !== null) {
            matched = true;
            const before = seg.text.slice(lastIndex, m.index);
            if (before) out.push({ text: before, entry: seg.entry });
            out.push({ text: m[0], entry: { ...seg.entry, ...markEntry } });
            lastIndex = m.index + m[0].length;
            if (m[0].length === 0) safeRegex.lastIndex += 1;
        }
        if (!matched) {
            out.push(seg);
        } else if (lastIndex < seg.text.length) {
            out.push({ text: seg.text.slice(lastIndex), entry: seg.entry });
        }
    }

    return out;
};

export const buildMarkRegex = (term: string | RegExp | undefined): RegExp | undefined => {
    if (!term) return undefined;
    if (term instanceof RegExp) return term;
    const tokens = String(term).split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return undefined;
    const escaped = tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    return new RegExp(`(${escaped.join("|")})`, "gi");
};

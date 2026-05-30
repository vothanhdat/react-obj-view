import {
    getEntriesCb,
    CustomEntry,
    CustomIterator,
    GroupedProxy,
    ItemViewBase,
    LazyValue,
    LazyValueError,
    InternalPromise,
} from "../object-tree";
import { ENUMERABLE_BIT } from "../object-tree/meta" with { type: "macro" };
import { TuiTheme, TuiThemeEntry, tuiThemeKeys } from "../tui-obj-view-themes";

export type Segment = {
    text: string;
    entry?: TuiThemeEntry;
};

const MAX_STRING_LEN_RAW = 200;
const MAX_STRING_LEN_PREVIEW = 32;
const MAX_PREVIEW_ENTRIES = 5;

const themeFor = (theme: TuiTheme, key: keyof typeof tuiThemeKeys): TuiThemeEntry =>
    theme[tuiThemeKeys[key]] ?? {};

const truncateString = (s: string, max: number): string =>
    s.length > max ? s.slice(0, max) + "…" : s;

const escapeString = (s: string): string =>
    s.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");

const formatStringValue = (value: string, theme: TuiTheme, maxLen: number): Segment[] => [
    { text: `"${escapeString(truncateString(value, maxLen))}"`, entry: themeFor(theme, "string") },
];

const formatFunction = (value: Function, theme: TuiTheme): Segment[] => {
    const name = value.name || "anonymous";
    return [{ text: `ƒ ${name}()`, entry: themeFor(theme, "fn") }];
};

const formatTypeLabel = (value: unknown, theme: TuiTheme): Segment[] => {
    if (value === null) return [{ text: "null", entry: themeFor(theme, "nullish") }];
    if (value === undefined) return [{ text: "undefined", entry: themeFor(theme, "nullish") }];
    if (Array.isArray(value)) return [{ text: `Array(${value.length})`, entry: themeFor(theme, "array") }];
    if (value instanceof Map) return [{ text: `Map(${value.size})`, entry: themeFor(theme, "map") }];
    if (value instanceof Set) return [{ text: `Set(${value.size})`, entry: themeFor(theme, "set") }];
    if (value instanceof Date) return [{ text: value.toISOString(), entry: themeFor(theme, "date") }];
    if (value instanceof RegExp) return [{ text: String(value), entry: themeFor(theme, "regex") }];
    if (value instanceof Error) return [{ text: String(value), entry: themeFor(theme, "error") }];
    if (value instanceof Promise) return [{ text: "Promise", entry: themeFor(theme, "promise") }];
    if (typeof value === "object" && value) {
        const ctor = (value as any).constructor;
        const name = ctor && ctor !== Object ? ctor.name : "{…}";
        return [{ text: name, entry: themeFor(theme, "object") }];
    }
    return [{ text: String(value), entry: themeFor(theme, "object") }];
};

const formatPrimitive = (value: unknown, theme: TuiTheme, maxStringLen: number): Segment[] | null => {
    switch (typeof value) {
        case "boolean":
            return [{ text: String(value), entry: themeFor(theme, "bool") }];
        case "number":
            return [{ text: String(value), entry: themeFor(theme, "number") }];
        case "bigint":
            return [{ text: String(value) + "n", entry: themeFor(theme, "bigint") }];
        case "string":
            return formatStringValue(value, theme, maxStringLen);
        case "symbol":
            return [{ text: value.toString(), entry: themeFor(theme, "symbol") }];
        case "undefined":
            return [{ text: "undefined", entry: themeFor(theme, "nullish") }];
        case "function":
            return formatFunction(value, theme);
    }
    return null;
};

export type FormatValueOpts = {
    theme: TuiTheme;
    resolver: Map<any, any>;
    includeSymbols?: boolean;
};

export type FormatValueRawOpts = {
    maxStringLen?: number;
};

export const formatValueRaw = (
    value: unknown,
    theme: TuiTheme,
    opts: FormatValueRawOpts = {},
): Segment[] => {
    const maxStringLen = opts.maxStringLen ?? MAX_STRING_LEN_RAW;
    const prim = formatPrimitive(value, theme, maxStringLen);
    if (prim) return prim;
    if (value === null) return [{ text: "null", entry: themeFor(theme, "nullish") }];
    if (value instanceof LazyValueError) return [{ text: `LazyValueError: ${value.message ?? "?"}`, entry: themeFor(theme, "error") }];
    if (value instanceof LazyValue) return [{ text: "(lazy)", entry: themeFor(theme, "status") }];
    if (value instanceof InternalPromise) return [{ text: "(pending)", entry: themeFor(theme, "status") }];
    if (value instanceof CustomEntry) return [{ text: "[entry]", entry: themeFor(theme, "object") }];
    if (value instanceof ItemViewBase) return [{ text: "[item]", entry: themeFor(theme, "object") }];
    if (value instanceof GroupedProxy) return [{ text: "[group]", entry: themeFor(theme, "object") }];
    return formatTypeLabel(value, theme);
};

export const formatValuePreview = (value: unknown, { theme, resolver, includeSymbols }: FormatValueOpts): Segment[] => {
    const previewOpts: FormatValueRawOpts = { maxStringLen: MAX_STRING_LEN_PREVIEW };
    if (value === null || value === undefined) return formatValueRaw(value, theme, previewOpts);
    const prim = formatPrimitive(value, theme, MAX_STRING_LEN_PREVIEW);
    if (prim) return prim;
    if (value instanceof Date || value instanceof RegExp || value instanceof Error
        || value instanceof LazyValue || value instanceof LazyValueError
        || value instanceof InternalPromise || value instanceof GroupedProxy
        || value instanceof ItemViewBase || value instanceof CustomEntry) {
        return formatValueRaw(value, theme, previewOpts);
    }
    if (typeof value !== "object") return formatValueRaw(value, theme, previewOpts);

    const isArray = Array.isArray(value);
    const hideKey = isArray
        || value instanceof Set
        || value instanceof Map
        || value instanceof CustomIterator
        || value instanceof Promise;

    const entries: { key: PropertyKey; value: unknown; enumerable: boolean }[] = [];
    try {
        getEntriesCb(
            value,
            {
                expandDepth: 0,
                nonEnumerable: false,
                resolver,
                symbol: !!includeSymbols,
            } as any,
            true,
            {},
            (key, v, meta) => {
                entries.push({ key, value: v, enumerable: !!(meta & ENUMERABLE_BIT) });
                return entries.length > MAX_PREVIEW_ENTRIES;
            },
        );
    } catch {
        // best-effort preview
    }

    const enumerableEntries = entries.filter(e => e.enumerable);

    const ctor = (value as any).constructor;
    const renderType = ctor && ctor !== Object && ctor !== Array ? (ctor.name ?? "") : "";
    const wrap = isArray ? ["[", "]"] : ["{", "}"];

    const segments: Segment[] = [];
    if (renderType) segments.push({ text: renderType + " ", entry: themeFor(theme, "object") });
    segments.push({ text: wrap[0], entry: themeFor(theme, "object") });

    enumerableEntries.forEach((entry, i) => {
        if (i > 0) segments.push({ text: ", ", entry: themeFor(theme, "object") });
        if (!hideKey) {
            segments.push({ text: String(entry.key), entry: themeFor(theme, "key") });
            segments.push({ text: ": ", entry: themeFor(theme, "object") });
        }
        segments.push(...formatValueRaw(entry.value, theme, { maxStringLen: MAX_STRING_LEN_PREVIEW }));
    });

    if (entries.length > MAX_PREVIEW_ENTRIES) {
        segments.push({ text: ",…", entry: themeFor(theme, "object") });
    }

    segments.push({ text: wrap[1], entry: themeFor(theme, "object") });
    return segments;
};

export const segmentsText = (segments: Segment[]): string =>
    segments.map(s => s.text).join("");

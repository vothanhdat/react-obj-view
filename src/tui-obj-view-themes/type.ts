// Mirror of @opentui/core's `TextAttributes` bit flags. Inlined intentionally:
// importing anything from `@opentui/core` eagerly loads its native (FFI) backend,
// which would drag the heavy renderer into the pure theme/formatter path (and
// break it outside Bun). These values are a stable part of OpenTUI's wire format.
const TextAttributes = {
    NONE: 0,
    BOLD: 1 << 0,
    DIM: 1 << 1,
    ITALIC: 1 << 2,
    UNDERLINE: 1 << 3,
    BLINK: 1 << 4,
    INVERSE: 1 << 5,
    HIDDEN: 1 << 6,
    STRIKETHROUGH: 1 << 7,
} as const;

export const tuiThemeKeys = {
    key: "key",
    bool: "bool",
    number: "number",
    bigint: "bigint",
    string: "string",
    symbol: "symbol",
    nullish: "nullish",
    array: "array",
    object: "object",
    promise: "promise",
    map: "map",
    set: "set",
    fn: "fn",
    regex: "regex",
    date: "date",
    error: "error",
    circular: "circular",
    expand: "expand",
    indent: "indent",
    mark: "mark",
    nonEnumerable: "nonEnumerable",
    status: "status",
} as const;

export type TuiThemeKey = (typeof tuiThemeKeys)[keyof typeof tuiThemeKeys];

/**
 * A theme entry stays plain so it can be merged/extended at the call site.
 * Booleans are converted to OpenTUI's bitwise `attributes` via `themeEntryToTextProps`
 * (or `mergeThemeEntries` for combining base + override before rendering).
 *
 * Colors accept any CSS color name or hex string — OpenTUI's `parseColor` handles both.
 */
export type TuiThemeEntry = {
    fg?: string;
    bg?: string;
    bold?: boolean;
    dim?: boolean;
    italic?: boolean;
    underline?: boolean;
    inverse?: boolean;
};

export type TuiTheme = Record<TuiThemeKey, TuiThemeEntry>;

export type TuiThemeOverrides = Partial<TuiTheme>;

export const createTuiTheme = (values: TuiTheme): TuiTheme => ({ ...values });

export const extendTuiTheme = (base: TuiTheme, overrides: TuiThemeOverrides = {}): TuiTheme => {
    const merged = { ...base } as TuiTheme;
    for (const key of Object.keys(overrides) as TuiThemeKey[]) {
        const o = overrides[key];
        if (o) merged[key] = { ...base[key], ...o };
    }
    return merged;
};

/**
 * Merge a chain of entries (left to right; later wins). Returns a fresh object
 * so callers can freely mutate without affecting the theme.
 */
export const mergeThemeEntries = (
    ...entries: (TuiThemeEntry | undefined)[]
): TuiThemeEntry => {
    const out: TuiThemeEntry = {};
    for (const e of entries) {
        if (!e) continue;
        if (e.fg !== undefined) out.fg = e.fg;
        if (e.bg !== undefined) out.bg = e.bg;
        if (e.bold !== undefined) out.bold = e.bold;
        if (e.dim !== undefined) out.dim = e.dim;
        if (e.italic !== undefined) out.italic = e.italic;
        if (e.underline !== undefined) out.underline = e.underline;
        if (e.inverse !== undefined) out.inverse = e.inverse;
    }
    return out;
};

/** Bit-pack boolean attributes into OpenTUI's `attributes` u32. */
export const themeEntryToAttributes = (entry: TuiThemeEntry | undefined): number => {
    if (!entry) return TextAttributes.NONE;
    let a = TextAttributes.NONE;
    if (entry.bold) a |= TextAttributes.BOLD;
    if (entry.dim) a |= TextAttributes.DIM;
    if (entry.italic) a |= TextAttributes.ITALIC;
    if (entry.underline) a |= TextAttributes.UNDERLINE;
    if (entry.inverse) a |= TextAttributes.INVERSE;
    return a;
};

/**
 * Convert a theme entry into OpenTUI `<text>` / `<span>` props.
 * Returns an object with only the keys that are set, so callers can safely spread.
 */
export const themeEntryToTextProps = (
    entry: TuiThemeEntry | undefined,
): { fg?: string; bg?: string; attributes?: number } => {
    if (!entry) return {};
    const out: { fg?: string; bg?: string; attributes?: number } = {};
    if (entry.fg !== undefined) out.fg = entry.fg;
    if (entry.bg !== undefined) out.bg = entry.bg;
    const a = themeEntryToAttributes(entry);
    if (a !== TextAttributes.NONE) out.attributes = a;
    return out;
};

export const inkThemeKeys = {
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

export type InkThemeKey = (typeof inkThemeKeys)[keyof typeof inkThemeKeys];

export type InkThemeEntry = {
    color?: string;
    backgroundColor?: string;
    bold?: boolean;
    dimColor?: boolean;
    italic?: boolean;
    underline?: boolean;
    inverse?: boolean;
};

export type InkTheme = Record<InkThemeKey, InkThemeEntry>;

export type InkThemeOverrides = Partial<InkTheme>;

export const createInkTheme = (values: InkTheme): InkTheme => ({ ...values });

export const extendInkTheme = (base: InkTheme, overrides: InkThemeOverrides = {}): InkTheme => {
    const merged = { ...base } as InkTheme;
    for (const key of Object.keys(overrides) as InkThemeKey[]) {
        const o = overrides[key];
        if (o) merged[key] = { ...base[key], ...o };
    }
    return merged;
};

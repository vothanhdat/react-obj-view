import { InkTheme, createInkTheme } from "./type";

export const themeDark: InkTheme = createInkTheme({
    key: { color: "white" },
    bool: { color: "blueBright" },
    number: { color: "red" },
    bigint: { color: "red" },
    string: { color: "yellow" },
    symbol: { color: "magenta" },
    nullish: { color: "gray", dimColor: true },
    array: { color: "cyan" },
    object: { color: "cyan" },
    promise: { color: "cyan" },
    map: { color: "cyan" },
    set: { color: "cyan" },
    fn: { color: "blueBright" },
    regex: { color: "red" },
    date: { color: "blueBright" },
    error: { color: "redBright" },
    circular: { color: "magenta", bold: true },
    expand: { color: "gray" },
    indent: { color: "gray", dimColor: true },
    mark: { color: "black", backgroundColor: "yellow", bold: true },
    nonEnumerable: { color: "gray", dimColor: true, italic: true },
    status: { color: "gray", dimColor: true },
});

export const themeLight: InkTheme = createInkTheme({
    ...themeDark,
    key: { color: "black" },
    string: { color: "magenta" },
});

export const themeMono: InkTheme = createInkTheme({
    key: {},
    bool: { bold: true },
    number: { bold: true },
    bigint: { bold: true },
    string: {},
    symbol: { italic: true },
    nullish: { dimColor: true },
    array: { dimColor: true },
    object: { dimColor: true },
    promise: { dimColor: true },
    map: { dimColor: true },
    set: { dimColor: true },
    fn: { italic: true },
    regex: { bold: true },
    date: {},
    error: { bold: true },
    circular: { bold: true },
    expand: { dimColor: true },
    indent: { dimColor: true },
    mark: { inverse: true },
    nonEnumerable: { dimColor: true, italic: true },
    status: { dimColor: true },
});

export const builtInInkThemes = {
    dark: themeDark,
    light: themeLight,
    mono: themeMono,
} as const;

export type BuiltInInkThemeName = keyof typeof builtInInkThemes;

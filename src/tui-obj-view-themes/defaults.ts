import { TuiTheme, createTuiTheme } from "./type";

// OpenTUI's parseColor accepts CSS named colors and hex strings.
// "blueBright" / "redBright" are chalk-specific; we substitute hex for those.
const BLUE_BRIGHT = "#5C9DFF";
const RED_BRIGHT = "#FF5C5C";

export const themeDark: TuiTheme = createTuiTheme({
    key: { fg: "white" },
    bool: { fg: BLUE_BRIGHT },
    number: { fg: "red" },
    bigint: { fg: "red" },
    string: { fg: "yellow" },
    symbol: { fg: "magenta" },
    nullish: { fg: "gray", dim: true },
    array: { fg: "cyan" },
    object: { fg: "cyan" },
    promise: { fg: "cyan" },
    map: { fg: "cyan" },
    set: { fg: "cyan" },
    fn: { fg: BLUE_BRIGHT },
    regex: { fg: "red" },
    date: { fg: BLUE_BRIGHT },
    error: { fg: RED_BRIGHT },
    circular: { fg: "magenta", bold: true },
    expand: { fg: "gray" },
    indent: { fg: "gray", dim: true },
    mark: { fg: "black", bg: "yellow", bold: true },
    nonEnumerable: { fg: "gray", dim: true, italic: true },
    status: { fg: "gray", dim: true },
});

export const themeLight: TuiTheme = createTuiTheme({
    ...themeDark,
    key: { fg: "black" },
    string: { fg: "magenta" },
});

export const themeMono: TuiTheme = createTuiTheme({
    key: {},
    bool: { bold: true },
    number: { bold: true },
    bigint: { bold: true },
    string: {},
    symbol: { italic: true },
    nullish: { dim: true },
    array: { dim: true },
    object: { dim: true },
    promise: { dim: true },
    map: { dim: true },
    set: { dim: true },
    fn: { italic: true },
    regex: { bold: true },
    date: {},
    error: { bold: true },
    circular: { bold: true },
    expand: { dim: true },
    indent: { dim: true },
    mark: { inverse: true },
    nonEnumerable: { dim: true, italic: true },
    status: { dim: true },
});

export const builtInTuiThemes = {
    dark: themeDark,
    light: themeLight,
    mono: themeMono,
} as const;

export type BuiltInTuiThemeName = keyof typeof builtInTuiThemes;

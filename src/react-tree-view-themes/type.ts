import React from "react";

export type ThemeKeys =
    "--bigobjview-color"
    | "--bigobjview-bg-color"
    | "--bigobjview-change-color"
    | "--bigobjview-fontsize"
    | "--bigobjview-type-boolean-color"
    | "--bigobjview-type-number-color"
    | "--bigobjview-type-bigint-color"
    | "--bigobjview-type-string-color"
    | "--bigobjview-type-object-array-color"
    | "--bigobjview-type-object-object-color"
    | "--bigobjview-type-object-promise-color"
    | "--bigobjview-type-object-map-color"
    | "--bigobjview-type-object-set-color"
    | "--bigobjview-type-function-color"
    | "--bigobjview-type-object-regexp-color"
    | "--bigobjview-type-object-date-color"
    | "--bigobjview-type-object-error-color";

export type ThemeColor = Record<ThemeKeys, string> & React.CSSProperties;

// Maintain a single ordered source of every CSS variable we expose so we can
// build compact themes without repeating the keys.
export const themeKeys = [
    "--bigobjview-color",
    "--bigobjview-bg-color",
    "--bigobjview-change-color",
    "--bigobjview-fontsize",
    "--bigobjview-type-boolean-color",
    "--bigobjview-type-number-color",
    "--bigobjview-type-bigint-color",
    "--bigobjview-type-string-color",
    "--bigobjview-type-object-array-color",
    "--bigobjview-type-object-object-color",
    "--bigobjview-type-object-promise-color",
    "--bigobjview-type-object-map-color",
    "--bigobjview-type-object-set-color",
    "--bigobjview-type-function-color",
    "--bigobjview-type-object-regexp-color",
    "--bigobjview-type-object-date-color",
    "--bigobjview-type-object-error-color",
] as const satisfies ThemeKeys[];

export const themeKeyIndex = themeKeys.reduce(
    (memo, key, index) => {
        memo[key] = index;
        return memo;
    },
    {} as Record<ThemeKeys, number>,
);

type ThemeTuple = ReadonlyArray<string>;

export const createThemeFromValues = (values: ThemeTuple, extra?: React.CSSProperties): ThemeColor => {
    const theme = {} as ThemeColor;

    if (values.length !== themeKeys.length) {
        throw new Error(`Theme values must provide ${themeKeys.length} entries, received ${values.length}`);
    }

    themeKeys.forEach((key, index) => {
        theme[key] = values[index];
    });

    return extra ? Object.assign(theme, extra) : theme;
};

export type ThemeValueMap = Record<ThemeKeys, string>;

export type ThemeOverrides = Partial<Record<ThemeKeys, string>> & React.CSSProperties;

export const createTheme = (values: ThemeValueMap, extra?: React.CSSProperties): ThemeColor => {
    const tuple = themeKeys.map((key) => {
        const value = values[key];
        if (value == null) {
            throw new Error(`Missing value for theme key "${key}"`);
        }

        return value;
    });

    return createThemeFromValues(tuple, extra);
};

export const extendTheme = (baseTheme: ThemeColor, overrides: ThemeOverrides = {}): ThemeColor => {
    const theme = { ...baseTheme };

    themeKeys.forEach((key) => {
        if (overrides[key] !== undefined) {
            theme[key] = overrides[key] as string;
        }
    });

    return Object.assign(theme, overrides);
};

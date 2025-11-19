import React from "react";

export const colorThemeKeys = {
    color: "--bigobjview-color",
    bg: "--bigobjview-bg-color",
    change: "--bigobjview-change-color",
    fontsize: "--bigobjview-fontsize",
    bool: "--bigobjview-type-boolean-color",
    number: "--bigobjview-type-number-color",
    bigint: "--bigobjview-type-bigint-color",
    string: "--bigobjview-type-string-color",
    array: "--bigobjview-type-object-array-color",
    object: "--bigobjview-type-object-object-color",
    promise: "--bigobjview-type-object-promise-color",
    map: "--bigobjview-type-object-map-color",
    set: "--bigobjview-type-object-set-color",
    fn: "--bigobjview-type-function-color",
    regex: "--bigobjview-type-object-regexp-color",
    date: "--bigobjview-type-object-date-color",
    error: "--bigobjview-type-object-error-color",
    acBtn: "--bigobjview-action-btn",
    acSuccess: "--bigobjview-action-success",
    acErr: "--bigobjview-action-error",
} as const

export type ThemeKeys = typeof colorThemeKeys[keyof typeof colorThemeKeys]

export type ThemeColor = Record<ThemeKeys, string> & React.CSSProperties;

export type ThemeValueMap = Record<ThemeKeys, string>;

export type ThemeOverrides = Partial<Record<ThemeKeys, string>> & React.CSSProperties;

export const createTheme = (values: ThemeValueMap, extra?: React.CSSProperties): ThemeColor => {
    const theme = { ...values } as ThemeColor;

    return extra ? Object.assign(theme, extra) : theme;
};

export const extendTheme = (baseTheme: ThemeColor, overrides: ThemeOverrides = {}): ThemeColor => {
    return { ...baseTheme, ...overrides } as ThemeColor;
};

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

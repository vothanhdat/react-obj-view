/** @jsxImportSource @opentui/react */
import React from "react";
import { TuiTheme, tuiThemeKeys, themeEntryToTextProps } from "../tui-obj-view-themes";

export type SearchInputProps = {
    value: string;
    onChange: (next: string) => void;
    onSubmit: (value: string) => void;
    onCancel: () => void;
    theme: TuiTheme;
    matchCount: number;
    currentMatch: number;
    searching: boolean;
};

export const SearchInput = ({
    value, onChange, onSubmit, theme, matchCount, currentMatch, searching,
}: SearchInputProps): React.ReactNode => {
    const statusProps = themeEntryToTextProps(theme[tuiThemeKeys.status]);
    const status = searching
        ? "…"
        : matchCount > 0
            ? `${currentMatch + 1}/${matchCount}`
            : value
                ? "0/0"
                : "";

    return (
        <box flexDirection="row" flexShrink={0}>
            <text {...statusProps}>/ </text>
            <input
                focused
                value={value}
                flexGrow={1}
                onInput={onChange}
                onSubmit={() => onSubmit(value)}
                placeholder="search (esc to close)"
            />
            <text {...statusProps}>  {status}</text>
        </box>
    );
};

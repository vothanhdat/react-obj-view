import React from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import { InkTheme, inkThemeKeys } from "../ink-obj-view-themes";

export type SearchInputProps = {
    value: string;
    onChange: (next: string) => void;
    onSubmit: (value: string) => void;
    onCancel: () => void;
    theme: InkTheme;
    matchCount: number;
    currentMatch: number;
    searching: boolean;
};

export const SearchInput: React.FC<SearchInputProps> = ({
    value, onChange, onSubmit, theme, matchCount, currentMatch, searching,
}) => {
    return (
        <Box flexDirection="row">
            <Text {...theme[inkThemeKeys.status]}>/ </Text>
            <TextInput
                value={value}
                onChange={onChange}
                onSubmit={onSubmit}
                placeholder="search (esc to close)"
            />
            <Text {...theme[inkThemeKeys.status]}>
                {"  "}
                {searching ? "…" : matchCount > 0 ? `${currentMatch + 1}/${matchCount}` : value ? "0/0" : ""}
            </Text>
        </Box>
    );
};

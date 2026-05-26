import React, { useMemo } from "react";
import { Box, Text } from "ink";
import { objectHasChild, GroupedProxy, LazyValueError, LazyValue } from "../object-tree";
import { ObjectViewRenderRowProps } from "../react-obj-view/types";
import { InkTheme, inkThemeKeys } from "../ink-obj-view-themes";
import { formatValuePreview, formatValueRaw, Segment } from "./formatValue";
import { buildMarkRegex, highlightSegments } from "./highlightSegments";

const INDENT_UNIT = "  ";

export type InkRowExtras = {
    theme: InkTheme;
    isFocused: boolean;
    isSearchCurrent: boolean;
    width?: number;
};

export type InkRowProps = ObjectViewRenderRowProps & { extras: InkRowExtras };

const renderSegments = (segments: Segment[], key: string) => (
    <React.Fragment key={key}>
        {segments.map((seg, i) => (
            <Text key={i} {...(seg.entry ?? {})}>
                {seg.text}
            </Text>
        ))}
    </React.Fragment>
);

export const RenderNodeInk: React.FC<InkRowProps> = (props) => {
    const { nodeDataWrapper, valueWrapper, options, extras } = props;
    const { resolver, nonEnumerable, includeSymbols, enablePreview, search } = options;
    const { theme, isFocused, isSearchCurrent } = extras;

    const nodeData = nodeDataWrapper();
    const value = valueWrapper();

    const isExpanded = nodeData.expanded;
    const isCircular = nodeData.isCircular;
    const depth = nodeData.depth;

    const hasChild = objectHasChild(
        value,
        nodeData.meta!,
        { config: { nonEnumerable, resolver } } as any,
    ) && !(value instanceof LazyValue) && !(value instanceof LazyValueError);

    const isPreview = enablePreview
        && hasChild
        && !isExpanded
        && typeof value !== "function"
        && !(value instanceof Error)
        && !(value instanceof GroupedProxy);

    const markRegex = useMemo(() => buildMarkRegex(search?.markTerm), [search?.markTerm]);

    const isSearchMatch = useMemo(
        () => !!search?.filterFn && !!search.filterFn(nodeData.value, nodeData.key, nodeData.paths),
        [search?.filterFn, nodeData.value, nodeData.key, nodeData.paths],
    );

    const expandGlyph = isCircular
        ? "⊗ "
        : hasChild
            ? (isExpanded ? "▼ " : "▶ ")
            : "  ";

    const keyText = depth === 0 ? "ROOT" : String(nodeData.key ?? "");
    const keyEntry = theme[inkThemeKeys.key];
    let keySegments: Segment[] = [{ text: keyText, entry: keyEntry }];
    if (!nodeData.enumerable) {
        keySegments = [{ text: keyText, entry: { ...keyEntry, ...theme[inkThemeKeys.nonEnumerable] } }];
    }
    if (isSearchMatch) {
        keySegments = [{ text: keyText, entry: { ...keyEntry, ...theme[inkThemeKeys.mark] } }];
    }

    let valueSegments: Segment[];
    if (isCircular) {
        valueSegments = [{ text: "[Circular]", entry: theme[inkThemeKeys.circular] }];
    } else if (isPreview) {
        valueSegments = formatValuePreview(value, { theme, resolver, includeSymbols });
    } else {
        valueSegments = formatValueRaw(value, theme);
    }

    if (markRegex) {
        valueSegments = highlightSegments(valueSegments, markRegex, theme[inkThemeKeys.mark]);
    }

    const indentStr = INDENT_UNIT.repeat(Math.max(0, depth));
    const focusMark = isSearchCurrent ? "›" : isFocused ? "›" : " ";

    return (
        <Box flexDirection="row">
            <Text inverse={isFocused} bold={isSearchCurrent}>
                {focusMark}
            </Text>
            <Text {...theme[inkThemeKeys.indent]}>{indentStr}</Text>
            <Text {...theme[inkThemeKeys.expand]}>{expandGlyph}</Text>
            {renderSegments(keySegments, "k")}
            <Text>: </Text>
            {renderSegments(valueSegments, "v")}
        </Box>
    );
};

import React, { useMemo } from "react";
import { Text } from "ink";
import { objectHasChild, GroupedProxy, LazyValueError, LazyValue } from "../object-tree";
import type { FlattenNodeData } from "../libs/react-tree-view/FlattenNodeWrapper";
import type { ObjectWalkingAdapter, ObjectWalkingMetaParser } from "../object-tree";
import type { RenderOptions } from "../react-obj-view/types";
import { InkTheme, InkThemeEntry, inkThemeKeys } from "../ink-obj-view-themes";
import { formatValuePreview, formatValueRaw, Segment } from "./formatValue";
import { buildMarkRegex, highlightSegments } from "./highlightSegments";

const INDENT_UNIT = "  ";

export type InkRowExtras = {
    theme: InkTheme;
    isFocused: boolean;
    isSearchCurrent: boolean;
    isSticky?: boolean;
};

export type RenderNodeInkProps = {
    nodeDataWrapper: () => FlattenNodeData<ObjectWalkingAdapter, ObjectWalkingMetaParser>;
    valueWrapper: () => unknown;
    optionsGetter: () => RenderOptions;
    themeGetter: () => InkTheme;
    renderIndex: number;
    actions: { refreshPath: () => void; toggleChildExpand: () => void };
    isFocused: boolean;
    isSearchCurrent: boolean;
    isSticky?: boolean;
};

const Span: React.FC<{ entry?: InkThemeEntry; children: React.ReactNode }> = ({ entry, children }) => (
    <Text {...(entry ?? {})}>{children}</Text>
);

const SegmentSpans: React.FC<{ segments: Segment[] }> = ({ segments }) => (
    <>
        {segments.map((seg, i) => (
            <Span key={i} entry={seg.entry}>
                {seg.text}
            </Span>
        ))}
    </>
);

export const RenderNodeInk: React.FC<RenderNodeInkProps> = ({
    nodeDataWrapper, valueWrapper, optionsGetter, themeGetter,
    isFocused, isSearchCurrent, isSticky = false,
}) => {
    const options = optionsGetter();
    const theme = themeGetter();
    const { resolver, nonEnumerable, includeSymbols, enablePreview, search } = options;

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

    if (isPreview) {
        valueSegments = valueSegments.map(s => ({
            ...s,
            entry: { ...(s.entry ?? {}), dimColor: true },
        }));
    }

    if (markRegex) {
        valueSegments = highlightSegments(valueSegments, markRegex, theme[inkThemeKeys.mark]);
    }

    const indentStr = INDENT_UNIT.repeat(Math.max(0, depth));
    const focusMark = isFocused ? "›" : isSticky ? "·" : " ";

    return (
        <>
            <Span entry={isFocused ? { bold: true } : isSticky ? { dimColor: true } : undefined}>
                {focusMark}
            </Span>
            <Span entry={theme[inkThemeKeys.indent]}>{indentStr}</Span>
            <Span entry={theme[inkThemeKeys.expand]}>{expandGlyph}</Span>
            <SegmentSpans segments={keySegments} />
            <Text>: </Text>
            <SegmentSpans segments={valueSegments} />
        </>
    );
};

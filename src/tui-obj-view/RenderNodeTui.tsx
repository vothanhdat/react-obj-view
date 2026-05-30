/** @jsxImportSource @opentui/react */
import React, { useMemo } from "react";
import { objectHasChild, GroupedProxy, LazyValueError, LazyValue } from "../object-tree";
import type { FlattenNodeData } from "../libs/react-tree-view/FlattenNodeWrapper";
import type { ObjectWalkingAdapter, ObjectWalkingMetaParser } from "../object-tree";
import type { RenderOptions } from "../react-obj-view/types";
import {
    TuiTheme,
    tuiThemeKeys,
    themeEntryToTextProps,
    mergeThemeEntries,
} from "../tui-obj-view-themes";
import { formatValuePreview, formatValueRaw, Segment } from "./formatValue";
import { buildMarkRegex, highlightSegments } from "./highlightSegments";

const INDENT_UNIT = "  ";

export type TuiRowExtras = {
    theme: TuiTheme;
    isFocused: boolean;
    isSearchCurrent: boolean;
    isSticky?: boolean;
};

export type RenderNodeTuiProps = {
    nodeDataWrapper: () => FlattenNodeData<ObjectWalkingAdapter, ObjectWalkingMetaParser>;
    valueWrapper: () => unknown;
    optionsGetter: () => RenderOptions;
    themeGetter: () => TuiTheme;
    renderIndex: number;
    actions: { refreshPath: () => void; toggleChildExpand: () => void };
    isFocused: boolean;
    isSearchCurrent: boolean;
    isSticky?: boolean;
};

// Note: these are plain `(props) => React.ReactNode` functions rather than
// `React.FC`. Under React 19, `React.FC`'s return type is `ReactNode | Promise<ReactNode>`
// (to allow async components), but OpenTUI's `JSX.Element` is `React.ReactNode`,
// which doesn't include `Promise<ReactNode>` — so `React.FC` components are
// rejected as JSX under the OpenTUI jsx-runtime.

/** Render a flat segment list as OpenTUI inline `<span>` nodes. */
export const SegmentSpans = ({ segments }: { segments: Segment[] }): React.ReactNode => (
    <>
        {segments.map((seg, i) => (
            <span key={i} {...themeEntryToTextProps(seg.entry)}>
                {seg.text}
            </span>
        ))}
    </>
);

export const RenderNodeTui = ({
    nodeDataWrapper, valueWrapper, optionsGetter, themeGetter,
    isFocused, isSearchCurrent, isSticky = false,
}: RenderNodeTuiProps): React.ReactNode => {
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
    const keyEntry = theme[tuiThemeKeys.key];
    let keyEntryFinal = keyEntry;
    if (!nodeData.enumerable) {
        keyEntryFinal = mergeThemeEntries(keyEntry, theme[tuiThemeKeys.nonEnumerable]);
    }
    if (isSearchMatch) {
        keyEntryFinal = mergeThemeEntries(keyEntry, theme[tuiThemeKeys.mark]);
    }

    let valueSegments: Segment[];
    if (isCircular) {
        valueSegments = [{ text: "[Circular]", entry: theme[tuiThemeKeys.circular] }];
    } else if (isPreview) {
        valueSegments = formatValuePreview(value, { theme, resolver, includeSymbols });
    } else {
        valueSegments = formatValueRaw(value, theme);
    }

    if (isPreview) {
        valueSegments = valueSegments.map(s => ({
            ...s,
            entry: mergeThemeEntries(s.entry, { dim: true }),
        }));
    }

    if (markRegex) {
        valueSegments = highlightSegments(valueSegments, markRegex, theme[tuiThemeKeys.mark]);
    }

    const indentStr = INDENT_UNIT.repeat(Math.max(0, depth));
    const focusMark = isFocused ? "›" : isSticky ? "·" : " ";

    let segments: Segment[] = [
        { text: focusMark, entry: isFocused ? { bold: true } : isSticky ? { dim: true } : undefined },
        { text: indentStr, entry: theme[tuiThemeKeys.indent] },
        { text: expandGlyph, entry: theme[tuiThemeKeys.expand] },
        { text: keyText, entry: keyEntryFinal },
        { text: ": " },
        ...valueSegments,
    ];

    // OpenTUI text attributes don't reliably cascade from a parent <text> to child
    // <span>s that set their own fg, so mirror Ink's row-level `inverse` by merging
    // it into every segment instead.
    if (isFocused) {
        segments = segments.map(s => ({ ...s, entry: mergeThemeEntries(s.entry, { inverse: true }) }));
    }

    return <SegmentSpans segments={segments} />;
};

/** @jsxImportSource @opentui/react */
import React, { useMemo, memo, useCallback, useRef } from "react";
import type { MouseEvent as TuiMouseEvent } from "@opentui/core";
import type { FlattenNodeWrapper, FlattenNodeData } from "../libs/react-tree-view/FlattenNodeWrapper";
import { useRenderIndexesWithSticky } from "../libs/react-tree-view/useRenderIndexesWithSticky";
import type { ObjectWalkingAdapter, ObjectWalkingMetaParser } from "../object-tree";
import type { RenderOptions } from "../react-obj-view/types";
import { useWrapper } from "../libs/react-tree-view/useWrapper";
import { RenderNodeTui } from "./RenderNodeTui";
import { TuiTheme, tuiThemeKeys, themeEntryToTextProps, mergeThemeEntries } from "../tui-obj-view-themes";

export type TerminalScrollerProps = {
    totalRows: number;
    visibleRows: number;
    focusedIndex: number;
    firstVisibleIndex: number;
    getNodeByIndex: (index: number) => FlattenNodeWrapper<ObjectWalkingAdapter, ObjectWalkingMetaParser> | undefined;
    toggleChildExpand: (params: { paths: PropertyKey[] }) => void;
    refreshPath: (params: { paths: PropertyKey[] }) => void;
    computeItemKey: (index: number) => string;
    optionsGetter: () => RenderOptions;
    themeGetter: () => TuiTheme;
    stickyPathHeaders?: boolean;
    showLineNumbers?: boolean;
    searchCurrentIndex?: number;
    enableMouse?: boolean;
    onScrollDelta?: (delta: number) => void;
    onRowMouseDown?: (index: number) => void;
};

type TuiRowProps = {
    index: number;
    isSticky: boolean;
    isLastSticky: boolean;
    isFocused: boolean;
    isSearchCurrent: boolean;
    size: number;
    getNodeByIndex: TerminalScrollerProps["getNodeByIndex"];
    optionsGetter: () => RenderOptions;
    themeGetter: () => TuiTheme;
    showLineNumbers: boolean;
    lineNumberChars: number;
    onToggleExpand: TerminalScrollerProps["toggleChildExpand"];
    onRefreshPath: TerminalScrollerProps["refreshPath"];
    onRowMouseDown?: (index: number) => void;
};

// All props are primitives or stable refs (getter callbacks / function refs).
// Shallow `Object.is` is sufficient to skip the vast majority of re-renders.
const arePropsEqual = (a: TuiRowProps, b: TuiRowProps): boolean =>
    a.index === b.index
    && a.isSticky === b.isSticky
    && a.isLastSticky === b.isLastSticky
    && a.isFocused === b.isFocused
    && a.isSearchCurrent === b.isSearchCurrent
    && a.size === b.size
    && a.getNodeByIndex === b.getNodeByIndex
    && a.optionsGetter === b.optionsGetter
    && a.themeGetter === b.themeGetter
    && a.showLineNumbers === b.showLineNumbers
    && a.lineNumberChars === b.lineNumberChars
    && a.onToggleExpand === b.onToggleExpand
    && a.onRefreshPath === b.onRefreshPath
    && a.onRowMouseDown === b.onRowMouseDown;

const TuiRow = memo<TuiRowProps>(({
    index, isSticky, isLastSticky, isFocused, isSearchCurrent,
    size, getNodeByIndex, optionsGetter, themeGetter,
    showLineNumbers, lineNumberChars,
    onToggleExpand, onRefreshPath, onRowMouseDown,
}) => {

    const flattenNodeWrapper = useMemo(
        () => (index < size ? getNodeByIndex(index) : undefined),
        [index < size, index, getNodeByIndex],
    );

    const flattenNodeData = useMemo<FlattenNodeData<ObjectWalkingAdapter, ObjectWalkingMetaParser> | undefined>(
        () => flattenNodeWrapper?.getData(),
        [flattenNodeWrapper, flattenNodeWrapper?.state?.updateStamp],
    );

    const nodeDataWrapper = useWrapper(flattenNodeData!);
    const valueWrapper = useWrapper(flattenNodeData?.value);

    const actionsGetter = useWrapper(
        useMemo(() => ({
            refreshPath: () => flattenNodeData && onRefreshPath(flattenNodeData),
            toggleChildExpand: () => flattenNodeData && onToggleExpand(flattenNodeData),
        }), [flattenNodeData, onRefreshPath, onToggleExpand]),
    );

    if (!flattenNodeData) return null;

    const theme = themeGetter();

    let lineNumberProps = themeEntryToTextProps(theme[tuiThemeKeys.status]);
    let lastStickyProps = themeEntryToTextProps(theme[tuiThemeKeys.indent]);
    if (isFocused) {
        lineNumberProps = themeEntryToTextProps(mergeThemeEntries(theme[tuiThemeKeys.status], { inverse: true }));
        lastStickyProps = themeEntryToTextProps(mergeThemeEntries(theme[tuiThemeKeys.indent], { inverse: true }));
    }

    // One row == one single-line <text>. `wrapMode="none"` keeps it to a single
    // line; OpenTUI truncates at the container width instead of wrapping.
    return (
        <text
            wrapMode="none"
            selectable={false}
            onMouseDown={onRowMouseDown && !isSticky ? () => onRowMouseDown(index) : undefined}
        >
            {showLineNumbers && (
                <span {...lineNumberProps}>
                    {String(index).padStart(lineNumberChars, " ")}
                    {isSticky ? "·" : ":"}{" "}
                </span>
            )}
            <RenderNodeTui
                nodeDataWrapper={nodeDataWrapper}
                valueWrapper={valueWrapper}
                optionsGetter={optionsGetter}
                themeGetter={themeGetter}
                renderIndex={index}
                actions={actionsGetter()}
                isFocused={isFocused}
                isSearchCurrent={isSearchCurrent}
                isSticky={isSticky}
            />
            {isLastSticky && (
                <span {...lastStickyProps}> ─</span>
            )}
        </text>
    );
}, arePropsEqual);
TuiRow.displayName = "TuiRow";

export const TerminalScroller = ({
    totalRows,
    visibleRows,
    focusedIndex,
    firstVisibleIndex,
    getNodeByIndex,
    toggleChildExpand,
    refreshPath,
    computeItemKey,
    optionsGetter,
    themeGetter,
    stickyPathHeaders = true,
    showLineNumbers = false,
    searchCurrentIndex,
    enableMouse = false,
    onScrollDelta,
    onRowMouseDown,
}: TerminalScrollerProps): React.ReactNode => {

    const handleScroll = useCallback((e: TuiMouseEvent) => {
        if (!onScrollDelta || !e.scroll) return;
        const step = Math.max(1, e.scroll.delta || 1);
        onScrollDelta(e.scroll.direction === "up" ? -step : step);
    }, [onScrollDelta]);

    const renderIndexes = useRenderIndexesWithSticky({
        start: firstVisibleIndex,
        end: firstVisibleIndex + visibleRows,
        overscan: 0,
        lineHeight: 1,
        childCount: totalRows,
        getNodeByIndex,
        stickyHeader: stickyPathHeaders,
    });

    const lineNumberChars = Math.max(2, String(renderIndexes.at(-1)?.index ?? 0).length);

    return (
        <box
            flexDirection="column"
            flexShrink={0}
            onMouseScroll={enableMouse ? handleScroll : undefined}
        >
            {renderIndexes.map(({ isStick, index, isLastStick }) => {
                const stickyB = !!isStick;
                const focused = !stickyB && index === focusedIndex;
                const searchCurrent = !stickyB && index === searchCurrentIndex;
                return (
                    <TuiRow
                        key={computeItemKey(index) + (stickyB ? "-s" : "")}
                        index={index}
                        isSticky={stickyB}
                        isLastSticky={!!isLastStick}
                        isFocused={focused}
                        isSearchCurrent={searchCurrent}
                        size={totalRows}
                        getNodeByIndex={getNodeByIndex}
                        optionsGetter={optionsGetter}
                        themeGetter={themeGetter}
                        showLineNumbers={showLineNumbers}
                        lineNumberChars={lineNumberChars}
                        onToggleExpand={toggleChildExpand}
                        onRefreshPath={refreshPath}
                        onRowMouseDown={enableMouse ? onRowMouseDown : undefined}
                    />
                );
            })}
        </box>
    );
};

export const clampFirstVisible = (
    focusedIndex: number,
    firstVisible: number,
    visibleRows: number,
    totalRows: number,
): number => {
    const margin = 1;
    if (totalRows === 0) return 0;
    let next = firstVisible;
    if (focusedIndex < next + margin) next = Math.max(0, focusedIndex - margin);
    else if (focusedIndex >= next + visibleRows - margin) next = Math.max(0, focusedIndex - visibleRows + margin + 1);
    const maxFirst = Math.max(0, totalRows - visibleRows);
    if (next > maxFirst) next = maxFirst;
    return next;
};

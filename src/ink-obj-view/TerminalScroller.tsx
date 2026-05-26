import React, { useMemo, memo } from "react";
import { Box, Text } from "ink";
import type { FlattenNodeWrapper, FlattenNodeData } from "../libs/react-tree-view/FlattenNodeWrapper";
import { useRenderIndexesWithSticky } from "../libs/react-tree-view/useRenderIndexesWithSticky";
import type { ObjectWalkingAdapter, ObjectWalkingMetaParser } from "../object-tree";
import type { RenderOptions } from "../react-obj-view/types";
import { useWrapper } from "../libs/react-tree-view/useWrapper";
import { RenderNodeInk } from "./RenderNodeInk";
import { InkTheme, inkThemeKeys } from "../ink-obj-view-themes";

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
    themeGetter: () => InkTheme;
    stickyPathHeaders?: boolean;
    showLineNumbers?: boolean;
    searchCurrentIndex?: number;
};

type InkRowProps = {
    index: number;
    isSticky: boolean;
    isLastSticky: boolean;
    isFocused: boolean;
    isSearchCurrent: boolean;
    size: number;
    getNodeByIndex: TerminalScrollerProps["getNodeByIndex"];
    optionsGetter: () => RenderOptions;
    themeGetter: () => InkTheme;
    showLineNumbers: boolean;
    lineNumberChars: number;
    onToggleExpand: TerminalScrollerProps["toggleChildExpand"];
    onRefreshPath: TerminalScrollerProps["refreshPath"];
};

// All props are primitives or stable refs (getter callbacks / function refs).
// Shallow `Object.is` is sufficient to skip the vast majority of re-renders.
const arePropsEqual = (a: InkRowProps, b: InkRowProps): boolean =>
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
    && a.onRefreshPath === b.onRefreshPath;

const InkRow = memo<InkRowProps>(({
    index, isSticky, isLastSticky, isFocused, isSearchCurrent,
    size, getNodeByIndex, optionsGetter, themeGetter,
    showLineNumbers, lineNumberChars,
    onToggleExpand, onRefreshPath,
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

    return (
        <Text wrap="truncate-end" inverse={isFocused}>
            {showLineNumbers && (
                <Text {...theme[inkThemeKeys.status]}>
                    {String(index).padStart(lineNumberChars, " ")}
                    {isSticky ? "·" : ":"}{" "}
                </Text>
            )}
            <RenderNodeInk
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
                <Text {...theme[inkThemeKeys.indent]}> ─</Text>
            )}
        </Text>
    );
}, arePropsEqual);
InkRow.displayName = "InkRow";

export const TerminalScroller: React.FC<TerminalScrollerProps> = ({
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
}) => {

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
        <Box flexDirection="column">
            {renderIndexes.map(({ isStick, index, isLastStick }) => {
                const stickyB = !!isStick;
                const focused = !stickyB && index === focusedIndex;
                const searchCurrent = !stickyB && index === searchCurrentIndex;
                return (
                    <InkRow
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
                    />
                );
            })}
        </Box>
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

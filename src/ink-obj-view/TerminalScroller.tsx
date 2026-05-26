import React, { useImperativeHandle, useMemo } from "react";
import { Box, Text } from "ink";
import type { FlattenNodeWrapper, FlattenNodeData } from "../libs/react-tree-view/FlattenNodeWrapper";
import { useRenderIndexesWithSticky } from "../libs/react-tree-view/useRenderIndexesWithSticky";
import type { ObjectWalkingAdapter, ObjectWalkingMetaParser } from "../object-tree";
import type { RenderOptions } from "../react-obj-view/types";
import { useWrapper } from "../libs/react-tree-view/useWrapper";
import { RenderNodeInk, InkRowExtras } from "./RenderNodeInk";
import { InkTheme, inkThemeKeys } from "../ink-obj-view-themes";

export type TerminalScrollerHandle = {
    scrollToIndex: (index: number) => void;
};

export type TerminalScrollerProps = {
    totalRows: number;
    visibleRows: number;
    focusedIndex: number;
    firstVisibleIndex: number;
    setFirstVisibleIndex: (next: number) => void;
    getNodeByIndex: (index: number) => FlattenNodeWrapper<ObjectWalkingAdapter, ObjectWalkingMetaParser> | undefined;
    toggleChildExpand: (params: { paths: PropertyKey[] }) => void;
    refreshPath: (params: { paths: PropertyKey[] }) => void;
    computeItemKey: (index: number) => string;
    options: RenderOptions;
    theme: InkTheme;
    stickyPathHeaders?: boolean;
    showLineNumbers?: boolean;
    searchCurrentIndex?: number;
    ref?: React.RefObject<TerminalScrollerHandle | undefined>;
};

const InkRow: React.FC<{
    index: number;
    isSticky: boolean;
    isLastSticky: boolean;
    size: number;
    getNodeByIndex: TerminalScrollerProps["getNodeByIndex"];
    options: RenderOptions;
    extras: InkRowExtras;
    showLineNumbers: boolean;
    lineNumberChars: number;
}> = ({ index, isSticky, isLastSticky, size, getNodeByIndex, options, extras, showLineNumbers, lineNumberChars }) => {

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

    const actions = useMemo(() => ({
        refreshPath: () => flattenNodeData && (extras as any)?.onRefreshPath?.(flattenNodeData),
        toggleChildExpand: () => flattenNodeData && (extras as any)?.onToggleExpand?.(flattenNodeData),
    }), [flattenNodeData, extras]);

    if (!flattenNodeData) return null;

    return (
        <Box flexDirection="row">
            {showLineNumbers && (
                <Text {...extras.theme[inkThemeKeys.status]}>
                    {String(index).padStart(lineNumberChars, " ")}
                    {isSticky ? "·" : ":"}{" "}
                </Text>
            )}
            <RenderNodeInk
                nodeDataWrapper={nodeDataWrapper}
                valueWrapper={valueWrapper}
                options={options}
                renderIndex={index}
                actions={actions}
                extras={{ ...extras, isFocused: !isSticky && extras.isFocused }}
            />
            {isLastSticky && (
                <Text {...extras.theme[inkThemeKeys.indent]}> ─</Text>
            )}
        </Box>
    );
};

export const TerminalScroller: React.FC<TerminalScrollerProps> = ({
    totalRows,
    visibleRows,
    focusedIndex,
    firstVisibleIndex,
    setFirstVisibleIndex,
    getNodeByIndex,
    toggleChildExpand,
    refreshPath,
    computeItemKey,
    options,
    theme,
    stickyPathHeaders = true,
    showLineNumbers = false,
    searchCurrentIndex,
    ref,
}) => {

    useImperativeHandle(ref, () => ({
        scrollToIndex: (index: number) => {
            const margin = 2;
            if (index < firstVisibleIndex) setFirstVisibleIndex(Math.max(0, index - margin));
            else if (index >= firstVisibleIndex + Math.max(1, visibleRows - margin)) {
                setFirstVisibleIndex(Math.max(0, index - visibleRows + margin + 1));
            }
        },
    }), [firstVisibleIndex, visibleRows, setFirstVisibleIndex]);

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

    const handlerExtras = useMemo(
        () => ({ onToggleExpand: toggleChildExpand, onRefreshPath: refreshPath }),
        [toggleChildExpand, refreshPath],
    );

    return (
        <Box flexDirection="column">
            {renderIndexes.map(({ isStick, index, isLastStick }, n) => {
                const extras: InkRowExtras & { onToggleExpand?: any; onRefreshPath?: any } = {
                    theme,
                    isFocused: !isStick && index === focusedIndex,
                    isSearchCurrent: !isStick && index === searchCurrentIndex,
                    ...handlerExtras,
                };
                return (
                    <InkRow
                        key={computeItemKey(index) + (isStick ? "-s" : "")}
                        index={index}
                        isSticky={!!isStick}
                        isLastSticky={!!isLastStick}
                        size={totalRows}
                        getNodeByIndex={getNodeByIndex}
                        options={options}
                        extras={extras as InkRowExtras}
                        showLineNumbers={showLineNumbers}
                        lineNumberChars={lineNumberChars}
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

import React, { useCallback, useImperativeHandle, useMemo, useState } from "react";
import { Box, Text, useInput, useStdout, type Key } from "ink";
import { useReactTree } from "../libs/react-tree-view";
import { useWrapper } from "../libs/react-tree-view/useWrapper";
import {
    objectTreeWalkingFactory,
    parseWalkingMeta,
    ObjectWalkingAdapter,
    DEFAULT_RESOLVER,
    GROUP_ARRAY_RESOLVER,
    GROUP_OBJECT_RESOLVER,
    TYPED_ARRAY_RESOLVERS,
    type ResolverFn,
} from "../object-tree";
import { InferWalkingType } from "../libs/tree-core";
import { createSearchHandler } from "../react-obj-view/search/searchHandler";
import { useObjectViewSearch } from "../react-obj-view/search/useObjectViewSearch";
import type { RenderOptions, SearchOptions, ObjectViewHandle } from "../react-obj-view/types";
import { TerminalScroller, clampFirstVisible } from "./TerminalScroller";
import { useKeyboardNav } from "./useKeyboardNav";
import { useMouse } from "./useMouse";
import { SearchInput } from "./SearchInput";
import { InkTheme, themeDark, inkThemeKeys } from "../ink-obj-view-themes";

export type InkObjectViewProps = {
    valueGetter: () => unknown;
    name?: string;
    expandLevel?: number | boolean;
    arrayGroupSize?: number;
    objectGroupSize?: number;
    resolver?: Map<any, ResolverFn>;
    preview?: boolean;
    nonEnumerable?: boolean;
    includeSymbols?: boolean;
    showLineNumbers?: boolean;
    stickyPathHeaders?: boolean;
    iterateSize?: number;
    height?: number;
    theme?: InkTheme;
    searchOptions?: SearchOptions;
    onCopy?: (paths: PropertyKey[], value: unknown) => void | Promise<void>;
    onExit?: () => void;
    enableMouse?: boolean;
    ref?: React.RefObject<ObjectViewHandle | undefined>;
};

const HELP_TEXT = " ↑/↓ move · enter/space expand · ← collapse · / search · n/N next/prev · y copy · q quit ";

export const InkObjectView: React.FC<InkObjectViewProps> = ({
    valueGetter,
    name,
    expandLevel = 1,
    arrayGroupSize = 0,
    objectGroupSize = 0,
    resolver: customResolver,
    preview = true,
    nonEnumerable = false,
    includeSymbols = false,
    showLineNumbers = false,
    stickyPathHeaders = true,
    iterateSize,
    height,
    theme = themeDark,
    searchOptions,
    onCopy,
    onExit,
    enableMouse = false,
    ref,
}) => {
    const value = useMemo(() => valueGetter(), [valueGetter]);

    const resolver = useMemo(
        () => new Map([
            ...DEFAULT_RESOLVER,
            ...TYPED_ARRAY_RESOLVERS,
            ...(customResolver ?? []),
            ...(Number(arrayGroupSize) > 1 ? GROUP_ARRAY_RESOLVER(Number(arrayGroupSize)) : []),
            ...(Number(objectGroupSize) > 1 ? GROUP_OBJECT_RESOLVER(Number(objectGroupSize)) : []),
        ]),
        [customResolver, arrayGroupSize, objectGroupSize],
    );

    const config: InferWalkingType<ObjectWalkingAdapter>["Config"] = useMemo(
        () => ({ nonEnumerable, resolver, symbol: includeSymbols }),
        [nonEnumerable, includeSymbols, resolver],
    );

    const expandDepth = typeof expandLevel === "boolean"
        ? (expandLevel ? 100 : 0)
        : Number(expandLevel);

    const objectTree = useReactTree<ObjectWalkingAdapter, typeof parseWalkingMeta>({
        factory: objectTreeWalkingFactory,
        config,
        expandDepth,
        metaParser: parseWalkingMeta,
        name: name ?? "ROOT",
        value,
        iterateSize,
    });

    const { getNodeByIndex, childCount, expandAndGetIndex, computeItemKey, toggleChildExpand, setChildExpand, refreshPath } = objectTree;

    const [search, setSearch] = useState<RenderOptions["search"]>(() => ({
        markTerm: undefined,
        filterFn: undefined,
    }));

    const [focusedIndex, setFocusedIndexRaw] = useState(0);
    const [firstVisibleIndex, setFirstVisibleIndex] = useState(0);
    const [searchMode, setSearchMode] = useState(false);

    const { stdout } = useStdout();
    const totalTerminalRows = height ?? stdout?.rows ?? 24;
    // Reserve 1 row for header, 1 for search/help.
    const visibleRows = Math.max(3, totalTerminalRows - 2);

    // Single batched update so a key press produces ONE render, not two.
    const setFocusedIndex = useCallback((next: number) => {
        const clamped = Math.max(0, Math.min(next, Math.max(0, childCount - 1)));
        setFocusedIndexRaw(prev => (prev === clamped ? prev : clamped));
        setFirstVisibleIndex(prev => {
            const nextFirst = clampFirstVisible(clamped, prev, visibleRows, childCount);
            return prev === nextFirst ? prev : nextFirst;
        });
    }, [childCount, visibleRows]);

    const { search: handleSearch } = useMemo(
        () => createSearchHandler({
            travelAndSearch: objectTree.travelAndSearch,
            setSearch,
        }),
        [objectTree.travelAndSearch],
    );

    const scrollToPaths = useCallback(async (paths: PropertyKey[]) => {
        const idx = await expandAndGetIndex(paths);
        if (idx > -1) setFocusedIndex(idx);
    }, [expandAndGetIndex, setFocusedIndex]);

    const searchHook = useObjectViewSearch({
        handleSearch,
        scrollToPaths: scrollToPaths as any,
        options: searchOptions,
        active: true,
    });

    useImperativeHandle(ref, (): ObjectViewHandle => ({
        search: handleSearch as any,
        scrollToPaths: scrollToPaths as any,
    }), [handleSearch, scrollToPaths]);

    const defaultCopy = useCallback(async (paths: PropertyKey[], v: unknown) => {
        try {
            if (onCopy) { await onCopy(paths, v); return; }
            const clipboardy = await import("clipboardy");
            const text = typeof v === "string" ? v : JSON.stringify(v, null, 2);
            await clipboardy.default.write(text);
        } catch {
            // clipboard unavailable; silently ignore
        }
    }, [onCopy]);

    useKeyboardNav({
        isActive: !searchMode,
        totalRows: childCount,
        visibleRows,
        focusedIndex,
        setFocusedIndex,
        getNodeByIndex,
        toggleChildExpand,
        setChildExpand,
        openSearch: () => setSearchMode(true),
        nextMatch: () => searchHook.next(),
        prevMatch: () => searchHook.prev(),
        onCopy: defaultCopy,
        onExit,
    });

    useInput((_input: string, key: Key) => {
        if (key.escape) setSearchMode(false);
    }, { isActive: searchMode });

    const headerRows = 1;
    useMouse({
        enabled: enableMouse && !searchMode,
        onScroll: useCallback((delta: number) => {
            setFocusedIndex(Math.max(0, Math.min(childCount - 1, focusedIndex + delta)));
        }, [focusedIndex, childCount, setFocusedIndex]),
        onClick: useCallback((e: { row: number; col: number }) => {
            const targetIdx = firstVisibleIndex + Math.max(0, e.row - headerRows);
            if (targetIdx >= 0 && targetIdx < childCount) setFocusedIndex(targetIdx);
        }, [firstVisibleIndex, childCount, setFocusedIndex]),
        onDoubleClick: useCallback((e: { row: number; col: number }) => {
            const targetIdx = firstVisibleIndex + Math.max(0, e.row - headerRows);
            if (targetIdx < 0 || targetIdx >= childCount) return;
            const node = getNodeByIndex(targetIdx);
            if (node?.hasChild) toggleChildExpand({ paths: node.paths });
        }, [firstVisibleIndex, childCount, getNodeByIndex, toggleChildExpand]),
    });

    const options = useMemo<RenderOptions>(() => ({
        enablePreview: preview,
        resolver,
        highlightUpdate: false,
        includeSymbols,
        showLineNumbers,
        onMouseEnter: () => { },
        onMouseLeave: () => { },
        nonEnumerable,
        search,
    }), [preview, resolver, includeSymbols, showLineNumbers, nonEnumerable, search]);

    // Pass big objects as getter callbacks so React's prop diff sees a stable
    // function ref, not a fat object literal that gets walked on every render.
    const optionsGetter = useWrapper(options);
    const themeGetter = useWrapper(theme);

    const currentMatchIndex = focusedIndex;
    const matchCount = searchHook.results.results.length;

    return (
        <Box flexDirection="column">
            <Box flexDirection="row" justifyContent="space-between">
                <Text {...theme[inkThemeKeys.status]} bold>
                    {name ?? "ROOT"}{" "}
                    <Text {...theme[inkThemeKeys.status]}>{focusedIndex + 1}/{childCount}</Text>
                </Text>
            </Box>
            <TerminalScroller
                totalRows={childCount}
                visibleRows={visibleRows}
                focusedIndex={focusedIndex}
                firstVisibleIndex={firstVisibleIndex}
                getNodeByIndex={getNodeByIndex}
                toggleChildExpand={toggleChildExpand}
                refreshPath={refreshPath}
                computeItemKey={computeItemKey}
                optionsGetter={optionsGetter}
                themeGetter={themeGetter}
                stickyPathHeaders={stickyPathHeaders}
                showLineNumbers={showLineNumbers}
                searchCurrentIndex={currentMatchIndex}
            />
            {searchMode ? (
                <SearchInput
                    value={searchHook.searchTerm}
                    onChange={searchHook.setSearchTerm}
                    onSubmit={() => setSearchMode(false)}
                    onCancel={() => setSearchMode(false)}
                    theme={theme}
                    matchCount={matchCount}
                    currentMatch={searchHook.results.currentIndex}
                    searching={searchHook.searching}
                />
            ) : (
                <Text {...theme[inkThemeKeys.status]}>{HELP_TEXT}</Text>
            )}
        </Box>
    );
};

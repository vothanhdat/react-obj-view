import React, { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Box, Text, useInput, useStdout, type Key } from "ink";
import { useReactTree } from "../libs/react-tree-view";
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
import { TerminalScroller, TerminalScrollerHandle, clampFirstVisible } from "./TerminalScroller";
import { useKeyboardNav } from "./useKeyboardNav";
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

    const scrollerRef = useRef<TerminalScrollerHandle | undefined>(undefined);

    const setFocusedIndex = useCallback((next: number) => {
        setFocusedIndexRaw(prev => {
            const clamped = Math.max(0, Math.min(next, Math.max(0, childCount - 1)));
            return clamped === prev ? prev : clamped;
        });
    }, [childCount]);

    const { stdout } = useStdout();
    const totalTerminalRows = height ?? stdout?.rows ?? 24;
    // Reserve 1 row for header, 1 for search/help.
    const visibleRows = Math.max(3, totalTerminalRows - 2);

    useEffect(() => {
        setFirstVisibleIndex(prev => clampFirstVisible(focusedIndex, prev, visibleRows, childCount));
    }, [focusedIndex, visibleRows, childCount]);

    const { search: handleSearch } = useMemo(
        () => createSearchHandler({
            travelAndSearch: objectTree.travelAndSearch,
            setSearch,
        }),
        [objectTree.travelAndSearch],
    );

    const scrollToPaths = useCallback(async (paths: PropertyKey[]) => {
        const idx = await expandAndGetIndex(paths);
        if (idx > -1) {
            setFocusedIndexRaw(idx);
            scrollerRef.current?.scrollToIndex(idx);
        }
    }, [expandAndGetIndex]);

    const searchHook = useObjectViewSearch({
        handleSearch,
        scrollToPaths: scrollToPaths as any,
        options: searchOptions,
        active: true,
    });

    useImperativeHandle(ref, () => ({
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
                ref={scrollerRef}
                totalRows={childCount}
                visibleRows={visibleRows}
                focusedIndex={focusedIndex}
                firstVisibleIndex={firstVisibleIndex}
                setFirstVisibleIndex={setFirstVisibleIndex}
                getNodeByIndex={getNodeByIndex}
                toggleChildExpand={toggleChildExpand}
                refreshPath={refreshPath}
                computeItemKey={computeItemKey}
                options={options}
                theme={theme}
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

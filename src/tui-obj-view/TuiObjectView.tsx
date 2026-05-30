/** @jsxImportSource @opentui/react */
import React, { useCallback, useImperativeHandle, useMemo, useRef, useState } from "react";
import { useKeyboard, useTerminalDimensions } from "@opentui/react";
import type { KeyEvent } from "@opentui/core";
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
import { SearchInput } from "./SearchInput";
import { TuiTheme, themeDark, tuiThemeKeys, themeEntryToTextProps, mergeThemeEntries } from "../tui-obj-view-themes";

export type TuiObjectViewProps = {
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
    width?: number;
    theme?: TuiTheme;
    searchOptions?: SearchOptions;
    onCopy?: (paths: PropertyKey[], value: unknown) => void | Promise<void>;
    onExit?: () => void;
    enableMouse?: boolean;
    ref?: React.RefObject<ObjectViewHandle | undefined>;
};

const HELP_TEXT = " ↑/↓ move · enter/space expand · ← collapse · / search · n/N next/prev · y copy · q quit ";
const DOUBLE_CLICK_MS = 350;

export const TuiObjectView = ({
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
    width,
    theme = themeDark,
    searchOptions,
    onCopy,
    onExit,
    enableMouse = false,
    ref,
}: TuiObjectViewProps): React.ReactNode => {
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

    const { width: termWidth, height: termHeight } = useTerminalDimensions();
    const viewWidth = width ?? termWidth ?? 80;
    const totalTerminalRows = height ?? termHeight ?? 24;
    // Reserve 1 row for header, 1 for search/help.
    const visibleRows = Math.max(3, totalTerminalRows - 2);

    // Mirror the focused index in a ref so synchronous bursts of key events
    // (key-repeat, or several events delivered before React commits a frame) each
    // read the up-to-date value instead of a stale render closure. `next` may be a
    // number or an updater so relative moves compose correctly within one batch.
    const focusedRef = useRef(0);
    const setFocusedIndex = useCallback((next: number | ((prev: number) => number)) => {
        const raw = typeof next === "function" ? next(focusedRef.current) : next;
        const clamped = Math.max(0, Math.min(raw, Math.max(0, childCount - 1)));
        focusedRef.current = clamped;
        // Single batched update so a key press produces ONE render, not two.
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
        focusedIndexRef: focusedRef,
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

    // Escape closes the search overlay. The global key handler still fires while
    // the <input> is focused, so this works alongside it.
    useKeyboard((key: KeyEvent) => {
        if (searchMode && key.name === "escape") setSearchMode(false);
    });

    // Mouse: focus on click, toggle expand on double-click of the same row.
    const lastClickRef = useRef<{ index: number; t: number } | null>(null);
    const handleRowMouseDown = useCallback((targetIdx: number) => {
        if (targetIdx < 0 || targetIdx >= childCount) return;
        const now = Date.now();
        const last = lastClickRef.current;
        if (last && last.index === targetIdx && now - last.t < DOUBLE_CLICK_MS) {
            lastClickRef.current = null;
            const node = getNodeByIndex(targetIdx);
            if (node?.hasChild) toggleChildExpand({ paths: node.paths });
        } else {
            lastClickRef.current = { index: targetIdx, t: now };
            setFocusedIndex(targetIdx);
        }
    }, [childCount, getNodeByIndex, toggleChildExpand, setFocusedIndex]);

    const handleScrollDelta = useCallback((delta: number) => {
        setFocusedIndex(prev => prev + delta);
    }, [setFocusedIndex]);

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

    const statusProps = themeEntryToTextProps(theme[tuiThemeKeys.status]);
    const titleProps = themeEntryToTextProps(mergeThemeEntries(theme[tuiThemeKeys.status], { bold: true }));

    return (
        <box flexDirection="column" width={viewWidth} height={totalTerminalRows}>
            <box flexDirection="row" flexShrink={0}>
                <text wrapMode="none" {...titleProps}>{name ?? "ROOT"} </text>
                <text wrapMode="none" {...statusProps}>{focusedIndex + 1}/{childCount}</text>
            </box>
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
                enableMouse={enableMouse && !searchMode}
                onScrollDelta={handleScrollDelta}
                onRowMouseDown={handleRowMouseDown}
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
                <text wrapMode="none" {...statusProps}>{HELP_TEXT}</text>
            )}
        </box>
    );
};

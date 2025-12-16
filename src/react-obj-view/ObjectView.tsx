import React, { useContext, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { RenderNode } from "./components/RenderNode";
import { RenderOptions } from "./types";
import { ObjectViewProps } from "./types";
import { ReactTreeView, useReactTree } from "../libs/react-tree-view";
import {
    objectTreeWalkingFactory,
    parseWalkingMeta,
    ObjectWalkingAdater,
    DEFAULT_RESOLVER,
    GROUP_ARRAY_RESOLVER,
    GROUP_OBJECT_RESOLVER,
    TYPED_ARRAY_RESOLVERS,
} from "../object-tree";
import { InferWalkingType } from "../libs/tree-core";
import { joinClasses } from "../utils/joinClasses";
import "./components/style.css"
import { useHoverInteractions } from "./hooks/useHoverInteractions";
import { HightlightWrapper } from "./hooks/useHighlight";



export const ObjectView: React.FC<ObjectViewProps> = ({
    valueGetter,
    name,
    expandLevel,
    highlightUpdate,
    resolver: customResolver,
    nonEnumerable = false,
    preview: enablePreview = true,
    showLineNumbers = false,
    arrayGroupSize = 0,
    objectGroupSize = 0,
    className,
    lineHeight = 14,
    style,
    includeSymbols = false,
    stickyPathHeaders = true,
    actionRenders,
    iterateSize,
    ref,
}) => {

    const value = useMemo(() => valueGetter?.(), [valueGetter])

    const resolver = useMemo(
        () => new Map([
            ...DEFAULT_RESOLVER,
            ...TYPED_ARRAY_RESOLVERS,
            ...customResolver ?? [],
            ...Number(arrayGroupSize) > 1
                ? GROUP_ARRAY_RESOLVER(Number(arrayGroupSize))
                : [],
            ...Number(objectGroupSize) > 1
                ? GROUP_OBJECT_RESOLVER(Number(objectGroupSize))
                : [],
        ]),
        [customResolver, arrayGroupSize, objectGroupSize, DEFAULT_RESOLVER]
    );

    const config: InferWalkingType<ObjectWalkingAdater>['Config'] = useMemo(
        () => ({
            nonEnumerable,
            resolver,
            symbol: includeSymbols
        }),
        [nonEnumerable, includeSymbols, resolver]
    )

    const expandDepth = typeof expandLevel == 'boolean'
        ? expandLevel ? 100 : 0
        : Number(expandLevel)

    let objectTree = useReactTree<ObjectWalkingAdater, typeof parseWalkingMeta>({
        factory: objectTreeWalkingFactory,
        config,
        expandDepth,
        metaParser: parseWalkingMeta,
        name: name ?? "ROOT",
        value,
        iterateSize,
    })

    const { getNodeByIndex, childCount, expandAndGetIndex, travelAndSearch } = objectTree

    const { onMouseEnter, onMouseLeave, containerRef } = useHoverInteractions(childCount, getNodeByIndex);

    const [search, setSearch] = useState(() => ({
        searchTerm: "",
        filterFn: (value: any, key: any, paths: any[]) => (false as boolean)
    }))

    const options: RenderOptions = useMemo(
        () => ({
            enablePreview,
            resolver,
            highlightUpdate,
            includeSymbols,
            showLineNumbers,
            onMouseEnter,
            onMouseLeave,
            actionRenders,
            nonEnumerable,
            search,
        }) as RenderOptions,
        [
            enablePreview, resolver,
            highlightUpdate, includeSymbols, showLineNumbers,
            actionRenders, nonEnumerable,
            search,
        ]
    )

    const { containerDivProps, rowDivProps } = useMemo(
        () => ({
            containerDivProps: {
                className: joinClasses(className, 'big-objview-root'),
                style,
            },
            rowDivProps: { className: "row" }
        }),
        [style, className]
    )

    const reactTreeViewRef = useRef<any>(undefined)

    const searchObj = useMemo(
        () => {

            let currentSearchTerm = ""

            return {
                async search(
                    searchTerm: string,
                    onResult: (paths: InferWalkingType<ObjectWalkingAdater>['Key'][][]) => void,
                    options: {
                        iterateSize?: number,
                        maxDepth?: number,
                        fullSearch?: boolean,
                        normalizeSymbol?: (e: string) => string,
                    } = {}
                ) {

                    currentSearchTerm = searchTerm;

                    let searchTermNomalize = searchTerm.toLowerCase();

                    if (options.normalizeSymbol) {
                        searchTermNomalize = [...searchTermNomalize].map(options.normalizeSymbol).join("")
                    }

                    let tokens = searchTermNomalize.split(" ").filter(Boolean)


                    const filterFn = (value: any, key: any, paths: any[]) => {
                        try {
                            let str = String(key)

                            if (typeof value === 'string'
                                || typeof value === 'number'
                                || typeof value === 'bigint'
                                || (typeof value === 'object' && (
                                    value instanceof Date || value instanceof RegExp
                                ))) {
                                str += " " + String(value);
                            }

                            str = str.toLowerCase();

                            if (options.normalizeSymbol) {
                                str = [...str].map(options.normalizeSymbol).join("")
                            }

                            let prevIndex = 0;

                            for (let token of tokens) {
                                prevIndex = str.indexOf(token, prevIndex)
                                if (prevIndex < 0)
                                    return false;
                            }

                            return prevIndex > -1;

                        } catch (error) {
                            return false
                        }

                    }

                    setSearch({ searchTerm, filterFn });

                    if (!tokens.length)
                        return;

                    let searchResults: InferWalkingType<ObjectWalkingAdater>['Key'][][] = []

                    for (let _ of objectTree.travelAndSearch(
                        (value, key, path) => {
                            if (filterFn(value, key, path)) {
                                // console.log("Match ", { value, key, path })
                                searchResults.push([...path])
                            }
                        },
                        options.iterateSize,
                        options.maxDepth,
                        options.fullSearch,
                    )) {

                        onResult(searchResults);
                        searchResults = []

                        await new Promise(r => (window.requestIdleCallback || window.requestAnimationFrame)(r));

                        // console.log({ currentSearchTerm, searchTerm })
                        if (currentSearchTerm !== searchTerm) {
                            searchResults = [];
                            return;
                        }
                    }

                    if (searchResults.length) {
                        onResult(searchResults);
                        searchResults = []
                    }
                },
                async scrollToPaths(
                    paths: InferWalkingType<ObjectWalkingAdater>['Key'][],
                    options?: ScrollToOptions
                ) {

                    // console.log(paths)
                    let pathIndex = await expandAndGetIndex(paths);
                    // console.log({ pathIndex })
                    if (pathIndex > -1) {

                        containerRef.current?.style.setProperty(
                            "--mark-index", String(pathIndex)
                        )

                        reactTreeViewRef?.current?.scrollTo(
                            {
                                top: pathIndex * lineHeight - 200,
                                behavior: "instant",
                                ...options,
                            } as ScrollToOptions
                        )
                    }
                }
            }
        }, [reactTreeViewRef, expandAndGetIndex, travelAndSearch]
    )

    useImperativeHandle(ref, () => searchObj, [searchObj])

    return <div ref={containerRef} className="big-objview-container" >
        <HightlightWrapper highlight={search.searchTerm}>
            <ReactTreeView<ObjectWalkingAdater, typeof parseWalkingMeta, RenderOptions>
                {...objectTree}
                lineHeight={lineHeight}
                options={options}
                RowRenderer={RenderNode}
                stickyPathHeaders={stickyPathHeaders}
                containerDivProps={containerDivProps}
                showLineNumbers={showLineNumbers}
                rowDivProps={rowDivProps}
                ref={reactTreeViewRef}
            />
        </HightlightWrapper>
    </div>

}




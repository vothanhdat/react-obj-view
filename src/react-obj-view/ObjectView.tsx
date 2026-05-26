import React, { useContext, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { RenderNode } from "./components/RenderNode";
import { ObjectViewHandle, RenderOptions } from "./types";
import { ObjectViewProps } from "./types";
import { ReactTreeView, useReactTree } from "../libs/react-tree-view";
import {
    objectTreeWalkingFactory,
    parseWalkingMeta,
    ObjectWalkingAdapter,
    DEFAULT_RESOLVER,
    GROUP_ARRAY_RESOLVER,
    GROUP_OBJECT_RESOLVER,
    TYPED_ARRAY_RESOLVERS,
} from "../object-tree";
import { InferWalkingType } from "../libs/tree-core";
import { joinClasses } from "../utils/joinClasses";
import { useHoverInteractions } from "./hooks/useHoverInteractions";
import { HightlightWrapper } from "./hooks/useHighlight";
import { createSearchHandler } from "./search/searchHandler";
import "./components/style.css"



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
    customActions,
    iterateSize,
    ref,
    overscan = 100,
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

    const config: InferWalkingType<ObjectWalkingAdapter>['Config'] = useMemo(
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

    let objectTree = useReactTree<ObjectWalkingAdapter, typeof parseWalkingMeta>({
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

    const [search, setSearch] = useState<RenderOptions['search']>(() => ({
        markTerm: "",
        filterFn: (value: any, key: any, paths: any[]) => false
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
            customActions,
            nonEnumerable,
            search,
        }) as RenderOptions,
        [
            enablePreview, resolver,
            highlightUpdate, includeSymbols, showLineNumbers,
            actionRenders, nonEnumerable, customActions,
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

    const searchObj: ObjectViewHandle = useMemo(
        () => {

            const { search } = createSearchHandler({
                travelAndSearch: objectTree.travelAndSearch,
                setSearch,
                onResetMark: () => containerRef.current?.style.setProperty("--mark-index", String(-1)),
            });

            return {
                search,
                async scrollToPaths(
                    paths: InferWalkingType<ObjectWalkingAdapter>['Key'][],
                    options?: ScrollToOptions,
                    ...args
                ) {

                    let pathIndex = await expandAndGetIndex(paths);
                    if (pathIndex > -1) {

                        containerRef.current?.style.setProperty(
                            "--mark-index", String(pathIndex)
                        )

                        reactTreeViewRef?.current?.scrollTo(
                            {
                                top: pathIndex * lineHeight,
                                behavior: "instant",
                                ...options,
                            } as ScrollToOptions,
                            ...args
                        )
                    }
                }
            }
        }, [reactTreeViewRef, expandAndGetIndex, travelAndSearch, lineHeight]
    )

    useImperativeHandle(ref, () => searchObj, [searchObj])

    return <div ref={containerRef} className="big-objview-container" >
        <HightlightWrapper highlight={search?.markTerm}>
            <ReactTreeView<ObjectWalkingAdapter, typeof parseWalkingMeta, RenderOptions>
                {...objectTree}
                lineHeight={lineHeight}
                options={options}
                RowRenderer={RenderNode}
                stickyPathHeaders={stickyPathHeaders}
                containerDivProps={containerDivProps}
                showLineNumbers={showLineNumbers}
                rowDivProps={rowDivProps}
                ref={reactTreeViewRef}
                overscan={overscan}
            />
        </HightlightWrapper>
    </div>

}




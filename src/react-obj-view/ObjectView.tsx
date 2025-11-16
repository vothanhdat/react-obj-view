import React, { useCallback, useContext, useEffect, useMemo } from "react";
import { RenderNode, RenderOptions } from "./components/RenderNode";
import { ObjectViewProps } from "./types";
import { ReactTreeView, useReactTree } from "../react-tree-view";
import {
    objectTreeWalkingFactory,
    parseWalkingMeta,
    ObjectWalkingAdater,
    DEFAULT_RESOLVER,
    GROUP_ARRAY_RESOLVER, 
    GROUP_OBJECT_RESOLVER
} from "../object-tree";
import { InferWalkingType } from "../tree-core";
import { joinClasses } from "../utils/joinClasses";
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
}) => {

    const value = useMemo(() => valueGetter?.(), [valueGetter])

    const resolver = useMemo(
        () => new Map([
            ...DEFAULT_RESOLVER,
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
    })

    const { refreshPath, toggleChildExpand } = objectTree

    const options: RenderOptions = useMemo(
        () => ({
            enablePreview,
            refreshPath,
            toggleChildExpand,
            resolver,
            highlightUpdate,
            includeSymbols,
            showLineNumbers,
        }) as RenderOptions,
        [
            enablePreview, refreshPath, toggleChildExpand, resolver,
            highlightUpdate, includeSymbols, showLineNumbers
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

    return <ReactTreeView<ObjectWalkingAdater, typeof parseWalkingMeta, RenderOptions>
        {...objectTree}
        lineHeight={lineHeight}
        options={options}
        RowRenderer={RenderNode}
        stickyPathHeaders={stickyPathHeaders}
        containerDivProps={containerDivProps}
        rowDivProps={rowDivProps}
    />
}



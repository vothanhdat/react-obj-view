import React, { useContext, useEffect, useMemo, useState } from "react";
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

    const { getNodeByIndex, childCount } = objectTree

    const { onMouseEnter, onMouseLeave, containerRef } = useHoverInteractions(childCount, getNodeByIndex);

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
        }) as RenderOptions,
        [
            enablePreview, resolver,
            highlightUpdate, includeSymbols, showLineNumbers,
            actionRenders, nonEnumerable
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

    return <div ref={containerRef} className="big-objview-container">
        <ReactTreeView<ObjectWalkingAdater, typeof parseWalkingMeta, RenderOptions>
            {...objectTree}
            lineHeight={lineHeight}
            options={options}
            RowRenderer={RenderNode}
            stickyPathHeaders={stickyPathHeaders}
            containerDivProps={containerDivProps}
            showLineNumbers={showLineNumbers}
            rowDivProps={rowDivProps}
        />
    </div>
}




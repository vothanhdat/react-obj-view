import React, { useCallback, useContext, useEffect, useMemo } from "react";
import { joinClasses } from "../utils/joinClasses";
import { useFlattenObject } from "./useFlattenObject";
import { VirtualScroller } from "../virtual-scroller/VirtualScroller";
import { RenderOptions } from "./components/RenderNode";
import { ObjectViewProps } from "./types";
import { StickyInfo, VirtualScrollerRender } from "./VirtualScrollerRender";
import "./components/style.css"



export const ReactObjView: React.FC<ObjectViewProps> = ({
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
    stickyPathHeaders: stickyPathHeader = true,
}) => {

    let value = useMemo(() => valueGetter?.(), [valueGetter])

    const { getNodeByIndex, toggleChildExpand, refreshPath, resolver, size } = useFlattenObject(
        value,
        name,
        {
            expandDepth: typeof expandLevel == 'boolean' ? (expandLevel ? 20 : 0) : Number(expandLevel),
            nonEnumerable,
            customResolver,
            arrayGroupSize,
            objectGroupSize,
            symbol: includeSymbols,
        }
    );


    const computeItemKey = useCallback(
        (index: number) => index < size ? getNodeByIndex(index).path : "",
        [getNodeByIndex, size]
    )

    const renderIndexWithStickyHeader = useCallback(
        (index: number, startIndexRaw: number): StickyInfo => {
            if (!stickyPathHeader)
                return { isStick: false, index: index }

            let starIndex = Math.floor(startIndexRaw)
            let delta = Math.floor(index - starIndex)

            let currentNode = index < size ? getNodeByIndex(index) : (undefined as never)
            let rIndex = currentNode?.parentIndex?.[delta]

            if (rIndex >= 0 && currentNode?.parentIndex.length > delta) {
                let parentNode = getNodeByIndex(rIndex)
                let minPos = rIndex + parentNode.state.childCount - startIndexRaw - 1;
                let pos = Math.min(delta, minPos)
                if (parentNode.state.childCount > 1 && startIndexRaw > 0)
                    return { isStick: true, index: rIndex, position: pos }
            }
            return { isStick: false, index: index }
        },
        [getNodeByIndex, stickyPathHeader, size]
    )

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
        [enablePreview, refreshPath, toggleChildExpand, resolver, highlightUpdate, includeSymbols, showLineNumbers]
    )

    return <>
        <div className={joinClasses("big-objview-root", className)} style={style}>
            <VirtualScroller
                height={lineHeight * size}
                size={size}
                Component={VirtualScrollerRender}
                computeActualRederKey={renderIndexWithStickyHeader}
                computeItemKey={computeItemKey}
                showLineNumbers={showLineNumbers}
                getNodeByIndex={getNodeByIndex}
                lineHeight={lineHeight}
                options={options}

            />
        </div>
    </>
}



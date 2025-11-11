import React, { useCallback, useContext, useEffect, useMemo } from "react";
import { ObjectViewProps } from "./types";
import { NodeResult, NodeResultData } from "./walkingToIndexFactory";
import { RenderNode, RenderOptions } from "../Components/RenderNode";
import { useFlattenObjectView } from "./useFlattenObjectView";
import { useWrapper } from "../hooks/useWrapper";
import "../Components/style.css"
import { VirtualScroller } from "../Components/VirtualScroller";
import { joinClasses } from "../utils/joinClasses";

export const V5Index: React.FC<ObjectViewProps> = ({
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
}) => {

    let value = useMemo(() => valueGetter(), [valueGetter])

    const { getNodeByIndex, toggleChildExpand, refreshPath, resolver, size } = useFlattenObjectView(
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

    const options = useMemo(
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

                computeItemKey={computeItemKey}
                showLineNumbers={showLineNumbers}
                getNodeByIndex={getNodeByIndex}
                lineHeight={lineHeight}
                options={options}

            />
        </div>
    </>
}

const VirtualScrollerRender: React.FC<{
    start: number, end: number,
    lineHeight: number,
    showLineNumbers: boolean,
    computeItemKey: (index: number) => string,
} & NodeRenderProps> = ({
    start, end, size,
    lineHeight,
    computeItemKey, showLineNumbers, getNodeByIndex, options
}) => {

        let startIndex = Math.floor(start / lineHeight)
        let endIndex = Math.min(size, Math.ceil(end / lineHeight))
        let renderSize = Math.min(Math.max(0, endIndex - startIndex), 500)

        let lineNumberSize = String(endIndex).length

        return <>
            {new Array(renderSize)
                .fill(0)
                .map((_, i) => i + startIndex)
                .map((index) => index < size && <div
                    key={computeItemKey(index)}
                    className="row"
                    style={{
                        position: "absolute",
                        top: `${index * lineHeight}px`,
                        height: `${lineHeight}px`,
                    }}
                >
                    {showLineNumbers && <span className="line-number">
                        {String(index).padStart(lineNumberSize, " ")}:{" "}
                    </span>}
                    <NodeRender {...{ index, getNodeByIndex, options, size }} />
                </div>)}
        </>
    }

type NodeRenderProps = {
    index: number,
    size: number,
    getNodeByIndex: (index: number) => NodeResult,
    options: RenderOptions,
}

const NodeRender: React.FC<NodeRenderProps> = ({ index, getNodeByIndex, options, size }) => {

    const nodeResult = index < size
        ? getNodeByIndex?.(index)
        : undefined

    const nodeData = useMemo(
        () => nodeResult?.getData?.(),
        [nodeResult?.state?.updateStamp]
    )

    const nodeDataWrapper = useWrapper(nodeData!)

    const valueWrapper = useWrapper(nodeData?.value)

    return nodeData && <RenderNode
        {...{ nodeDataWrapper, valueWrapper, options, }}
        key={nodeData.path} />
}

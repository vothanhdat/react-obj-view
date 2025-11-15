import React, { useCallback, useContext, useEffect, useMemo } from "react";
import { ObjectViewProps } from "./types";
import { NodeResult, NodeResultData } from "./walkingToIndexFactory";
import { RenderNode, RenderOptions } from "../Components/RenderNode";
import { useFlattenObjectView } from "./useFlattenObjectView";
import { useWrapper } from "../hooks/useWrapper";
import "../Components/style.css"
import { VirtualScroller } from "../Components/VirtualScroller";
import { joinClasses } from "../utils/joinClasses";
import { useFlattenObject } from "./useFlattenObject";

type StickyInfo = {
    index: number,
    isStick: false,
    position?: number,
    isLastStick?: boolean
} | {
    index: number,
    isStick: true
    position: number,
    isLastStick?: boolean
}

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

const VirtualScrollerRender: React.FC<{
    start: number, end: number, offset: number,
    lineHeight: number,
    showLineNumbers: boolean,
    computeItemKey: (index: number) => string,
    computeActualRederKey: (index: number, startIndex: number) => StickyInfo
} & NodeRenderProps> = ({
    start, end, offset, size,
    lineHeight,
    computeItemKey, showLineNumbers, getNodeByIndex, options,
    computeActualRederKey
}) => {
        let startIndexRaw = start / lineHeight
        let startIndex = Math.floor(start / lineHeight)
        let endIndex = Math.min(size, Math.ceil(end / lineHeight))
        let renderSize = Math.min(Math.max(0, endIndex - startIndex), 500)

        let lineNumberSize = String(endIndex).length

        return <>
            {new Array(renderSize)
                .fill(0)
                .map((_, i) => i + startIndex)
                .filter(index => index < size && index >= 0)
                .map(index => computeActualRederKey(index, startIndexRaw))
                .map((info, index, arr) => ({
                    ...info,
                    isLastStick: info.isStick && arr[index - 1] && !arr[index + 1].isStick
                } as StickyInfo))
                .map(({ isStick, index, isLastStick, position }) => <div
                    key={computeItemKey(index)}
                    className="row"
                    style={isStick ? {
                        position: "sticky",
                        top: `${position * lineHeight - offset}px`,
                        height: `${lineHeight}px`,
                        backgroundColor: "var(--bg-color)",
                        zIndex: Math.floor(100 - position),
                        borderBottom: isLastStick ? "solid 1px color-mix(in srgb, var(--color) 30%, transparent)" : ""
                    } : {
                        position: "absolute",
                        top: `${index * lineHeight}px`,
                        height: `${lineHeight}px`,
                    }}
                >
                    {showLineNumbers && <span className="line-number">
                        {String(index).padStart(lineNumberSize, " ")}:{" "}
                    </span>}
                    <NodeRender {...{ index: index, getNodeByIndex, options, size }} />
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

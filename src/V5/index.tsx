import React, { useCallback, useContext, useEffect, useMemo } from "react";
import { ObjectViewProps } from "./types";
import { NodeResult } from "./walkingToIndexFactory";
import { RenderNode, RenderOptions } from "../Components/RenderNode";
import { useFlattenObjectView } from "./useFlattenObjectView";
import { useWrapper } from "../hooks/useWrapper";
import "../Components/style.css"
import { VirtualScroller } from "../Components/VirtualScroller";

export const V5Index: React.FC<ObjectViewProps> = ({
    valueGetter,
    name,
    expandLevel,
    highlightUpdate,
    resolver: customResolver,
    nonEnumerable = false,
    preview: enablePreview = true,
    showLineNumbers = false,
    arrayGroupSize,
    objectGroupSize
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
        }) as RenderOptions,
        [enablePreview, refreshPath, toggleChildExpand, resolver, highlightUpdate]
    )

    const ctxProps = useMemo(
        () => ({ getNodeByIndex, options, size, }),
        [getNodeByIndex, options, size]
    )

    return <>
        <div className="big-objview-root" style={{}}>
            <renderCtx.Provider value={ctxProps}>
                <VirtualScroller
                    height={14 * size}
                    Component={VirtualScrollerRender}
                    size={size}
                    computeItemKey={computeItemKey}
                    showLineNumbers={showLineNumbers}
                />
            </renderCtx.Provider>
        </div>
    </>
}

const VirtualScrollerRender: React.FC<{
    start: number, end: number, size: number,
    showLineNumbers: boolean
    computeItemKey: (index: number) => string,
}> = ({ start, end, size, computeItemKey, showLineNumbers }) => {

    let startIndex = Math.floor(start / 14)
    let endIndex = Math.min(size, Math.ceil(end / 14))
    let renderSize = Math.min(endIndex - startIndex, 500)

    let lineNumberSize = String(endIndex).length

    return <>
        {new Array(renderSize)
            .fill(0)
            .map((_, i) => i + startIndex)
            .map((index) => index < size && <div
                key={computeItemKey(index)}
                className="row"
                style={{ position: "absolute", top: `${index * 14}px`, height: "14px", borderBottom: "solid 1px #8881", }}
            >
                {showLineNumbers && <span className="line-number">
                    {String(index).padStart(lineNumberSize, " ")}:{" "}
                </span>}
                <NodeRender index={index} />
            </div>)}
    </>
}

const renderCtx = React.createContext({
    getNodeByIndex: undefined as any,
    size: undefined as any,
    options: undefined as any as RenderOptions
})

const NodeRender = ({ index }: { index: number }) => {

    const { getNodeByIndex, size, options } = useContext(renderCtx)

    const nodeResult: NodeResult = index < size ? getNodeByIndex?.(index) : undefined

    const nodeData = useMemo(
        () => nodeResult?.getData?.(),
        [nodeResult?.state?.updateStamp]
    )

    const nodeDataWrapper = useWrapper(nodeData)

    const valueWrapper = useWrapper(nodeData?.value)

    return nodeResult && <RenderNode
        {...{ nodeDataWrapper, valueWrapper, options, }}
        key={nodeData.path} />
}

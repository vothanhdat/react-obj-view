import React, { useCallback, useContext, useEffect, useMemo } from "react";
import { Virtuoso } from 'react-virtuoso'
import { ObjectViewProps } from "./types";
import { NodeResult } from "./walkingToIndexFactory";
import { RenderNode, RenderOptions } from "../Components/RenderNode";
import { useFlattenObjectView } from "./useFlattenObjectView";
import { useWrapper } from "../hooks/useWrapper";
import "../Components/style.css"

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

    const nodeRender = useCallback(
        (index: number) => index < size ? <NodeRender index={index} /> : undefined,
        [NodeRender, size]
    )

    const ctxProps = useMemo(
        () => ({
            getNodeByIndex,
            toggleChildExpand,
            refreshPath,
            enablePreview,
            size,
            resolver,
        }), [getNodeByIndex, toggleChildExpand, refreshPath, enablePreview, size, resolver]
    )

    return <>
        <div className="big-objview-root" style={{ height: `400px` }}>
            <renderCtx.Provider value={ctxProps}>
                <Virtuoso
                    style={{ height: '100%' }}
                    computeItemKey={computeItemKey}
                    fixedItemHeight={14}
                    totalCount={size}
                    itemContent={nodeRender}
                />
            </renderCtx.Provider>
        </div>
    </>
}


const renderCtx = React.createContext({
    getNodeByIndex: undefined as any,
    toggleChildExpand: undefined as any,
    refreshPath: undefined as any,
    enablePreview: undefined as any,
    size: undefined as any,
    resolver: undefined as any,
})

const NodeRender = ({ index }: { index: number }) => {

    const { enablePreview, getNodeByIndex, refreshPath, toggleChildExpand, resolver, size } = useContext(renderCtx)

    const nodeResult: NodeResult = index < size ? getNodeByIndex?.(index) : undefined

    const nodeData = useMemo(
        () => nodeResult?.getData?.(),
        [nodeResult?.state?.updateStamp]
    )

    const nodeDataWrapper = useWrapper(nodeData)

    const valueWrapper = useWrapper(nodeData?.value)

    const options = useMemo(
        () => ({ enablePreview, refreshPath, toggleChildExpand, resolver, }) as RenderOptions,
        [enablePreview, refreshPath, toggleChildExpand, resolver]
    )

    return <div style={{ height: "14px", borderBottom: "solid 1px #8881", }}>
        {nodeResult && <RenderNode
            {...{
                enablePreview,
                resolver,
                toggleChildExpand,
                refreshPath,
                nodeDataWrapper,
                valueWrapper,
                options,

            }}
            key={nodeData.path} />}
    </div>
}

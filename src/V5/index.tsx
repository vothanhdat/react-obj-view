import { useCallback, useEffect, useMemo } from "react";
import { Virtuoso } from 'react-virtuoso'
import { ObjectViewProps } from "./types";
import { groupArrayResolver, groupObjectResolver } from "./resolvers/grouped";
import { NodeResult } from "./walkingToIndexFactory";
import { RenderNode } from "../Components/RenderNode";
import { useFlattenObjectView } from "./useFlattenObjectView";
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

    const dataPLeft = String(size).length

    const NodeRender = useCallback(
        ({ index }: { index: number }) => {
            const nodeResult: NodeResult = getNodeByIndex(index);
            const nodeData = useMemo(
                () => nodeResult.getData(),
                [nodeResult.state.updateStamp]
            )

            return <div style={{ height: "14px", borderBottom: "solid 1px #8881", }}>
                {showLineNumbers &&
                    <span className="index-counter">
                        {String(index).padStart(dataPLeft, " ")}
                    </span>
                }
                <RenderNode
                    {...{
                        enablePreview,
                        resolver,
                        toggleChildExpand,
                        refreshPath,
                        nodeData,
                        value: nodeData.value,
                    }}
                    key={nodeData.path} />
            </div>
        },
        [getNodeByIndex, toggleChildExpand, refreshPath, enablePreview, showLineNumbers ? dataPLeft : 0]
    )

    const nodeRender = useCallback(
        (index: number) => <NodeRender index={index} />,
        [NodeRender, toggleChildExpand, enablePreview, showLineNumbers ? dataPLeft : 0]
    )

    const computeItemKey = useCallback(
        (index: number) => getNodeByIndex(index).path,
        [getNodeByIndex]
    )

    return <>
        <div className="big-objview-root" style={{ height: `400px` }}>
            <Virtuoso
                style={{ height: '100%' }}
                computeItemKey={computeItemKey}
                fixedItemHeight={14}
                totalCount={size}
                itemContent={nodeRender}
            />
        </div>
    </>
}



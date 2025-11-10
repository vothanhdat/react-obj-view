import { useCallback } from "react";
import { ResolverFn } from "../V5/types";

import { NodeResultData, objectHasChild, WalkingResult } from "../V5/walkingToIndexFactory";
import { RenderName } from "./RenderName";
import { RenderValue } from "./RenderValue";
import { LazyValueError } from "../V5/LazyValueWrapper";
import { GroupedProxy } from "../utils/groupedProxy";
import { useChangeFlashClasses } from "../utils/useChangeFlashClasses";


export type RenderOptions = {
    enablePreview: boolean;
    resolver?: Map<any, ResolverFn>
    toggleChildExpand: (node: NodeResultData) => void
    refreshPath: (node: NodeResultData) => void
}

const NodeRenderDefault: React.FC<{
    nodeDataWrapper: () => NodeResultData;
    valueWrapper: () => unknown,
    options: RenderOptions
}> = ({ nodeDataWrapper, valueWrapper, options }) => {

    const nodeData = nodeDataWrapper()

    const value = valueWrapper()

    const { enablePreview, refreshPath, toggleChildExpand, resolver } = options

    const isExpanded = nodeData.expanded

    const isCircular = nodeData.isCircular;

    const hasChild = objectHasChild(value)
        && !(value instanceof LazyValueError);

    const isPreview = enablePreview
        && (hasChild || value instanceof LazyValueError)
        && !isExpanded
        && typeof value != "function"
        && !(value instanceof Error)
        && !(value instanceof GroupedProxy)

    const bindRefreshPath = useCallback(
        () => {
            console.log("nodeData.path", nodeData.path)
            refreshPath(nodeData)
        },
        [refreshPath, nodeData]
    )

    const ref = useChangeFlashClasses({ value, flashClassname: 'updated' }) as any


    return <div className="node-container" style={{ paddingLeft: `${(nodeData.depth - 1) * 1.5}em` }}>
        <div
            className="node-default"
            data-child={hasChild}
            data-nonenumrable={!nodeData.enumerable}
            onClick={() => hasChild && toggleChildExpand(nodeData)}
        >
            <span className="expand-symbol">
                {hasChild && !isCircular ? (isExpanded ? "▼ " : "▶ ") : <>&#160;&#160;</>}
            </span>

            <RenderName ref={ref} {...{
                depth: nodeData.depth,
                name: String(nodeData.name ?? "ROOT"),
            }} />

            <span className="symbol">: </span>

            {isCircular ? <span className="tag-circular">CIRCULAR</span> : <></>}

            <RenderValue {...{
                valueWrapper,
                isPreview,
                enumrable: nodeData.enumerable,
                resolver,
                refreshPath: bindRefreshPath,
            }} />

        </div>
    </div>;
}

export const RenderNode = NodeRenderDefault




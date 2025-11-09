import { useCallback } from "react";
import { ResolverFn } from "../V5/types";

import { NodeResultData, objectHasChild, WalkingResult } from "../V5/walkingToIndexFactory";
import { withPromiseWrapper } from "./PromiseWrapper";
import { RenderName } from "./RenderName";
import { RenderValue } from "./RenderValue";


const NodeRenderDefault: React.FC<{
    nodeData: NodeResultData;
    enablePreview: boolean;
    value: unknown,
    resolver?: Map<any, ResolverFn>
    toggleChildExpand: (node: NodeResultData) => void
    refreshPath: (node: NodeResultData) => void
}> = ({ nodeData, value, toggleChildExpand, refreshPath, resolver, enablePreview = true }) => {

    const isExpanded = nodeData.expanded

    const isCircular = nodeData.isCircular;

    const hasChild = objectHasChild(value);

    const isPreview = enablePreview && hasChild && !isExpanded && typeof value != "function"

    const bindRefreshPath = useCallback(
        () => {
            console.log("nodeData.path",nodeData.path)
            refreshPath(nodeData)
        },
        [refreshPath, nodeData]
    )

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

            <RenderName {...{
                depth: nodeData.depth,
                name: String(nodeData.name ?? "ROOT"),
            }} />

            <span className="symbol">: </span>

            {isCircular ? <span className="tag-circular">CIRCULAR</span> : <></>}

            <RenderValue {...{
                value: value,
                isPreview,
                enumrable: nodeData.enumerable,
                resolver,
                refreshPath: bindRefreshPath,
            }} />

        </div>
    </div>;
}

export const RenderNode = withPromiseWrapper(NodeRenderDefault)




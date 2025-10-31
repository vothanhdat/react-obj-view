import { joinClasses } from "../ObjectViewV2/utils/joinClasses";
import { NodeData } from "./NodeData";

export const RenderNode: React.FC<{
    node: NodeData;
    toggleChildExpand: (node: NodeData) => void
}> = ({ node, toggleChildExpand }) => {

    const isExpanded = node.walkState?.isExpanded
        ?? node.depth < node.walkState.config.expandDepth;

    const isCircular = node.isCircular;

    const hasChild = node.hasChild;

    return <div className="node-container" data-level={node.depth}>
        <div
            className="node-default"
            data-child={node.hasChild}
            data-nonenumrable={!node.enumerable}
            onClick={() => node.hasChild && toggleChildExpand(node)}
        >
            <span className="expand-symbol">
                {hasChild && !isCircular ? (isExpanded ? "▼ " : "▶ ") : <>&#160;&#160;</>}
            </span>
            <span className="name">
                {node.depth == 0 ? "ROOT" : String(node.name)}
            </span>

            <span className="symbol">: </span>

            {isCircular ? <span className="tag-circular">CIRCULAR</span> : <></>}

            <RenderValue {...{
                value: node.value,
                enumrable: node.enumerable
            }} />

        </div>
    </div>;
};


export const RenderValue: React.FC<{ value: any, enumrable?: boolean }> = ({ value }) => {
    return <span className={joinClasses(
        "value",
        `type-${typeof value}`,
        value?.constructor?.name ? `type-object-${value?.constructor?.name}`?.toLowerCase() : ``
    )}>
        {String(value)?.slice(0, 50)}
    </span>
}
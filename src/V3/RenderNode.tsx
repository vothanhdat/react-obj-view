import { NodeData } from "./NodeData";

export const RenderNode: React.FC<{
    node: NodeData;
    toggleChildExpand: (node: NodeData) => void
}> = ({ node, toggleChildExpand }) => {

    const isExpanded = node.walkState?.isExpanded
        ?? node.depth < node.walkState.expandDepth;
    const isCircular = node.isCircular;
    const hasChild = node.hasChild;

    return <div style={{
        display: "block",
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
        paddingLeft: `${node.depth * 2}em`,
    }}>

        <div
            style={{
                display: "inline",
                cursor: node.hasChild ? 'pointer' : '',
                userSelect: node.hasChild ? 'none' : 'inherit',
            }}
            onClick={() => node.hasChild && toggleChildExpand(node)}
        >
            <span className="expand-symbol">
                {hasChild && !isCircular ? (isExpanded ? "▼ " : "▶ ") : <>&#160;&#160;</>}
            </span>
            {node.depth == 0 ? "ROOT" : String(node.name)}
            :
            {isCircular ? <span>CIRCULAR</span> : <></>}
            {String(node.value)?.slice(0, 50)}
        </div>
    </div>;
};

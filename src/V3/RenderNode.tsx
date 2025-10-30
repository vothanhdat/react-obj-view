import { useEffect, useRef } from "react";
import { NodeData } from "./NodeData";

export const RenderNode: React.FC<{
    node: NodeData;
    toggleChildExpand: (node: NodeData) => void
}> = ({ node, toggleChildExpand }) => {


    const is_expand = node.walkState?.is_expand
        ?? node.depth < node.walkState.expand_depth
    const hasChild = node.hasChild

    return <div
        style={{
            paddingLeft: `${node.depth * 2}em`,
            display: "inline",
            cursor: node.hasChild ? 'pointer' : '',
            userSelect: node.hasChild ? 'none' : 'inherit',
        }}
        onClick={() => node.hasChild && toggleChildExpand(node)}
    >
        <span className="expand-symbol" style={{ whiteSpace: "preserve" }}>
            {hasChild ? (is_expand ? "▼ " : "▶ ") : "  "}
        </span>
        {node.depth == 0 ? "ROOT" : String(node.name)}
        :
        {String(node.value)?.slice(0, 50)}
    </div>;
};

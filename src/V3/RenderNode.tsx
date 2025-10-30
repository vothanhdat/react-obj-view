import { Dispatch, SetStateAction } from "react";
import { NodeData } from "./NodeData";

export const RenderNode: React.FC<{
    node: NodeData;
    toggleChildExpand: (node: NodeData) => void
}> = ({ node, toggleChildExpand }) => {
    return <div
        style={{
            paddingLeft: `${node.depth * 2}em`,
            display: "inline",
            cursor: node.hasChild ? 'pointer' : '',
            userSelect: node.hasChild ? 'none' : 'inherit',
        }}
        onClick={() => node.hasChild && toggleChildExpand(node)}
    >
        {node.depth == 0 ? "ROOT" : String(node.name)}
        :
        {String(node.value)?.slice(0, 50)}
    </div>;
};

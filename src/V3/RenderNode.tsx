import { NodeData } from "./NodeData";

export const RenderNode: React.FC<{ node: NodeData; }> = ({ node }) => {
    return <div style={{ paddingLeft: `${node.depth * 2}em`, display: "inline", }}>
        {node.depth == 0 ? "ROOT" : String(node.name)}
        :
        {String(node.value)?.slice(0, 50)}
    </div>;
};

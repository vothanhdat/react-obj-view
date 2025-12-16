import { HighlightString } from "../hooks/useHighlight";


export const RenderName: React.FC<{ depth?: number; name: string; highlight?: boolean; ref?: any }> = ({
    depth = undefined, name, highlight, ref
}) => {
    return <span className="name" ref={ref}>
        <HighlightString text={depth == 0 ? "ROOT" : String(name)} enable={highlight} />
    </span>;
}
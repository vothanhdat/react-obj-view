import { forwardRef } from "react";
import { HighlightString } from "../hooks/useHighlight";


export const RenderName: React.FC<{ depth?: number; name: string; ref?: any }> = forwardRef(
    function RenderName({ depth = undefined, name }, ref: any) {
        return <span className="name" ref={ref}>
            <HighlightString text={depth == 0 ? "ROOT" : String(name)} />
        </span>;
    },
)

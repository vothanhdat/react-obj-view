import { forwardRef } from "react";


export const RenderName: React.FC<{ depth?: number; name: string; ref?: any }> = forwardRef(
    function RenderName({ depth = undefined, name }, ref: any) {
        return <span className="name" ref={ref}>
            {depth == 0 ? "ROOT" : String(name)}
        </span>;
    },
)

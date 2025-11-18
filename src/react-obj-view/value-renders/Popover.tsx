import { useId } from "react";
import "./popover.css"



export const RenderPopover: React.FC<{ value: string; shortValue: string; }> = ({ value, shortValue }) => {

    const id = '--' + useId();

    return <>
        <span style={{ anchorName: id, } as any} className="popover-anchor">
            {shortValue}
        </span>
        <pre style={{ positionAnchor: id } as any} className="popover-content">
            {value}
        </pre>
    </>;
};

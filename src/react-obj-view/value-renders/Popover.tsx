import { useId } from "react";
import "./popover.css"
import { HighlightString } from "../hooks/useHighlight";



export const RenderPopover: React.FC<{ value: string; shortValue: string; }> = ({ value, shortValue }) => {

    const id = '--' + useId();

    return <>
        <span style={{ anchorName: id, } as any} className="popover-anchor">
            <HighlightString text={shortValue} />
        </span>
        <pre style={{ positionAnchor: id } as any} className="popover-content">
            <HighlightString text={value} />
        </pre>
    </>;
};

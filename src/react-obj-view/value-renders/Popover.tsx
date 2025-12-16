import { useId } from "react";
import "./popover.css"
import { HighlightString } from "../hooks/useHighlight";



export const RenderPopover: React.FC<{ value: string; shortValue: string; highlight?: boolean }> = ({ value, shortValue, highlight = true }) => {

    const id = '--' + useId();

    return <>
        <span style={{ anchorName: id, } as any} className="popover-anchor">
            <HighlightString enable={highlight} text={shortValue} />
        </span>
        <pre style={{ positionAnchor: id } as any} className="popover-content">
            <HighlightString enable={highlight} text={value} />
        </pre>
    </>;
};

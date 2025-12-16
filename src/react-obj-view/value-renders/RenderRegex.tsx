import { HighlightString } from "../hooks/useHighlight";
import { RenderPopover } from "./Popover";
import { useStringDisplay } from "./useStringDisplay";

export const RenderRegex: React.FC<{ value: RegExp; depth: number; highlight?: boolean }> = ({ value, depth, highlight = true }) => {

    const { fullValue, shortValue, enablePopover } = useStringDisplay(
        String(value),
        depth
    )

    return <>

        {enablePopover
            ? <RenderPopover {...{ value: fullValue, shortValue, highlight }} />
            : <HighlightString text={shortValue} enable={highlight} />
        }
    </>
};



import { HighlightString } from "../hooks/useHighlight";
import { RenderPopover } from "./Popover";
import { useStringDisplay } from "./useStringDisplay";

export const RenderRegex: React.FC<{ value: RegExp; depth: number; }> = ({ value, depth }) => {

    const { fullValue, shortValue, enablePopover } = useStringDisplay(
        String(value),
        depth
    )

    return <>

        {enablePopover
            ? <RenderPopover {...{ value: fullValue, shortValue }} />
            : <HighlightString text={shortValue} />
        }
    </>
};



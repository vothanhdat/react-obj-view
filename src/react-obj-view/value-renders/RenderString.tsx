import { HighlightString } from "../hooks/useHighlight";
import { RenderPopover } from "./Popover";
import { useStringDisplay } from "./useStringDisplay";

export const RenderString: React.FC<{ value: string; depth: number; highlight?: boolean }> = ({ value, depth, highlight = true }) => {

    const { fullValue, shortValue, enablePopover } = useStringDisplay(
        JSON.stringify(value).slice(1, -1),
        depth
    )

    let renderStr = depth == 0
        ? `"${shortValue}"`
        : `'${shortValue}'`


    return <>
        {enablePopover
            ? <RenderPopover {...{
                value: fullValue,
                shortValue: renderStr
            }} />
            : <HighlightString text={renderStr} enable={highlight} />
        }
    </>
};



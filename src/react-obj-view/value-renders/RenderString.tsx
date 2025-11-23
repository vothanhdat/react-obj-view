import { RenderPopover } from "./Popover";
import { useStringDisplay } from "./useStringDisplay";

export const RenderString: React.FC<{ value: string; depth: number; }> = ({ value, depth }) => {

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
            : renderStr
        }
    </>
};



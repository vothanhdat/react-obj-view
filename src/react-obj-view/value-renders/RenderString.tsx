import { RenderPopover } from "./Popover";

export const RenderString: React.FC<{ value: string; depth: number; }> = ({ value, depth }) => {

    const max = depth == 0 ? 100 : 20;
    const renderStr = JSON.stringify(value);
    const addChar = renderStr.length > max ? '…' : '';
    const enableAnchor = ((value.length > 40) || value?.includes("\n"))
    const shortValue = depth > 0
        ? "'" + renderStr.slice(1, -1).slice(0, max) + addChar + "'"
        : renderStr.slice(0, max) + addChar

    return <>

        {enableAnchor
            ? <RenderPopover {...{ value, shortValue }} />
            : shortValue
        }
    </>
};



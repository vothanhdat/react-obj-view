import { useWrapper } from "../../libs/react-tree-view";
import { RenderOptions } from "../types";
import { RenderValue } from "../components/RenderValue";


export const RenderRawEntry = ({ depth, valueWrapper, options }: { valueWrapper: any; depth: any; options: RenderOptions; }) => {
    const value = valueWrapper();

    const wrapperKey = useWrapper(value.key);
    const wrapperValue = useWrapper(value.value);
    return <>
        <RenderValue {...{ valueWrapper: wrapperKey, isPreview: false, depth: depth + 1, options }} />
        <span className="symbol">{" => "}</span>
        <RenderValue {...{ valueWrapper: wrapperValue, isPreview: false, depth: depth + 1, options }} />
    </>;
};

import { useMemo } from "react";
import { RenderOptions } from "../types";
import type { ItemViewBase } from "../../object-tree/resolver";


export const RenderBufferItem = ({ depth, valueWrapper, options }: {
    valueWrapper: () => ItemViewBase;
    options: RenderOptions;
    depth: any;
}) => {
    const value = valueWrapper();
    const [rendered, chars] = useMemo(
        () => [value.render(), value.chars()] as [string[], string[] | undefined],
        [value]
    )

    return <>
        <span className="buffer-view">
            {rendered.map((item, index) => <span
                key={index}
            >{item}</span>)}
        </span>
        {chars ? <span className="buffer-view-chars">
            {chars.map((item, index) => <span
                key={index}
            >{item}</span>)}
        </span> : <></>}
    </>
};

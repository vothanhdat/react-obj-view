import { useMemo } from "react";
import { ItemViewBase } from "../../object-tree/resolver/typedArray";
import { RenderOptions } from "../types";


export const RenderBufferItem = ({ depth, valueWrapper, options }: {
    valueWrapper: () => ItemViewBase;
    options: RenderOptions;
    depth: any;
}) => {
    const value = valueWrapper();
    const rendered = useMemo(
        () => value.render(),
        [value]
    )
    return <span style={{whiteSpace:'pre'}}>
        {rendered}
    </span>;
};

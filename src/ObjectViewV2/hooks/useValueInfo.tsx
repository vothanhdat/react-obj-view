import { useState, useCallback } from "react";
import { GroupedProxy } from "../utils/groupedProxy";
import { JSONViewCtx } from "../types";

export const useValueInfo = (value: any, path: string, level: number, trace: any[], isNonenumerable: boolean, { expandLevel, expandRef }: JSONViewCtx, traces: any[]) => {
    const [, reload] = useState(0);

    const isCircular = traces.length > 1 && traces.at(0) == traces.at(-1)

    const isInGroupping = value instanceof GroupedProxy;

    const hasChilds = value && (
        (value instanceof Object && !(value instanceof Date) && !(value instanceof RegExp))
        || value == Object.prototype
    );

    const defaultExpand = hasChilds && !isCircular && !isNonenumerable && level < expandLevel;

    const expandChild = hasChilds && (expandRef.current[path] ?? defaultExpand);

    const setExpandChild = useCallback(
        (value: boolean) => {
            expandRef.current[path] = value;
            reload(e => e + 1);
        },
        [expandRef]
    );


    return {
        hasChilds,
        isCircular,
        expandChild,
        setExpandChild: hasChilds ? setExpandChild : undefined,
        isInGroupping,
    };
};

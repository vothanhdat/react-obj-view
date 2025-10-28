import { useState, useCallback } from "react";
import { GroupedProxy } from "../utils/groupedProxy";
import { JSONViewCtx } from "../types";

export const useValueInfo = (value: any, path: string, level: number, trace: any[], isNonenumerable: boolean, { expandLevel, expandRef }: JSONViewCtx) => {
    const [, reload] = useState(0);

    const isInGroupping = value instanceof GroupedProxy;

    const hasChilds = value && (
        (value instanceof Object && !(value instanceof Date) && !(value instanceof RegExp))
        || value == Object.prototype
    );

    const defaultExpand = hasChilds && !isNonenumerable && level < expandLevel;

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
        expandChild,
        setExpandChild: hasChilds ? setExpandChild : undefined,
        isInGroupping,
    };
};

import { useState, useCallback } from "react";
import { JSONViewProps } from "../JSONViewProps";


export const useExpandState = ({ path, expandLevel, context: { expandRootRef } }: JSONViewProps, isCircular = false) => {
    const [, reload] = useState(0);
    const expandKeys = path?.join("/") ?? "";

    const defaultExpand = typeof expandLevel == "boolean"
        ? expandLevel
        : (typeof expandLevel == 'number' && expandLevel > 0);

    const isExpand = expandRootRef?.current?.[expandKeys] ?? (defaultExpand && !isCircular);

    const setExpand = useCallback(
        (value: boolean) => {
            if (expandRootRef.current) {
                expandRootRef.current[expandKeys] = value;;
                reload?.(Math.random());
            }
        },
        [expandKeys]
    );

    return { isExpand, setExpand, expandKeys };

};

import React, { type Dispatch, type SetStateAction, useMemo, useRef, Ref } from "react";
import { JSONViewCtx } from "./JSONViewProps";
import { ObjectRouter } from "./ObjectRouter";

export type ObjectViewProps = {
    value: any;
    name?: string;
    style?: any;
    expandLevel?: number | boolean;
    objectGrouped?: number;
    arrayGrouped?: number;
};

export const ObjectView: React.FC<ObjectViewProps> = ({ value, name, style, expandLevel = false, objectGrouped = 25, arrayGrouped = 10 }) => {

    const expandRootRef = useRef<Record<string, boolean>>({})

    const context: JSONViewCtx = useMemo(() => ({
        expandRootRef,
        objectGrouped,
        arrayGrouped,
    }), [expandRootRef, objectGrouped, arrayGrouped])

    const emptyPath = useMemo(() => [], [])
    const emptyTrace = useMemo(() => [], [])

    return <div className="jv-root" style={style}>
        <ObjectRouter
            path={emptyPath}
            trace={emptyTrace}
            {...{ name, value, context, expandLevel }} />
    </div>;
};

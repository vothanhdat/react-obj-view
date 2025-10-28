import React, { CSSProperties, useDeferredValue, useEffect, useEffectEvent, useMemo, useRef } from "react";
import "./style.css";

import { Constructor, JSONViewCtx } from "./types";
import { ObjectRender } from "./ObjectRender";


export const NameRender: React.FC<{ name: string }> = ({ name }) => {
    return <span className="name">{String(name)}</span>
}

export type ObjectViewProps = {
    value: any;
    name?: string;
    style?: any;
    expandLevel?: number | boolean;
    objectGrouped?: number;
    arrayGrouped?: number;
    customRender?: Map<Constructor, React.FC<any>>,
    highlightUpdate?: boolean
    preview?: boolean,
};

export const ObjectViewV2: React.FC<ObjectViewProps> = ({
    value, name = "", style, expandLevel = false,
    objectGrouped = 100, arrayGrouped = 10,
    customRender = undefined,
    highlightUpdate = true
}) => {

    const expandRootRef = useRef<Record<string, boolean>>({})

    const context: JSONViewCtx = useMemo(() => ({
        expandRef: expandRootRef,
        expandLevel: expandLevel === true ? 9999 : expandLevel,
        preview: true,
        nonEnumerable: true,
    } as JSONViewCtx), [expandLevel, expandRootRef])

    return <div className="objview-root" style={style}>
        <ObjectRender {...{ name, value, context, level: 0, path: "", isNonenumerable: false }} />
    </div>
};


import React, { CSSProperties, useDeferredValue, useEffect, useEffectEvent, useMemo, useRef } from "react";
import "./style.css";

import { Constructor, JSONViewCtx, ResolverFn } from "./types";
import { ObjectRenderWrapper } from "./ObjectRender";
import { DEFAULT_RESOLVER } from "./resolver";
import { ARRAY_EMPTY, MAP_EMPTY } from "../utils/const";
import { isRef } from "../utils/isRef";


export const NameRender: React.FC<{ name: string }> = ({ name }) => {
    return <span className="name">{String(name)}</span>
}

export type ObjectViewProps = {
    valueGetter: any;
    name?: string;
    style?: any;
    expandLevel?: number | boolean;
    objectGroupSize?: number;
    arrayGroupSize?: number;
    resolver?: Map<any, ResolverFn>
    highlightUpdate?: boolean
    preview?: boolean,
    nonEnumerable?: boolean,
    showLineNumbers?: boolean,
};


export const ObjectViewV2: React.FC<ObjectViewProps> = ({
    value, name = "", style, expandLevel = false,
    objectGroupSize = 100,
    arrayGroupSize = 10,
    resolver = MAP_EMPTY,
    highlightUpdate = true,
    preview = true,
    nonEnumerable = true,
}) => {

    const expandLevelRef = useRef(expandLevel)
    const expandRef = useRef<Record<string, boolean>>({})
    if (expandLevelRef.current != expandLevel) {
        expandLevelRef.current = expandLevel;
        expandRef.current = {};
    }

    const combineResolver = useMemo(
        () => new Map([
            ...DEFAULT_RESOLVER,
            ...resolver ?? {},
        ]), [resolver]
    )

    const context: JSONViewCtx = useMemo(() => ({

        expandRef, preview, nonEnumerable,
        arrayGroupSize, objectGroupSize,
        highlightUpdate,

        expandLevel: expandLevel === true ? 9999 : expandLevel,
        resolver: combineResolver,

    } as JSONViewCtx), [
        expandLevel, expandRef, combineResolver,
        arrayGroupSize, objectGroupSize, preview,
        nonEnumerable, highlightUpdate,
    ])

    const traces = useMemo(() => isRef(value)
        ? [value]
        : ARRAY_EMPTY,
        [value]
    )

    return <div className="objview-root" style={style}>
        <ObjectRenderWrapper {...{
            name, value, context, level: 0, path: "",
            isNonenumerable: false,
            traces
        }} />
    </div>
};


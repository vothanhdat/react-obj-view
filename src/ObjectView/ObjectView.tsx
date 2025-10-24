import React, { type Dispatch, type SetStateAction, useMemo, useRef, Ref } from "react";
import { CustomViewMap, JSONViewCtx, JSONViewProps, Constructor } from "./JSONViewProps";
import { ObjectRouter } from "./ObjectRouter";
import { PromiseView } from "./addons/PromiseView";
import { MapView } from "./addons/MapView";
import { SetView } from "./addons/SetView";

export type ObjectViewProps = {
    value: any;
    name?: string;
    style?: any;
    expandLevel?: number | boolean;
    objectGrouped?: number;
    arrayGrouped?: number;
    customRender?: Map<Constructor, React.FC<JSONViewProps>>,
    highlightUpdate?: boolean
};

const DEFAULT_CUSTOM_VIEW = new Map<Constructor, React.FC<JSONViewProps>>([
    [Map, MapView],
    [Set, SetView],
    [Promise, PromiseView],
]) as CustomViewMap


export const ObjectView: React.FC<ObjectViewProps> = ({
    value, name, style, expandLevel = false,
    objectGrouped = 25, arrayGrouped = 10,
    customRender = undefined,
    highlightUpdate = true
}) => {

    const expandRootRef = useRef<Record<string, boolean>>({})

    const context: JSONViewCtx = useMemo(() => ({
        expandRootRef,
        objectGrouped,
        arrayGrouped,
        highlightUpdate,
        customView: new Map([
            ...DEFAULT_CUSTOM_VIEW,
            ...customRender ?? [],
        ])
    } as JSONViewCtx), [expandRootRef, objectGrouped, arrayGrouped, customRender, highlightUpdate])

    const emptyPath = useMemo(() => [], [])
    const emptyTrace = useMemo(() => [], [])

    return <div className="jv-root" style={style}>
        <ObjectRouter
            path={emptyPath}
            trace={emptyTrace}
            {...{ name, value, context, expandLevel }} />
    </div>
};

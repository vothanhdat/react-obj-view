import React, { useCallback, useDeferredValue, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { createIterator } from "./utils";

export type Constructor<T = {}> = new (...args: any[]) => T;

type JSONViewCtx = {
    expandLevel: number,
    preview: boolean,
    expandRef: React.RefObject<Record<string, boolean>>
}


const useValueInfo = (value: any, path: string, level: number, trace: any[], isNonenumerable: boolean, { expandLevel, expandRef }: JSONViewCtx) => {
    const [, reload] = useState(0)
    const hasChilds = value && value instanceof Object && !(value instanceof Date) && !(value instanceof RegExp)
    const defaultExpand = hasChilds && !isNonenumerable && level <= expandLevel;
    const expandChild = hasChilds && (expandRef.current[path] ?? defaultExpand)
    // console.log({ path, "expandRef.current[path]": expandRef.current[path] })
    const setExpandChild = useCallback(
        (value: boolean) => {
            expandRef.current[path] = value;
            reload(e => e + 1)
        },
        [expandRef]
    )

    return {
        hasChilds,
        expandChild,
        setExpandChild: hasChilds ? setExpandChild : undefined,
    }
}

type ObjectRenderProps = {
    name: string
    isNonenumerable: boolean
    value: any
    path: string
    level: number
    context: JSONViewCtx
    renderName?: boolean
}


const ValueInline: React.FC<{ value: any, isPreview: boolean }> = ({ value, isPreview = false }) => {
    switch (typeof value) {
        case "boolean":
        case "number":
        case "symbol":
        case "undefined":
        case "function":
            return <span className={"value type-" + typeof value}>{String(value)}</span>
        case "bigint":
            return <span className={"value type-" + typeof value}>{String(value)}n</span>
        case "string":
            return <span className={"value type-" + typeof value}>{JSON.stringify(value)}</span>
        case "object": {
            if (!value) {
                return <span className={"value type-null"}>{String(value)}</span>
            } else if (value instanceof RegExp) {
                return <span className={"value type-regexp"}>{String(value)}</span>
            } else if (value instanceof Date) {
                return <span className={"value type-date"}>{String(value)}</span>
            } else if (value instanceof Error) {
                return <span className={"value type-error"}>{String(value)}</span>
            } else if (value instanceof Array) {
                return isPreview
                    ? <span>{`Array(${value.length})`}</span>
                    : <AllChildsPreview value={value} />
            } else if (value instanceof Object) {
                return isPreview
                    ? <span>{(value.constructor?.name ?? `Object`)}</span>
                    : <AllChildsPreview value={value} />
            }
        }
    }
    return <span>{JSON.stringify(value, null, 2)}</span>
}

const AllChildsPreview: React.FC<{ value: any }> = ({ value }) => {
    const renderName = !(value instanceof Array || value instanceof Set)
    const entries = Object.entries(value)
    return <span style={{ opacity: 0.5, overflow: "hidden" }}>
        {value instanceof Array ? "[" : "{"}
        {entries
            .slice(0, 5)
            .map(([k, v], index) => <>
                {index > 0 ? "," : ""}
                {renderName && <><NameRender name={k} />:</>}
                <ValueInline value={v} isPreview />
            </>)}
        {entries.length > 5 ? ",…" : ""}
        {value instanceof Array ? "]" : "}"}
    </span>
}


const AllChilds: React.FC<ObjectRenderProps> = ({ name, value, path = "", level = 0, context }) => {
    // const renderName = !( value instanceof Set)
    const iterator = useMemo(
        () => createIterator(true, false),
        []
    )

    const allIterators = useMemo(
        () => value ? [...iterator(value)] : [],
        [iterator, value]
    )


    return allIterators
        .map(({ name, data, isNonenumerable = false }) => <ObjectRender
            key={path + "." + name}
            {...{
                name: name,
                value: data,
                isNonenumerable,
                path: path + "." + name,
                level: level + 1,
                context
            }}
        />)
}



const NameRender: React.FC<{ name: string, isNonenumerable?: boolean }> = ({ name, isNonenumerable = false }) => {
    return <span style={{ opacity: isNonenumerable ? 0.5 : 1 }}>{name}</span>
}

const ObjectRender: React.FC<ObjectRenderProps> = ({ name, value, path = "", level = 0, context, isNonenumerable, renderName = true, }) => {
    const { expandChild, setExpandChild, hasChilds } = useValueInfo(value, path, level, [], isNonenumerable, context)

    return <>
        <div onClick={() => setExpandChild?.(!expandChild)} style={{
            overflow: "hidden",
            whiteSpace: "preserve nowrap",
            textOverflow: "ellipsis"
        }}>
            <span style={{ opacity: 0.5 }}>{hasChilds ? (expandChild ? "▼ " : "▶ ") : "  "}</span>
            {renderName && <><NameRender {...{ name, isNonenumerable }} />:</>}
            <ValueInline {...{ value, isPreview: expandChild || !context.preview }} />
        </div>
        {expandChild ? <div style={{ paddingLeft: "1.2em" }}>
            <AllChilds {...{ name, value, path, level, context, isNonenumerable }} />
        </div> : ""}

    </>
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
    objectGrouped = 25, arrayGrouped = 10,
    customRender = undefined,
    highlightUpdate = true
}) => {

    const expandRootRef = useRef<Record<string, boolean>>({})

    const context: JSONViewCtx = useMemo(() => ({
        expandRef: expandRootRef,
        expandLevel: expandLevel === true ? 9999 : expandLevel,
        preview: true,
    } as JSONViewCtx), [expandLevel, expandRootRef])


    return <div className="jv-root" style={style}>
        <pre style={{ padding: 0 }}>
            <ObjectRender {...{ name, value, context, level: 0, path: "" }} />
        </pre>
    </div>
};


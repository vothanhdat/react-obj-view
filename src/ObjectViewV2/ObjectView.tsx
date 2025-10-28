import React, { CSSProperties, Fragment, useCallback, useDeferredValue, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import "./style.css";
import { GroupedProxy, getObjectGroupProxyEntries } from "./GroupedProxy";
import { createIterator } from "./utils";


export type Constructor<T = {}> = new (...args: any[]) => T;

type JSONViewCtx = {
    expandLevel: number,
    expandRef: React.RefObject<Record<string, boolean>>,
    preview: boolean,
    nonEnumerable: boolean,
}


const useValueInfo = (value: any, path: string, level: number, trace: any[], isNonenumerable: boolean, { expandLevel, expandRef }: JSONViewCtx) => {
    const [, reload] = useState(0)

    const isInGroupping = value instanceof GroupedProxy

    const hasChilds = value && (
        (value instanceof Object && !(value instanceof Date) && !(value instanceof RegExp))
        || value == Object.prototype
    )

    const defaultExpand = hasChilds && !isNonenumerable && level < expandLevel;

    const expandChild = hasChilds && (expandRef.current[path] ?? defaultExpand)

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
        isInGroupping,
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

const joinClasses = (...e: (string | false | undefined)[]) => e.filter(Boolean).join(" ")


const ValueInline: React.FC<{ value: any, isPreview: boolean, className?: string }> = ({ value, className, isPreview = false }) => {
    switch (typeof value) {
        case "boolean":
        case "number":
        case "symbol":
        case "undefined":
        case "function":
            return <span className={joinClasses("value", "type-" + typeof value, className)}>{String(value)}</span>
        case "bigint":
            return <span className={joinClasses("value", "type-" + typeof value, className)}>{String(value)}n</span>
        case "string":
            return <span className={joinClasses("value", "type-" + typeof value, className)}>{JSON.stringify(value)}</span>
        case "object": {
            const classes = joinClasses(`value type-object-${value?.constructor?.name?.toLowerCase() ?? "null"}`, className);
            if (!value) {
                return <span className={classes}>{String(value)}</span>
            } else if (value instanceof RegExp) {
                return <span className={classes}>{String(value)}</span>
            } else if (value instanceof Date) {
                return <span className={classes}>{String(value)}</span>
            } else if (value instanceof Error) {
                return <span className={joinClasses("value", "type-object-error", className)}>{String(value)}</span>
            } else if (value instanceof Array) {
                return isPreview
                    ? <span className={classes} >{`Array(${value.length})`}</span>
                    : <AllChildsPreview className={joinClasses('value', className)} value={value} />
            } else if (value instanceof Map || value instanceof Set) {

                return isPreview
                    ? <span className={classes} >{`${value.constructor?.name}(${value.size})`}</span>
                    : <AllChildsPreview className={joinClasses('value', className)} value={value} />
            } else if (value instanceof Object) {
                return isPreview
                    ? <span className={classes}>{(value.constructor?.name ?? `Object`)}</span>
                    : <AllChildsPreview className={joinClasses('value', className)} value={value} />
            }
        }
    }
    return <span>{JSON.stringify(value, null, 2)}</span>
}

const AllChildsPreview: React.FC<{ value: any, style?: React.CSSProperties, className?: string }> = ({ value, style, className }) => {

    const allIterators = useMemo(
        () => [...createIterator(false, false)(value).take(6)],
        [value]
    )

    const renderName = !(value instanceof Array || value instanceof Set)

    const renderType = value
        && value.constructor != Object
        && value.constructor != Array
        ? value.constructor?.name : ""

    return <span className={joinClasses(className,)}>
        {renderType}
        {value instanceof Array ? "[" : "{"}
        {allIterators
            .slice(0, 5)
            .map(({ name, data, isNonenumerable }, index) => <Fragment key={name}>
                {index > 0 ? ", " : ""}
                {renderName && <><NameRender name={name} />: </>}
                <ValueInline value={data} isPreview />
            </Fragment>)}
        {allIterators.length > 5 ? ",…" : ""}
        {value instanceof Array ? "]" : "}"}
    </span>
}

const AllChilds: React.FC<ObjectRenderProps> = ({ name, value, path = "", level = 0, context }) => {


    const [enumrables, noneEnumerables] = useMemo(
        () => {
            const all = value instanceof GroupedProxy
                ? []
                : [...createIterator(true, false)(value)]
            return [
                all.filter(e => !e.isNonenumerable),
                all.filter(e => e.isNonenumerable),
            ]
        },
        [value]
    )

    const renderObject = useMemo(
        () => value instanceof GroupedProxy ? value
            : getObjectGroupProxyEntries(enumrables, 100),
        [enumrables, value]
    )

    const entries = useMemo(
        () => [
            ...Object.entries(renderObject)
                .map(([name, data]) => ({ name, data, isNonenumerable: false })),
            ...context.nonEnumerable ? noneEnumerables : []
        ], [renderObject, noneEnumerables, context.nonEnumerable]
    )

    return <>
        {entries
            .map(({ name, data, isNonenumerable }) => <ObjectRender
                key={path + "." + String(name)}
                {...{
                    name,
                    value: data,
                    isNonenumerable,
                    path: path + "." + String(name),
                    level: level + 1,
                    context
                }}
            />)}
        { }
    </>
}

const NameRender: React.FC<{ name: string }> = ({ name }) => {
    return <span className="name">{String(name)}</span>
}

const ObjectRender: React.FC<ObjectRenderProps> = ({ name, value, path = "", level = 0, context, isNonenumerable, renderName = true, }) => {
    const { expandChild, setExpandChild, hasChilds, isInGroupping } = useValueInfo(value, path, level, [], isNonenumerable, context)
    const isPreview = expandChild || !context.preview
    return <>
        <div onClick={() => setExpandChild?.(!expandChild)}
            className={joinClasses("node-default", isNonenumerable && "non-enumrable")}
            style={{ whiteSpace: expandChild ? "preserve nowrap" : "nowrap", }}
        >
            <span className="expand-symbol">{hasChilds ? (expandChild ? "▼ " : "▶ ") : "  "}</span>
            {renderName && <><NameRender {...{ name }} />: </>}
            {!isInGroupping && <ValueInline {...{
                value,
                isPreview,
                className: hasChilds ? "value-preview" : "",
            }} />}
        </div>
        {expandChild ? <div className="node-child">
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


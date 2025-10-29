import React, { CSSProperties, useDeferredValue, useEffect, useEffectEvent, useMemo, useRef } from "react";
import "./style.css";

import { Constructor, JSONViewCtx } from "./types";
import { ObjectRenderWrapper } from "./ObjectRender";
import { PromiseWrapper } from "./ResolvePromiseWrapper";


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


const resolver: JSONViewCtx['resolver'] = new Map([
    [Promise, function* (promise: Promise<any>, entriesIterator, isPreview) {

        let pendingSym = Symbol("Pending");

        let result: Promise<{ status: any, result?: any, reason?: any }> = Promise
            .race([promise, pendingSym])
            .then(e => e == pendingSym ? { status: "pending" } : { status: "resolved", result: e })
            .catch(e => ({ status: "rejected", reason: e }))

        for (let entry of entriesIterator) {
            yield entry
        }

        yield {
            name: isPreview ? "status" : "[[PromiseState]]",
            data: new PromiseWrapper(result.then(e => e.status)),
            isNonenumerable: !isPreview,
        }
        yield {
            name: isPreview ? "result" : "[[PromiseResult]]",
            data: new PromiseWrapper(
                result.then(e => e.status == "resolved" ? e.result
                    : e.status == "rejected" ? e.reason
                        : undefined)
            ),
            isNonenumerable: !isPreview,
        }
    }]
])

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
        resolver
    } as JSONViewCtx), [expandLevel, expandRootRef, resolver])

    return <div className="objview-root" style={style}>
        <ObjectRenderWrapper {...{ name, value, context, level: 0, path: "", isNonenumerable: false }} />
    </div>
};


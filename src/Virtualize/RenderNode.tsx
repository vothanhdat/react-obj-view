import { useMemo } from "react";
import { joinClasses } from "../ObjectViewV2/utils/joinClasses";
import { Entry, ResolverFn } from "../V3/types";
import { getEntriesCb } from "../V3/getEntries";

import { objectHasChild, WalkingResult } from "../V5/walkingToIndexFactory";
import { withPromiseWrapper } from "./PromiseWrapper";
import { CustomEntry, CustomIterator } from "../V3/resolver";

export type NodeData = (WalkingResult & { depth: number, path: string })


const NodeRenderDefault: React.FC<{
    node: NodeData;
    enablePreview: boolean;
    value: unknown,
    resolver?: Map<any, ResolverFn>
    toggleChildExpand: (node: NodeData) => void
}> = ({ node, value, toggleChildExpand, resolver, enablePreview = true }) => {

    const isExpanded = node.expanded

    const isCircular = node.isCircular;

    const hasChild = objectHasChild(value);

    const isPreview = enablePreview && hasChild && !isExpanded && typeof value != "function"

    return <div className="node-container" style={{ paddingLeft: `${(node.depth - 1) * 1.5}em` }}>
        <div
            className="node-default"
            data-child={hasChild}
            data-nonenumrable={!node.enumerable}
            onClick={() => hasChild && toggleChildExpand(node)}
        >
            <span className="expand-symbol">
                {hasChild && !isCircular ? (isExpanded ? "▼ " : "▶ ") : <>&#160;&#160;</>}
            </span>

            <RenderName {...{
                depth: node.depth,
                name: String(node.name ?? "ROOT"),
            }} />

            <span className="symbol">: </span>

            {isCircular ? <span className="tag-circular">CIRCULAR</span> : <></>}

            <RenderValue {...{
                value: value,
                isPreview,
                enumrable: node.enumerable,
                resolver,
            }} />

        </div>
    </div>;
}

const RenderNodeInternal = withPromiseWrapper(NodeRenderDefault)

export const RenderNode: React.FC<{
    node: NodeData;
    enablePreview: boolean;
    resolver?: Map<any, ResolverFn>
    toggleChildExpand: (node: NodeData) => void
}> = (props) => {
    return <RenderNodeInternal {...props} value={props.node.value} />
}


export const RenderName: React.FC<{ depth?: number, name: string }> = ({ depth = undefined, name }) => {
    return <span className="name">
        {depth == 0 ? "ROOT" : String(name)}
    </span>
}



export const RenderValue: React.FC<{ value: any, isPreview: boolean, resolver?: Map<any, ResolverFn>, depth?: number, }> = withPromiseWrapper(
    ({ value, isPreview, resolver, depth = 0 }) => {
        return <span className={joinClasses(
            "value",
            `type-${typeof value}`,
            isPreview && 'value-preview',
            value == null && 'type-null',
            value?.constructor?.name ? `type-object-${value?.constructor?.name}`?.toLowerCase() : ``
        )}>
            {
                isPreview
                    ? <RenderPreview value={value} resolver={resolver} depth={depth} />
                    : <RenderRawValue value={value} depth={depth} />
            }
        </span>
    }

)


export const RenderRawValue: React.FC<{ value: any, depth: any }> = ({ value, depth }) => {

    switch (typeof value) {
        case "boolean":
        case "number":
        case "symbol":
        case "undefined":
            return String(value);
        case "bigint":
            return String(value) + "n"
        case "function": {
            if (depth > 0)
                return "ƒ"
            let render = String(value)
                .replace(/^function/, 'ƒ')
                .replace(/^async function/, 'async ƒ')
                .replace('{ [native code] }', '')
            return render?.split(" => ")?.at(0) + ' => {…}'
        }
        case "string": {
            let preview = JSON.stringify(value)
            let max = depth == 0 ? 100 : 20;
            let addChar = preview.length > max ? '…' : ''
            return depth > 0
                ? "'" + preview.slice(1, -1).slice(0, max) + addChar + "'"
                : preview.slice(0, max) + addChar
        }
        case "object": {
            if (!value)
                return String(value)

            if (value instanceof RegExp) return String(value)
            if (value instanceof Date) return String(value)
            if (value instanceof Array) return `Array(${value.length})`
            if (value instanceof Map) return `Map(${value.size})`
            if (value instanceof Set) return `Set(${value.size})`;
            if (value instanceof CustomEntry) return <>
                <RenderValue {...{ value: value.key, isPreview: false, depth: depth + 1 }} />
                {" => "}
                <RenderValue {...{ value: value.value, isPreview: false, depth: depth + 1 }} />
            </>

            const renderType = value
                && value.constructor != Object
                && value.constructor != Array
                ? value.constructor?.name : "{…}";
            return renderType
        }
    }
    return ""
}

export const RenderPreview: React.FC<{
    value: any,
    resolver?: Map<any, ResolverFn>,
    depth?: number,
}> = ({ value, resolver, depth = 0 }) => {

    let iterator = useMemo(
        () => {
            let list: Entry[] = []
            getEntriesCb(
                value,
                { expandDepth: 0, nonEnumerable: false, resolver, symbol: false },
                true,
                (key, value, enumerable) => {
                    list.push({ key, value, enumerable });
                    return list.length > 5
                }
            )

            return list
        },
        [resolver, value]
    )

    let isArray = Array.isArray(value)

    let hideKey = isArray
        || value instanceof Set
        || value instanceof Map
        || value instanceof CustomIterator
        || value instanceof CustomEntry
        || value instanceof Promise

    const renderType = value
        && value.constructor != Object
        && value.constructor != Array
        ? value.constructor?.name : "";

    const customSeperator = value instanceof CustomEntry ? " => "
        : value instanceof Promise ? ":"
            : ", "

    const wrappSymbol = value instanceof CustomEntry ? "  "
        : isArray ? "[]"
            : "{}"


    return <>
        {renderType} {wrappSymbol.at(0)}
        {iterator
            .filter(e => e.enumerable)
            .map(({ key, value }, index) => <>
                {index > 0 ? customSeperator : ""}
                {!hideKey && <><RenderName name={String(key)} />: </>}
                <RenderValue {...{ value, resolver, isPreview: false, depth: depth + 1 }} />
            </>)}

        {iterator.length >= 5 ? ",…" : ""}

        {wrappSymbol.at(1)}

    </>
}
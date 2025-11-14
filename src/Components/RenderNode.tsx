import { useCallback, useMemo } from "react";
import type { ResolverFn } from "../V5/types";
import { type NodeResultData } from "@react-obj-view/tree-core";
import {
    GroupedProxy,
    LazyValueError,
    objectHasChild,
} from "../objectWalker";
import type { ObjectNodeMeta } from "../objectWalker";
import { RenderName } from "./RenderName";
import { RenderValue } from "./RenderValue";
import { useChangeFlashClasses } from "../utils/useChangeFlashClasses";
import { useInternalPromiseResolve } from "../hooks/useInternalPromiseResolve";


export type RenderOptions = {
    enablePreview: boolean;
    highlightUpdate: boolean;
    resolver: Map<any, ResolverFn>
    toggleChildExpand: (node: NodeResultData) => void
    refreshPath: (node?: NodeResultData) => void
    showLineNumbers: boolean
    includeSymbols: boolean
}

export const RenderNode: React.FC<{
    nodeDataWrapper: () => NodeResultData;
    valueWrapper: () => unknown,
    options: RenderOptions
}> = ({ nodeDataWrapper, valueWrapper, options }) => {

    const nodeData = nodeDataWrapper()

    const value = useInternalPromiseResolve(valueWrapper())

    const { enablePreview, toggleChildExpand } = options

    const nodeMeta = (nodeData.meta ?? {}) as ObjectNodeMeta;

    const isExpanded = nodeData.expanded

    const isCircular = Boolean(nodeMeta.isCircular);

    const hasChild = objectHasChild(value)
        && !(value instanceof LazyValueError);

    const isPreview = enablePreview
        && (hasChild || value instanceof LazyValueError)
        && !isExpanded
        && typeof value != "function"
        && !(value instanceof Error)
        && !(value instanceof GroupedProxy)

    const refreshPath = useCallback(
        () => {
            // console.log("nodeData.path", nodeData.path)
            options.refreshPath(nodeData)
        },
        [options.refreshPath, nodeData]
    )

    const overrideOptions = useMemo(
        () => ({
            ...options,
            refreshPath: refreshPath,
        }), [options, refreshPath]
    )

    const ref = useChangeFlashClasses({
        value,
        flashClassname: 'updated',
        enable: options.highlightUpdate,
    }) as any


    return <>
        <span
            className="node-default"
            data-child={hasChild}
            data-nonenumrable={nodeMeta.enumerable === false}
            onClick={() => hasChild && toggleChildExpand(nodeData)}
        >
            <span style={{ whiteSpace: 'preserve', opacity: 0.05 }}>
                {"| ".repeat(nodeData.depth - 1)}
            </span>
            <span className="expand-symbol" style={{ whiteSpace: 'preserve' }}>
                {hasChild && !isCircular ? (isExpanded ? "▼ " : "▶ ") : <>  </>}
            </span>

            <RenderName ref={ref} {...{
                depth: nodeData.depth,
                name: String(nodeData.name ?? "ROOT"),
            }} />

            <span className="symbol">: </span>

            {isCircular ? <span className="tag-circular">CIRCULAR</span> : <></>}

            <RenderValue {...{
                valueWrapper,
                enumrable: nodeMeta.enumerable !== false,
                options: overrideOptions,
                isPreview,
            }} />

        </span>
    </>;
}

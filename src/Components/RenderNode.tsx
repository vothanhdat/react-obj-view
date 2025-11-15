import { useCallback, useMemo } from "react";
import { ResolverFn } from "../object-tree/types";

import { NodeResultData } from "../object-view/walkingToIndexFactory";
import { objectHasChild } from "../object-tree/objectHasChild";
import { RenderName } from "./RenderName";
import { RenderValue } from "./RenderValue";
import { GroupedProxy } from "../object-tree/custom-class/groupedProxy";
import { useChangeFlashClasses } from "../utils/useChangeFlashClasses";
import { useInternalPromiseResolve } from "../hooks/useInternalPromiseResolve";
import { LazyValueError } from "../object-tree/custom-class/LazyValueWrapper";


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

    const isExpanded = nodeData.expanded

    const isCircular = nodeData.isCircular;

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
            data-nonenumrable={!nodeData.enumerable}
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
                name: String(nodeData.key ?? "ROOT"),
            }} />

            <span className="symbol">: </span>

            {isCircular ? <span className="tag-circular">CIRCULAR</span> : <></>}

            <RenderValue {...{
                valueWrapper,
                enumrable: nodeData.enumerable,
                options: overrideOptions,
                isPreview,
            }} />

        </span>
    </>;
}

import { useCallback, useMemo } from "react";
import { RenderName } from "./RenderName";
import { RenderValue } from "./RenderValue";
import { useChangeFlashClasses } from "../hooks/useChangeFlashClasses";
import { useInternalPromiseResolve } from "../hooks/useInternalPromiseResolve";
import {
    type ReactTreeRowRenderProps,
    type FlattenNodeData
} from "../../libs/react-tree-view";
import {
    type ResolverFn,
    type ObjectWalkingAdater,
    type ObjectWalkingMetaParser,

    objectHasChild,
    GroupedProxy,
    LazyValueError
} from "../../object-tree";


export type RenderOptions = {
    enablePreview: boolean;
    highlightUpdate: boolean;
    resolver: Map<any, ResolverFn>
    toggleChildExpand: (node: FlattenNodeData<ObjectWalkingAdater, ObjectWalkingMetaParser>) => void
    refreshPath: (node?: FlattenNodeData<ObjectWalkingAdater, ObjectWalkingMetaParser>) => void
    showLineNumbers: boolean
    includeSymbols: boolean
    onMouseEnter: (index: number) => void
    onMouseLeave: (index: number) => void
}


export const RenderNode: React.FC<ReactTreeRowRenderProps<
    ObjectWalkingAdater,
    ObjectWalkingMetaParser,
    RenderOptions
>> = ({ nodeDataWrapper, valueWrapper, options, renderIndex }) => {

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
        () => options.refreshPath(nodeData),
        [options.refreshPath, nodeData]
    )

    const onMouseEnter = useCallback(
        () => options.onMouseEnter(renderIndex),
        [options.refreshPath, renderIndex]
    )

    const onMouseLeave = useCallback(
        () => options.onMouseLeave(renderIndex),
        [options.refreshPath, renderIndex]
    )

    const overrideOptions = useMemo(
        () => ({
            ...options,
            refreshPath,
        }), [options, refreshPath]
    )

    const ref = useChangeFlashClasses({
        value,
        flashClassname: 'updated',
        enable: options.highlightUpdate,
    }) as any


    return <>
        <div
            className="node-default"
            data-child={hasChild}
            data-nonenumrable={!nodeData.enumerable}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <span
                className="tree-indents">
                {nodeData.parents.slice(0, -1)
                    .map(index => <span style={{ ['--indent-index' as any]: String(index) }}>
                        {"│ "}
                    </span>)
                }
            </span>
            <span
                onClick={() => hasChild && toggleChildExpand(nodeData)}
                className="expand-symbol"
                style={{ whiteSpace: 'preserve' }}>
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

        </div>
    </>;
}

import { useCallback, useMemo } from "react";
import { RenderName } from "./RenderName";
import { RenderValue } from "./RenderValue";
import { useChangeFlashClasses } from "../hooks/useChangeFlashClasses";
import { useInternalPromiseResolve } from "../hooks/useInternalPromiseResolve";
import { objectHasChild, GroupedProxy, LazyValueError } from "../../object-tree";
import { DefaultActions } from "../value-renders/Actions";
import { ObjectViewRenderRowProps } from "../types";
import { valueHasChild } from "../../object-tree/objectWalkingAdaper";


export const RenderNode: React.FC<ObjectViewRenderRowProps> = (props) => {

    const { nodeDataWrapper, valueWrapper, options, renderIndex, actions, } = props

    const { enablePreview, actionRenders } = options

    const nodeData = nodeDataWrapper()

    const value = useInternalPromiseResolve(valueWrapper())


    const isExpanded = nodeData.expanded

    const isCircular = nodeData.isCircular;

    const ActionRenders = actionRenders ?? DefaultActions

    const hasChild = valueHasChild(value, nodeData.key!, nodeData.meta!)

    const isPreview = enablePreview
        && (hasChild || value instanceof LazyValueError)
        && !isExpanded
        && typeof value != "function"
        && !(value instanceof Error)
        && !(value instanceof GroupedProxy)


    const onMouseEnter = useCallback(
        () => options.onMouseEnter(renderIndex),
        [options.onMouseEnter, renderIndex]
    )

    const onMouseLeave = useCallback(
        () => options.onMouseLeave(renderIndex),
        [options.onMouseLeave, renderIndex]
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
                onClick={actions.toggleChildExpand}
                className="expand-symbol"
                style={{ whiteSpace: 'preserve' }}>
                {hasChild && !isCircular ? (isExpanded ? "▼ " : "▶ ") : <>  </>}
            </span>

            <RenderName ref={ref} {...{
                depth: nodeData.depth,
                name: String(nodeData.key ?? "ROOT"),
            }} />

            <span className="symbol">: </span>

            <span className="tags">
                {isCircular ? <span className="tag circular">CIRCULAR</span> : <></>}
            </span>

            <RenderValue {...{
                valueWrapper,
                enumrable: nodeData.enumerable,
                options,
                isPreview,
                refreshPath: actions.refreshPath,
            }} />
            <span className="actions">
                <ActionRenders {...props} />
            </span>
        </div>
    </>;
}

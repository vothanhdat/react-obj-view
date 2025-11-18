import { useCallback, useMemo } from "react";
import { RenderName } from "./RenderName";
import { RenderValue } from "./RenderValue";
import { useChangeFlashClasses } from "../hooks/useChangeFlashClasses";
import { useInternalPromiseResolve } from "../hooks/useInternalPromiseResolve";
import { objectHasChild, GroupedProxy, LazyValueError } from "../../object-tree";
import { Actions } from "../value-renders/Actions";
import { ObjectViewRenderRowProps } from "../types";


export const RenderNode: React.FC<ObjectViewRenderRowProps> = (props) => {

    const { nodeDataWrapper, valueWrapper, options, renderIndex, actions } = props

    const { enablePreview } = options

    const nodeData = nodeDataWrapper()

    const value = useInternalPromiseResolve(valueWrapper())


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

            {isCircular ? <span className="tag-circular">CIRCULAR</span> : <></>}

            <RenderValue {...{
                valueWrapper,
                enumrable: nodeData.enumerable,
                options,
                isPreview,
                refreshPath: actions.refreshPath,
            }} />

            <Actions {...props} />
        </div>
    </>;
}

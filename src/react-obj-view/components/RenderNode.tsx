import { useCallback, useMemo, useRef, useState } from "react";
import { RenderName } from "./RenderName";
import { RenderValue } from "./RenderValue";
import { useChangeFlashClasses } from "../hooks/useChangeFlashClasses";
import { useInternalPromise } from "../hooks/useInternalPromiseResolve";
import { objectHasChild, GroupedProxy, LazyValueError, LazyValue } from "../../object-tree";
import { ObjectViewRenderRowProps } from "../types";
import { ActionRenders as DefaultActionsRender } from "../actions/Actions";


export const RenderNode: React.FC<ObjectViewRenderRowProps> = (props) => {

    const { nodeDataWrapper, valueWrapper, options: _options, renderIndex, actions, } = props

    const { enablePreview, actionRenders, nonEnumerable, includeSymbols, search } = _options

    const nodeData = nodeDataWrapper()

    const value = useInternalPromise(valueWrapper())

    const isExpanded = nodeData.expanded

    const isCircular = nodeData.isCircular;

    const ActionRenders = actionRenders ?? DefaultActionsRender

    // Using 'as any' because objectHasChild expects ObjectWalkingContext with circularChecking,
    // but we only need it for the hasChild check which doesn't require that property
    const hasChild = objectHasChild(
        value, nodeData.meta!,
        { config: { nonEnumerable, resolver: includeSymbols } } as any
    ) && !(value instanceof LazyValue) && !(value instanceof LazyValueError)

    const isPreview = enablePreview
        && (hasChild || value instanceof LazyValueError)
        && !isExpanded
        && typeof value != "function"
        && !(value instanceof Error)
        && !(value instanceof GroupedProxy)

    const isSearchMatch = useMemo(
        () => !!search?.filterFn
            && (search?.filterFn(nodeData.value, nodeData.key, nodeData.paths) ?? false),
        [search?.filterFn, search?.filterFn, nodeData.value]
    )


    const options = useMemo(
        () => ({ ..._options, enableMark: isSearchMatch }),
        [_options, isSearchMatch]
    )

    const [actionActive, setActionActive] = useState(false)
    const actionActiveRef = useRef({ timeout: undefined as any, active: actionActive })
    actionActiveRef.current.active = actionActive;
    
    const onMouseEnter = useCallback(
        () => {
            options.onMouseEnter(renderIndex)
            clearTimeout(actionActiveRef.current.timeout);
            actionActiveRef.current.timeout = setTimeout(
                () => {
                    setActionActive(true)

                },
                50
            )
        },
        [options.onMouseEnter, renderIndex]
    )

    const onMouseLeave = useCallback(
        () => {
            options.onMouseLeave(renderIndex)
            clearTimeout(actionActiveRef.current.timeout);
            actionActiveRef.current.timeout = setTimeout(
                () => actionActiveRef.current.active && setActionActive(false),
                50
            )
        },
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
                    .map(index => <span key={index} style={{ ['--indent-index' as any]: String(index) }}>
                        {"  "}
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
                highlight: isSearchMatch,
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
                {actionActive && <ActionRenders {...props} />}
            </span>
        </div>
    </>

}

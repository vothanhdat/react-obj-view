import React, { useCallback, useMemo, useState } from "react";
import { CustomAction, ObjectViewRenderRowProps } from "../types";

const allowJSONPrototype = new Set<any>([
    Object.getPrototypeOf({}),
    Object.getPrototypeOf([]),
    Object.getPrototypeOf(new Date),
    {}.constructor,
    [].constructor,
    (new Date).constructor,
])


type ActionState = [
    copying: boolean,
    success: boolean,
    error: any
];

const RenderAction: React.FC<ObjectViewRenderRowProps & CustomAction<any>> = ({
    nodeDataWrapper,
    prepareAction,
    dependency = (e) => [e],
    performAction,
    actionRender: ActionRender,
    actionRunRender: ActionRunRender,
    actionErrorRender: ActionErrorRender = "❗ ERROR",
    actionSuccessRender: ActionSuccessRender = "✓ SUCCESS",
    resetTimeout = 5000
}) => {
    const nodeData = nodeDataWrapper?.()

    const preparedAction = useMemo(
        () => prepareAction(nodeData),
        [...dependency(nodeData)]
    )

    const [
        [performing, performSuccess, performError],
        setPerformState
    ] = useState<ActionState>([false, false, undefined]);

    const handleAction = useCallback(
        () => {
            preparedAction && setPerformState(s => {
                if (s.some(Boolean))
                    return s

                Promise.resolve()
                    .then(() => performAction(preparedAction, nodeData))
                    .then(
                        () => setPerformState([false, true, undefined]),
                        (error) => setPerformState([false, false, error])
                    )
                    .then(() => setTimeout(
                        () => setPerformState([false, false, undefined]),
                        resetTimeout
                    ));

                return ([true, false, undefined]);
            });
        },
        [performAction, preparedAction, nodeData]
    )

    const canPerformAction = !!preparedAction &&
        !performing && !performSuccess && !performError

    return !!prepareAction ? <>
        {canPerformAction && <button onClick={handleAction}>
            {typeof ActionRender === 'function'
                ? <ActionRender {...preparedAction} />
                : ActionRender
            }
        </button>}
        {performing && <button className="loading">
            {typeof ActionRunRender === 'function'
                ? <ActionRunRender {...preparedAction} />
                : ActionRunRender
            }
        </button>}
        {performSuccess && <button className="success">
            {typeof ActionSuccessRender === 'function'
                ? <ActionSuccessRender {...preparedAction} />
                : ActionSuccessRender
            }
        </button>}
        {performError && <button className="error">
            {typeof ActionErrorRender === 'function'
                ? <ActionErrorRender {...preparedAction} />
                : ActionErrorRender
            }
        </button>}

    </> : <></>


}

export const DEFAULT_ACTION: CustomAction[] = [
    {
        name: "copy",
        dependency: (data) => [typeof data.value],
        prepareAction(data) {
            if (data.key == "[[Prototype]]")
                return;

            let valueType = typeof data.value;
            let copyText = valueType == 'string' || valueType == 'number' || valueType == 'bigint'
            let copyJSON = !copyText
                && data.value !== null
                && valueType == 'object'
                && allowJSONPrototype.has(Object.getPrototypeOf(data.value))
                && allowJSONPrototype.has(data.value?.constructor)

            return copyText || copyJSON ? { copyText, copyJSON } : undefined
        },
        performAction({ copyText, copyJSON }, nodeData) {
            if (copyText) {
                return navigator.clipboard.writeText(String(nodeData.value))
            } else if (copyJSON) {
                return new Promise(r => (window?.requestIdleCallback ?? window?.requestAnimationFrame)(r))
                    .then(() => JSON.stringify(nodeData.value))
                    .then(text => navigator.clipboard.writeText(text))
            }
        },
        actionRender: ({ copyJSON, copyText }) => <>
            {copyText ? "Copy Text" : ""}
            {copyJSON ? "Copy JSON" : ""}
        </>,
        actionRunRender: "Copying ...",
    } as CustomAction<{ copyText?: boolean, copyJSON?: boolean }>,
]

export const DefaultActions: React.FC<ObjectViewRenderRowProps> = (props) => {
    const { options: { customActions = DEFAULT_ACTION } } = props

    return <>
        {customActions?.map((action, k) => <RenderAction
            {...props}
            {...action}
            key={k}
        />)}
    </>
}



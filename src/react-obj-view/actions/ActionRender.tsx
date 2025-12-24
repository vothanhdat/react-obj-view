import React, { useMemo, useState, useCallback } from "react";
import { ObjectViewRenderRowProps } from "../types";
import { CustomAction } from "./types";

type ActionState = [
    copying: boolean,
    success: boolean,
    error: any
];
export const ActionRender: React.FC<ObjectViewRenderRowProps & CustomAction<any>> = ({
    nodeDataWrapper, prepareAction, dependency = (e) => [e], performAction, actionRender: ActionRender, actionRunRender: ActionRunRender, actionErrorRender: ActionErrorRender = "❗ ERROR", actionSuccessRender: ActionSuccessRender = "✓ SUCCESS", resetTimeout = 5000
}) => {
    const nodeData = nodeDataWrapper?.();

    const preparedAction = useMemo(
        () => prepareAction(nodeData),
        [...dependency(nodeData)]
    );

    const [
        [performing, performSuccess, performError], setPerformState
    ] = useState<ActionState>([false, false, undefined]);

    const handleAction = useCallback(
        () => {
            preparedAction && setPerformState(s => {
                if (s.some(Boolean))
                    return s;

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
    );

    const canPerformAction = !!preparedAction &&
        !performing && !performSuccess && !performError;

    return !!prepareAction ? <>
        {canPerformAction && <button onClick={handleAction}>
            {typeof ActionRender === 'function'
                ? <ActionRender {...preparedAction} />
                : ActionRender}
        </button>}
        {performing && <button className="loading">
            {typeof ActionRunRender === 'function'
                ? <ActionRunRender {...preparedAction} />
                : ActionRunRender}
        </button>}
        {performSuccess && <button className="success">
            {typeof ActionSuccessRender === 'function'
                ? <ActionSuccessRender {...preparedAction} />
                : ActionSuccessRender}
        </button>}
        {performError && <button className="error">
            {typeof ActionErrorRender === 'function'
                ? <ActionErrorRender {...preparedAction} />
                : ActionErrorRender}
        </button>}

    </> : <></>;


};

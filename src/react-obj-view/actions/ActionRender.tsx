import React, { useMemo, useState, useCallback } from "react";
import { ObjectViewRenderRowProps } from "../types";
import { ActionWrapperProps, CustomAction } from "./types";
import { joinClasses } from "../../utils/joinClasses";

type ActionState = [
    copying: boolean,
    success: boolean,
    error: any
];


const BuntonWrapper: React.FC<ActionWrapperProps<any>> = ({
    isError, isLoading, isSuccess,
    handleAction, children
}) => {

    const className = joinClasses(
        isLoading && "loading",
        isSuccess && "success",
        isError && "error",
    )
    return <button type="button" onClick={handleAction} className={className}>
        {children}
    </button>
}


const normalize = (e: string | React.FC<any>): React.FC<{}> => typeof e === 'function' ? e : (f: any) => e

export const ActionRender: React.FC<ObjectViewRenderRowProps & CustomAction<any>> = ({
    nodeDataWrapper,
    prepareAction,
    dependency = (e) => [e],
    performAction,
    actionRender: ActionRender,
    actionRunRender: ActionRunRender,
    actionErrorRender: ActionErrorRender = "❗ ERROR",
    actionSuccessRender: ActionSuccessRender = "✓ SUCCESS",
    resetTimeout = 5000,
    buttonWrapper,
}) => {
    const nodeData = nodeDataWrapper?.();

    const preparedAction = useMemo(
        () => prepareAction(nodeData),
        [...dependency(nodeData)]
    );

    const [
        [isLoading, isSuccess, isError],
        setPerformState
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
                    .finally(() => setTimeout(
                        () => setPerformState([false, false, undefined]),
                        resetTimeout
                    ));

                return ([true, false, undefined]);
            });
        },
        [performAction, preparedAction, nodeData]
    );

    const canPerformAction = !!preparedAction &&
        !isLoading && !isSuccess && !isError;

    const RenderComponent = canPerformAction ? normalize(ActionRender)
        : isLoading ? normalize(ActionRunRender)
            : isSuccess ? normalize(ActionSuccessRender)
                : isError ? normalize(ActionErrorRender)
                    : normalize("")

    const ButtonWrapper = buttonWrapper ?? BuntonWrapper;

    return !!preparedAction ? <>
        <ButtonWrapper {...{
            isError, isLoading, isSuccess,
            handleAction: canPerformAction ? handleAction : undefined,
            state: preparedAction,
        }}>
            <RenderComponent {...preparedAction} />
        </ButtonWrapper>
    </> : <></>


};

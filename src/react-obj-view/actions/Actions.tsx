import React from "react";
import { ObjectViewRenderRowProps } from "../types";
import { DEFAULT_ACTION } from "./defaultAction";
import { ActionRender } from "./ActionRender";

export const ActionRenders: React.FC<ObjectViewRenderRowProps> = (props) => {
    const { options: { customActions = DEFAULT_ACTION } } = props

    return <>
        {customActions?.map((action, k) => <ActionRender
            {...props}
            {...action}
            key={k}
        />)}
    </>
}



import React from "react";
import { ChangeFlashWrappper } from "../utils/ChangeFlashWrappper";
import { JSONViewProps } from "./JSONViewProps";

export const SIMPLE_INSTANCE_RENDER = new Set([
    Date,
    RegExp,
    Number,
    String,
]);


export const PrimitiveView: React.FC<JSONViewProps> = (props) => {

    const { currentType, name, value, displayName, seperator = ":", } = props;

    return <ChangeFlashWrappper
        value={props.value}
        className={`jv-field jv-field-${currentType}`}>
        {displayName && <span className="jv-name">{name}</span>}
        {displayName && <span>{seperator}</span>}
        <span className="jv-type">{currentType}</span>
        <span className="jv-value">{String(value)}</span>
        <span>,</span>
    </ChangeFlashWrappper>;
};


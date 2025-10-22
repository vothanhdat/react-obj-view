import React from "react";
import { ChangeFlashWrappper } from "../../utils/ChangeFlashWrappper";
import { JSONViewProps } from "../JSONViewProps";

export const KeywordValueView: React.FC<JSONViewProps> = (props) => {

    const { currentType, name, value, displayName, seperator = ":", } = props;

    return <ChangeFlashWrappper
        value={props.value}
        enable={props.context.highlightUpdate}
        className={`jv-field jv-field-${currentType}`}>
        {displayName && <span className="jv-name">{name}</span>}
        {displayName && <span>{seperator}</span>}
        <span className="jv-value jv-keyword">{String(value)}</span>
        <span>,</span>
    </ChangeFlashWrappper>;
};


import React from "react";
import { ChangeFlashWrappper } from "../../utils/ChangeFlashWrappper";
import { useExpandState } from "../hooks/useExpandState";
import { JSONViewProps } from "../JSONViewProps";

export const StringViewObj: React.FC<JSONViewProps> = (props) => {
    const { currentType, name, value, displayName, seperator = ":", } = props;
    const { isExpand, setExpand } = useExpandState(props);
    const useExpand = String(value).length > 50;
    const renderString = useExpand && !isExpand
        ? `${String(value).slice(0, 15)}...${String(value).slice(-15, -1)}`
        : String(value);

    return <ChangeFlashWrappper
        value={props.value}
        enable={props.context.highlightUpdate}
        className={`jv-field jv-field-${currentType} ${useExpand ? 'jv-cursor' : ''}`}
        onClick={() => setExpand(!isExpand)}>
        {displayName && <span className="jv-name">{name}</span>}
        {displayName && <span>{seperator}</span>}
        <span className="jv-type">{currentType}{useExpand && <> lng={value?.length}</>}</span>
        <span className="jv-value">"{renderString}"</span>
        <span>,</span>
    </ChangeFlashWrappper>;
};

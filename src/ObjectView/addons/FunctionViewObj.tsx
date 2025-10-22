import React from "react";
import { JSONViewProps } from "../JSONViewProps";
import { useExpandState } from "../hooks/useExpandState";
import { ChangeFlashWrappper } from "../../utils/ChangeFlashWrappper";


export const FunctionViewObj: React.FC<JSONViewProps> = (props) => {
    const { currentType, name, value, displayName, seperator = ":", } = props;
    const { isExpand, setExpand } = useExpandState(props);
    const fnString = String(value).trim();
    const useExpand = fnString.length > 50;
    const renderString = useExpand && !isExpand
        ? `${fnString.slice(0, 15)}...${fnString.slice(-15)}`
        : fnString;
    return <ChangeFlashWrappper
        value={props.value}
        className={`jv-field jv-field-${currentType} ${useExpand ? 'jv-cursor' : ''}`}
        onClick={() => setExpand(!isExpand)}>
        {displayName && <span className="jv-name">{name}</span>}
        {displayName && <span>{seperator}</span>}
        <span className="jv-type">{currentType}</span>
        <span className="jv-value">"{renderString}"</span>
        <span>,</span>
    </ChangeFlashWrappper>;
};

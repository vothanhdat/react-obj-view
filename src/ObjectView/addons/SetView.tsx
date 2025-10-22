import React, { useMemo } from "react";
import { JSONViewProps } from "../JSONViewProps";
import { ObjectDetailView } from "../ObjectDetailView";



export const SetView: React.FC<JSONViewProps> = (props) => {
    const value = useMemo(
        () => props.value instanceof Set
            ? [...props.value.values()]
            : [],
        [props.value]
    );

    return <ObjectDetailView
        {...props}
        {...{
            currentType: "Set",
            displayType: `Set(${(props.value as any as Set<any>)?.size})`,
            value,
            childDisplayName: false
        }} />;
};

import React, { useMemo } from "react";
import { ObjectDetailView } from "../ObjectDetailView";
import { JSONViewProps } from "../JSONViewProps";


export const MapView: React.FC<JSONViewProps> = (props) => {
    const value = useMemo(
        () => props.value instanceof Map
            ? Object.fromEntries([...props.value.entries()])
            : {},
        [props.value]
    );

    return <ObjectDetailView
        {...props}
        {...{
            currentType: "Map",
            displayType: `Map(${(props.value as any as Map<any, any>).size})`,
            value,
            childSeperator: " => "
        }} />;
};

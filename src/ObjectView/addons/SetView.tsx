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
        {...{ currentType: "Set", value, childDisplayName: false }} />;
};

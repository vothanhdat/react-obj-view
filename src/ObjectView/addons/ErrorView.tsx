import { useMemo } from "react";
import { JSONViewProps } from "../JSONViewProps";
import { ObjectDetailView } from "../ObjectDetailView";
import { useExpandState } from "../hooks/useExpandState";



export const ErrorView: React.FC<JSONViewProps> = (props) => {

    const { path = [], name } = props;
    const currentField = path.at(-1) ?? name ?? undefined;
    
    const value = useMemo(
        () => ({
            name: props.value?.name,
            message: props.value?.message,
            stack: props.value?.stack?.split("\n"),
            ...props.value,
            "[[Prototype]]": Object.getPrototypeOf(props.value),
        }), [props.value]
    )

    return <ObjectDetailView
        {...props}
        {...{
            value,
            currentField,
            currentType: props.value?.constructor.name
        }}
    />;
};

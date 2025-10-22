import { useMemo } from "react";
import { JSONViewProps } from "../JSONViewProps";
import { ObjectDetailView } from "../ObjectDetailView";



export const InstanceView: React.FC<JSONViewProps> = (props) => {

    const { path = [], name } = props;

    const currentField = path.at(-1) ?? name ?? undefined;

    const value = useMemo(
        () => ({
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

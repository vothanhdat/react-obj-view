import React from "react";
import { GroupedObject } from "../utils/GroupedObject";
import { FunctionViewObj } from "./addons/FunctionViewObj";
import { MapView } from "./addons/MapView";
import { PromiseView } from "./addons/PromiseView";
import { SetView } from "./addons/SetView";
import { StringViewObj } from "./addons/StringViewObj";
import { ObjectDetailView } from "./ObjectDetailView";
import { JSONViewProps } from "./JSONViewProps";
import { PrimitiveView, SIMPLE_INSTANCE_RENDER } from "./PrimitiveView";
import { InstanceView } from "./addons/InstanceView";


export const ObjectRouter: React.FC<Omit<JSONViewProps, 'currentField' | 'currentType'>> = (props) => {

    const { value, path = [], name, context: { customView } } = props;

    const currentField = path.at(-1) ?? name ?? undefined;

    const currentType = typeof value;


    if (!value) {
        return <PrimitiveView {...props} {...{ currentField, currentType }} />;
    }

    switch (currentType) {
        case "object": {

            const CustomRender = customView.get(value?.constructor)

            if (!!CustomRender) {
                return <CustomRender {...props} {...{ currentField }} />
            }

            if (SIMPLE_INSTANCE_RENDER.has(value?.constructor)) {
                return <PrimitiveView
                    {...props}
                    {...{ currentField, currentType: value.constructor.name }} />;
            }

            if (value instanceof GroupedObject) {
                return <ObjectDetailView {...props} {...{ currentField, currentType: undefined }} />;
            }

            if (value instanceof Error) {
                return <PrimitiveView {...props} {...{ currentField, currentType: value?.constructor.name }} />;
            }

            if (!(value instanceof Array) && value?.constructor != Object) {
                return <InstanceView {...props} />;
            }

            return <ObjectDetailView {...props} {...{ currentField, currentType: "" }} />;
        }
        case "string":
            return <StringViewObj {...props} {...{ currentField, currentType }} />;
        case "function":
            return <FunctionViewObj {...props} {...{ currentField, currentType }} />;
        case "number":
        case "boolean":
        case "bigint":
        case "symbol":
        case "undefined":
        default:
            return <PrimitiveView {...props} {...{ currentField, currentType }} />;
    }
};

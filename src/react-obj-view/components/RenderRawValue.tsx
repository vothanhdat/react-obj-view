import { CustomEntry } from "../../object-tree";
import { RenderOptions } from "./RenderNode";
import { RenderRawEntry } from "../value-renders/RenderRawEntry";
import { RenderString } from "../value-renders/RenderString";
import { RenderFunction } from "../value-renders/RenderFunction";


export const RenderRawValue: React.FC<{ valueWrapper: any; depth: any; options: RenderOptions }> = ({ valueWrapper, depth, options }) => {

    const value = valueWrapper()

    switch (typeof value) {
        case "boolean":
        case "number":
        case "symbol":
        case "undefined":
            return String(value);
        case "bigint":
            return String(value) + "n";
        case "function": {
            return <RenderFunction {...{ value, depth }} />
        }
        case "string": {
            return <RenderString {...{ value, depth }} />
        }
        case "object": {
            if (!value)
                return String(value);

            if (value instanceof RegExp) return String(value);
            if (value instanceof Date) return String(value);
            if (value instanceof Array) return `Array(${value.length})`;
            if (value instanceof Map) return `Map(${value.size})`;
            if (value instanceof Set) return `Set(${value.size})`;
            if (value instanceof Error) return `${String(value)}`;
            if (value instanceof CustomEntry) return <RenderRawEntry {...{ depth, valueWrapper, options }} />;

            const renderType = value
                && value.constructor != Object
                && value.constructor != Array
                ? value.constructor?.name : "{…}";
            return renderType;
        }
    }
    return "";
};



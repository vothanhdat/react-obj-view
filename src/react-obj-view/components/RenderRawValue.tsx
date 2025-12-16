import { CustomEntry } from "../../object-tree";
import { RenderOptions } from "../types";
import { RenderRawEntry } from "../value-renders/RenderRawEntry";
import { RenderString } from "../value-renders/RenderString";
import { RenderFunction } from "../value-renders/RenderFunction";
import { ItemViewBase } from "../../object-tree/resolver";
import { RenderBufferItem } from "../value-renders/BufferItemView";
import { RenderRegex } from "../value-renders/RenderRegex";
import { HighlightString } from "../hooks/useHighlight";


export const RenderRawValue: React.FC<{ valueWrapper: any; depth: any; options: RenderOptions }> = ({ valueWrapper, depth, options }) => {

    const value = valueWrapper()

    switch (typeof value) {
        case "boolean":
        case "number":
        case "symbol":
        case "undefined":
            return <HighlightString text={String(value)} enable={options.enableMark} />
        case "bigint":
            return <HighlightString text={String(value) + "n"} enable={options.enableMark} />
        case "function": {
            return <RenderFunction {...{ value, depth, highlight: options.enableMark }} />
        }
        case "string": {
            return <RenderString {...{ value, depth, highlight: options.enableMark }} />
        }
        case "object": {
            if (!value)
                return String(value);

            if (value instanceof Date) return <HighlightString text={String(value)} enable={options.enableMark} />;;
            if (value instanceof RegExp) return <RenderRegex {...{ value: value, depth, highlight: options.enableMark }} />
            if (value instanceof Array) return `Array(${value.length})`;
            if (value instanceof Map) return `Map(${value.size})`;
            if (value instanceof Set) return `Set(${value.size})`;
            if (value instanceof Error) return `${String(value)}`;
            if (value instanceof CustomEntry) return <RenderRawEntry {...{ depth, valueWrapper, options }} />;
            if (value instanceof ItemViewBase) return <RenderBufferItem {...{ depth, valueWrapper, options }} />;

            const renderType = value
                && value.constructor != Object
                && value.constructor != Array
                ? value.constructor?.name : "{…}";
            return renderType;
        }
    }
    return "";
};



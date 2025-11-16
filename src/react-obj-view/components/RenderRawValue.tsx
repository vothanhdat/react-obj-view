import { useWrapper } from "../hooks/useWrapper";
import { CustomEntry } from "../../object-tree/resolver/collections";
import { RenderOptions } from "./RenderNode";
import { RenderValue } from "./RenderValue";


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
            if (depth > 0)
                return "ƒ";
            let render = String(value)
                .replace(/^function/, 'ƒ')
                .replace(/^async function/, 'async ƒ')
                .replace('{ [native code] }', '');
            return render?.split(" => ")?.at(0) + ' => {…}';
        }
        case "string": {
            let preview = JSON.stringify(value);
            let max = depth == 0 ? 100 : 20;
            let addChar = preview.length > max ? '…' : '';
            return depth > 0
                ? "'" + preview.slice(1, -1).slice(0, max) + addChar + "'"
                : preview.slice(0, max) + addChar;
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

export const RenderRawEntry = ({ depth, valueWrapper, options }: { valueWrapper: any; depth: any; options: RenderOptions }) => {
    const value = valueWrapper()

    const wrapperKey = useWrapper(value.key)
    const wrapperValue = useWrapper(value.value)
    return <>
        <RenderValue {...{ valueWrapper: wrapperKey, isPreview: false, depth: depth + 1, options }} />
        <span className="symbol">{" => "}</span>
        <RenderValue {...{ valueWrapper: wrapperValue, isPreview: false, depth: depth + 1, options }} />
    </>
}

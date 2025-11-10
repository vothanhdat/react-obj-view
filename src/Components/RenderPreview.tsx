import { useMemo } from "react";
import { getEntriesCb } from "../V5/getEntries";
import { CustomIterator, CustomEntry } from "../V5/resolvers/collections";
import { ResolverFn, Entry } from "../V5/types";
import { RenderName } from "./RenderName";
import { RenderValue } from "./RenderValue";



export const RenderPreview: React.FC<{
    valueWrapper: any;
    resolver?: Map<any, ResolverFn>;
    depth?: number;
}> = ({ valueWrapper, resolver, depth = 0 }) => {

    const value = valueWrapper()

    let iterator = useMemo(
        () => {
            let list: Entry[] = [];
            getEntriesCb(
                value,
                { expandDepth: 0, nonEnumerable: false, resolver, symbol: false },
                true,
                (key, value, enumerable) => {
                    list.push({ key, value, enumerable });
                    return list.length > 5;
                }
            );

            return list;
        },
        [resolver, value]
    );

    let isArray = Array.isArray(value);

    let hideKey = isArray
        || value instanceof Set
        || value instanceof Map
        || value instanceof CustomIterator
        || value instanceof CustomEntry
        || value instanceof Promise;

    const renderType = value
        && value.constructor != Object
        && value.constructor != Array
        ? value.constructor?.name : "";

    const customSeperator = value instanceof CustomEntry ? " => "
        : value instanceof Promise ? ":"
            : ", ";

    const wrappSymbol = value instanceof CustomEntry ? "  "
        : isArray ? "[]"
            : "{}";

    return <>
        {renderType} {wrappSymbol.at(0)}
        {iterator
            .filter(e => e.enumerable)
            .map(({ key, value }, index) => <>
                {index > 0 ? customSeperator : ""}
                {!hideKey && <><RenderName name={String(key)} />: </>}
                <RenderValue {...{
                    valueWrapper: () => value,
                    resolver,
                    isPreview: false,
                    depth: depth + 1
                }} />
            </>)}

        {iterator.length >= 5 ? ",…" : ""}

        {wrappSymbol.at(1)}

    </>;
};

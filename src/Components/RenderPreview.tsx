import { Fragment, useMemo } from "react";
import { getEntriesCb } from "../object-tree/getEntries";
import { ResolverFn, Entry } from "../object-tree/types";
import { RenderName } from "./RenderName";
import { RenderValue } from "./RenderValue";
import { RenderOptions } from "./RenderNode";
import { CustomEntry, CustomIterator } from "../object-tree/resolver/collections";



export const RenderPreview: React.FC<{
    valueWrapper: any;
    depth?: number;
    options: RenderOptions,
}> = ({ valueWrapper, options, depth = 0 }) => {

    const value = valueWrapper()

    let iterator = useMemo(
        () => {
            let list: Entry[] = [];
            getEntriesCb(
                value,
                {
                    expandDepth: 0,
                    nonEnumerable: false,
                    resolver: options.resolver,
                    symbol: options.includeSymbols,
                },
                true,
                {},
                (key, value, enumerable) => {
                    list.push({ key, value, enumerable });
                    return list.length > 5;
                }
            );

            return list;
        },
        [options.resolver, value, options.includeSymbols]
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
            .map(({ key, value }, index) => <Fragment key={typeof key === "symbol" ? key.toString() : `${String(key)}-${index}`}>
                {index > 0 ? customSeperator : ""}
                {!hideKey && <><RenderName name={String(key)} />: </>}
                <RenderValue {...{
                    valueWrapper: () => value,
                    options,
                    isPreview: false,
                    depth: depth + 1
                }} />
            </Fragment>)}

        {iterator.length >= 5 ? ",…" : ""}

        {wrappSymbol.at(1)}

    </>;
};

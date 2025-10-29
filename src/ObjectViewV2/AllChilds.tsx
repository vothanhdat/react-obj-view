import React, { useMemo } from "react";
import { GroupedProxy, getObjectGroupProxyEntries } from "./utils/groupedProxy";
import { ObjectRenderWrapper } from "./ObjectRender";
import { ObjectRenderProps } from "./types";
import { createIterator } from "./utils/createIterator";
import { useResolver } from "./utils/useResolver";


export const AllChilds: React.FC<ObjectRenderProps> = ({ name, value, path = "", level = 0, context }) => {

    const resolver = useResolver(value, context)

    const [enumrables, noneEnumerables] = useMemo(
        () => {
            const all = value instanceof GroupedProxy
                ? []
                : [...resolver(value, createIterator(true, false)(value), false)];
            return [
                all.filter(e => !e.isNonenumerable),
                all.filter(e => e.isNonenumerable),
            ];
        },
        [value]
    );

    const renderObject = useMemo(
        () => value instanceof GroupedProxy
            ? value
            : getObjectGroupProxyEntries(enumrables, 100),
        [enumrables, value]
    );

    const entries = useMemo(
        () => [
            ...Object.entries(renderObject)
                .map(([name, data]) => ({ name, data, isNonenumerable: false })),
            ...context.nonEnumerable ? noneEnumerables : []
        ], [renderObject, noneEnumerables, context.nonEnumerable]
    );

    return <>
        {entries
            .map(({ name, data, isNonenumerable }) => <ObjectRenderWrapper
                key={path + "." + String(name)}
                {...{
                    name,
                    value: data,
                    isNonenumerable,
                    path: path + "." + String(name),
                    level: level + 1,
                    context
                }} />)}

    </>;
};

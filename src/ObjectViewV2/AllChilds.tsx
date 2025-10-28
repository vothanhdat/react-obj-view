import React, { useMemo } from "react";
import { GroupedProxy, getObjectGroupProxyEntries } from "./utils/groupedProxy";
import { ObjectRender } from "./ObjectRender";
import { ObjectRenderProps } from "./types";
import { createIterator } from "./utils/createIterator";


export const AllChilds: React.FC<ObjectRenderProps> = ({ name, value, path = "", level = 0, context }) => {


    const [enumrables, noneEnumerables] = useMemo(
        () => {
            const all = value instanceof GroupedProxy
                ? []
                : [...createIterator(true, false)(value)];
            return [
                all.filter(e => !e.isNonenumerable),
                all.filter(e => e.isNonenumerable),
            ];
        },
        [value]
    );

    const renderObject = useMemo(
        () => value instanceof GroupedProxy ? value
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
            .map(({ name, data, isNonenumerable }) => <ObjectRender
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

import React, { useMemo } from "react";
import { GroupedProxy, getObjectGroupProxyEntries } from "./utils/groupedProxy";
import { ObjectRenderWrapper } from "./ObjectRender";
import { ObjectRenderProps } from "./types";
import { createIterator } from "./utils/createIterator";
import { useResolver } from "./utils/useResolver";
import { createMemorizeMap } from "../utils/createMemorizeMap";
import { isRef } from "../utils/isRef";


export const AllChilds: React.FC<ObjectRenderProps> = ({ name, value, path = "", level = 0, context, traces }) => {

    const resolver = useResolver(value, context)

    const [enumrables, noneEnumerables] = useMemo(
        () => {
            const all = value instanceof GroupedProxy
                ? []
                : resolver(value, createIterator(true, false)(value), false);
            return [
                all.filter(e => e.enumerable),
                all.filter(e => !e.enumerable),
            ];
        },
        [value, resolver]
    );

    const groupSize = value instanceof Array ? context.arrayGroupSize : context.objectGroupSize

    const renderObject = useMemo(
        () => value instanceof GroupedProxy
            ? value
            : getObjectGroupProxyEntries(enumrables, groupSize),
        [enumrables, groupSize, value]
    );

    // console.log({ renderObject })

    const entries = useMemo(
        () => [
            ...Object.entries(renderObject)
                .map(([key, value]) => ({ key, value, enumerable: true })),
            ...context.nonEnumerable ? noneEnumerables : []
        ], [renderObject, noneEnumerables, context.nonEnumerable]
    );

    const traceFactory = useMemo(
        () => createMemorizeMap((obj) => isRef(obj) ? [...traces ?? [], obj] : traces),
        [traces]
    )

    return <>
        {entries
            .map(({ key: name, value: data, enumerable }) => <ObjectRenderWrapper
                key={path + "." + String(name)}
                {...{
                    name,
                    value: data,
                    isNonenumerable: !enumerable,
                    path: path + "." + String(name),
                    level: level + 1,
                    traces: traceFactory(data),
                    context
                }} />)}

    </>;
};

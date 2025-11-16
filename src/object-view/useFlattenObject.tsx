import { useCallback, useMemo, useState } from "react";
import { ResolverFn } from "../object-tree/types";
import { objectTreeWalkingFactory, ObjectWalkingConfig } from "../object-tree";
import { DEFAULT_RESOLVER } from "../object-tree/resolver";
import { GROUP_ARRAY_RESOLVER, GROUP_OBJECT_RESOLVER } from "../object-tree/resolver/grouped";
import { useFactoryFn } from "./useFactoryFn";
import { NodeResult } from "../object-tree/NodeResult";

export type FlattenObjectConfig = {
    expandDepth: number;
    nonEnumerable: boolean;
    customResolver?: Map<any, ResolverFn>;
    arrayGroupSize?: number;
    objectGroupSize?: number;
    symbol?: boolean;
};

export function useFlattenObject(
    value: unknown,
    name: string | undefined,
    flattenConfig: FlattenObjectConfig
) {

    const {
        expandDepth,
        nonEnumerable,
        arrayGroupSize,
        objectGroupSize,
        customResolver: _resolver,
        symbol,
    } = flattenConfig

    const resolver = useMemo(
        () => new Map([
            ...DEFAULT_RESOLVER,
            ..._resolver ?? [],
            ...Number(arrayGroupSize) > 1
                ? GROUP_ARRAY_RESOLVER(Number(arrayGroupSize))
                : [],
            ...Number(objectGroupSize) > 1
                ? GROUP_OBJECT_RESOLVER(Number(objectGroupSize))
                : [],
        ]),
        [_resolver, arrayGroupSize, objectGroupSize, DEFAULT_RESOLVER]
    );

    const config = useMemo(
        () => ({ resolver, nonEnumerable, symbol, }) as ObjectWalkingConfig,
        [nonEnumerable, resolver, symbol]
    );

    const [reload, setReload] = useState(0);

    const indexWalkingRef = useFactoryFn(objectTreeWalkingFactory);

    const refWalkResult = useMemo(
        () => {
            const result = indexWalkingRef.current!.walking(
                value,
                name ?? "ROOT",
                config,
                expandDepth,
            );
            return { ...result };
        },
        [indexWalkingRef.current, expandDepth, value, name, reload, config]
    );

    const refreshPath = useCallback(
        (node: { paths: any[] }) => {
            indexWalkingRef.current?.refreshPath(node.paths);
            setReload(e => e + 1);
        },
        [indexWalkingRef.current, config]
    );

    const toggleChildExpand = useCallback(
        (node: { paths: any[] }) => {
            indexWalkingRef.current?.toggleExpand(node.paths);
            setReload(e => e + 1);
        },
        [indexWalkingRef.current]
    );

    const getNodeByIndex = useMemo(
        () => {
            let m = new Map<any, NodeResult>();

            return (index: number) => {
                let data = m.get(index);

                if (!data) {
                    let state = indexWalkingRef.current?.getNode(index)!
                    data = new NodeResult(
                        state.state,
                        state.depth,
                        state.paths,
                        state.parentIndex
                    )

                    m.set(index, data);
                }

                return data;
            };
        },
        [indexWalkingRef.current, refWalkResult, reload]
    );

    return {
        toggleChildExpand,
        refreshPath,
        resolver,
        getNodeByIndex,
        size: refWalkResult.childCount,
    };
}





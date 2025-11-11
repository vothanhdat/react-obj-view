import { RefObject, useRef, useMemo, useState, useCallback } from "react";
import { DEFAULT_RESOLVER } from "./resolvers";
import { GROUP_ARRAY_RESOLVER, GROUP_OBJECT_RESOLVER } from "./resolvers/grouped";
import { ResolverFn, WalkingConfig } from "./types";
import { NodeResultData, walkingToIndexFactory } from "./walkingToIndexFactory";

const useObjectId = <T,>(value: any) => {
    let ref = useRef<{ value: T; id: number; }>({ value, id: 0 });
    if (ref.current.value !== value) {
        ref.current.value = value;
        ref.current.id++;
    }
    return ref.current.id;
};

export type FlattenObjectConfig = {
    expandDepth: number;
    nonEnumerable: boolean;
    customResolver?: Map<any, ResolverFn>;
    arrayGroupSize?: number;
    objectGroupSize?: number;
    symbol?: boolean;
};

export function useFlattenObjectView(
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
        () => ({ expandDepth, resolver, nonEnumerable, symbol, }) as WalkingConfig,
        [nonEnumerable, expandDepth, resolver, symbol]
    );

    const [reload, setReload] = useState(0);

    const { refWalk } = useWalkingFn();

    const refWalkResult = useMemo(
        () => {
            // console.time("walking");
            const result = refWalk.current!.walking(
                value,
                config,
                name ?? "ROOT",
                true
            );

            // console.log("updateStamp", result.updateStamp);
            // console.timeEnd("walking");
            return { ...result };
        },
        [refWalk.current, value, name, reload, config]
    );

    const refreshPath = useCallback(
        (node: NodeResultData) => {
            // console.time("refreshPath");
            refWalk.current?.refreshPath(node.paths);
            // console.timeEnd("refreshPath");
            setReload(e => e + 1);
        },
        [refWalk.current, config]
    );

    const toggleChildExpand = useCallback(
        (node: NodeResultData) => {
            // console.time("toggleExpand");
            refWalk.current?.toggleExpand(node.paths, config);
            // console.timeEnd("toggleExpand");
            setReload(e => e + 1);
        },
        [refWalk.current, config]
    );

    const getNodeByIndex = useMemo(
        () => {
            let m = new Map();

            return (index: number) => {
                let data = m.get(index);

                if (!data) {
                    m.set(index, data = refWalk.current?.getNode(index, config)!);
                }

                return data;
            };
        },
        [refWalk.current, config, refWalkResult, reload]
    );

    return {
        toggleChildExpand,
        refreshPath,
        resolver,
        getNodeByIndex,
        size: refWalkResult.count,
    };
}

type Factory = typeof walkingToIndexFactory;

function useWalkingFn(): {
    refWalk: RefObject<ReturnType<Factory> | undefined>;
} {
    const refWalkFn = useRef<Factory>(undefined);
    const refWalk = useRef<ReturnType<Factory>>(undefined);

    const factory = walkingToIndexFactory;

    if (!refWalk.current || refWalkFn.current != factory) {
        refWalkFn.current = factory;
        refWalk.current = factory();
    };

    return {
        refWalk,
    };
}

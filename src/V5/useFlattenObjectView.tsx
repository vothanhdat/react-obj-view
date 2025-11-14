import { RefObject, useRef, useMemo, useState, useCallback } from "react";
import {
    walkingToIndexFactory,
    type WalkingConfig,
    type NodeResult,
    type NodeResultData,
    type TreeWalkerAdapter,
} from "@react-obj-view/tree-core";
import {
    DEFAULT_RESOLVER,
    GROUP_ARRAY_RESOLVER,
    GROUP_OBJECT_RESOLVER,
    type ResolverFn,
    createObjectWalkerAdapter,
    getObjectWalkerVersionToken,
    getObjectNodeMeta,
    type ObjectNodeMeta,
} from "../objectWalker";

type WalkerNode = NodeResult<unknown, PropertyKey, ObjectNodeMeta>;
type WalkerNodeData = NodeResultData<unknown, PropertyKey, ObjectNodeMeta>;

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
        [_resolver, arrayGroupSize, objectGroupSize]
    );

    const adapter = useMemo(
        () => createObjectWalkerAdapter({
            resolver,
            includeSymbols: Boolean(symbol),
            nonEnumerable,
        }),
        [resolver, symbol, nonEnumerable]
    );

    const versionToken = useMemo(
        () => getObjectWalkerVersionToken({
            resolver,
            includeSymbols: Boolean(symbol),
            nonEnumerable,
        }),
        [resolver, symbol, nonEnumerable]
    );

    const config = useMemo(
        () => ({ expandDepth, versionToken }) as WalkingConfig,
        [expandDepth, versionToken]
    );

    const [reload, setReload] = useState(0);

    const { refWalk } = useWalkingFn(adapter);

    const refWalkResult = useMemo(
        () => {
            if (!refWalk.current) {
                return null;
            }

            const result = refWalk.current.walking(
                value,
                config,
                (name ?? "ROOT") as PropertyKey,
                getObjectNodeMeta(true, false)
            );

            return { ...result };
        },
        [refWalk.current, value, name, reload, config]
    );

    const refreshPath = useCallback(
        (node: WalkerNodeData) => {
            // console.time("refreshPath");
        if (!refWalk.current) {
            return;
        }
        refWalk.current.refreshPath(node.paths as PropertyKey[]);
            // console.timeEnd("refreshPath");
            setReload(e => e + 1);
        },
        [refWalk.current, config]
    );

    const toggleChildExpand = useCallback(
        (node: WalkerNodeData) => {
            // console.time("toggleExpand");
        if (!refWalk.current) {
            return;
        }
        refWalk.current.toggleExpand(node.paths as PropertyKey[], config);
            // console.timeEnd("toggleExpand");
            setReload(e => e + 1);
        },
        [refWalk.current, config]
    );

    const getNodeByIndex = useMemo(
        () => {
            let m = new Map<number, WalkerNode>();

            return (index: number): WalkerNode => {
                let data = m.get(index);

                if (!data) {
                    if (!refWalk.current) {
                        throw new Error("Tree walker not initialised");
                    }
                    const node = refWalk.current.getNode(index, config);
                    m.set(index, data = node);
                }

                return data;
            };
        },
        [refWalk.current, config, refWalkResult, reload]
    );

    const size = refWalkResult?.count ?? 0;

    return {
        toggleChildExpand,
        refreshPath,
        resolver,
        getNodeByIndex,
        size,
    };
}

type WalkerInstance = ReturnType<typeof walkingToIndexFactory<unknown, PropertyKey, ObjectNodeMeta>>;

function useWalkingFn(
    adapter: TreeWalkerAdapter<unknown, PropertyKey, ObjectNodeMeta>,
): {
    refWalk: RefObject<WalkerInstance | null>;
} {
    const refAdapter = useRef<typeof adapter | null>(null);
    const refWalk = useRef<WalkerInstance | null>(null);

    if (!refWalk.current || refAdapter.current !== adapter) {
        refAdapter.current = adapter;
        refWalk.current = walkingToIndexFactory(adapter);
    }

    return { refWalk };
}

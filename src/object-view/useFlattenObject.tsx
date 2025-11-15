import { RefObject, useCallback, useMemo, useRef, useState } from "react";
import { ResolverFn } from "../object-tree/types";
import { objectTreeWalking, ObjectWalkingConfig, ObjectWalkingNode, ObjectWalkingResult, parseWalkingMeta } from "../object-tree";
import { DEFAULT_RESOLVER } from "../object-tree/resolver";
import { GROUP_ARRAY_RESOLVER, GROUP_OBJECT_RESOLVER } from "../object-tree/resolver/grouped";



export type NodeResultData = ObjectWalkingResult & {
    depth: number, path: string, paths: PropertyKey[]
} & ReturnType<typeof parseWalkingMeta>

export class NodeResult {

    constructor(
        public state: ObjectWalkingResult,
        public depth: number,
        public paths: PropertyKey[],
        public parentIndex: number[],
    ) {
        Object.assign(this, state)
    }

    public get path(): string {
        return this.paths
            .map(e => {
                try {
                    return String(e);
                } catch (error) {
                    return "";
                }
            }).join("/");
    }

    getData(): NodeResultData {
        const state = this.state
        return ({
            ...state,
            ...parseWalkingMeta(state.meta!),
            depth: this.depth,
            path: this.path,
            paths: this.paths,
        })
    }

}

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

    const { refWalk } = useWalkingFn();

    const refWalkResult = useMemo(
        () => {
            // console.time("walking");
            const result = refWalk.current!.walking(
                value,
                name ?? "ROOT",
                config,
                expandDepth,
            );

            // console.log("updateStamp", result.updateStamp);
            // console.timeEnd("walking");
            return { ...result };
        },
        [refWalk.current, expandDepth, value, name, reload, config]
    );

    const refreshPath = useCallback(
        (node: { paths: any[] }) => {
            // console.time("refreshPath");
            refWalk.current?.refreshPath(node.paths);
            // console.timeEnd("refreshPath");
            setReload(e => e + 1);
        },
        [refWalk.current, config]
    );

    const toggleChildExpand = useCallback(
        (node: { paths: any[] }) => {
            // console.time("toggleExpand");
            refWalk.current?.toggleExpand(node.paths);
            // console.timeEnd("toggleExpand");
            setReload(e => e + 1);
        },
        [refWalk.current]
    );

    const getNodeByIndex = useMemo(
        () => {
            let m = new Map<any, NodeResult>();

            return (index: number) => {
                let data = m.get(index);

                if (!data) {
                    let state = refWalk.current?.getNode(index)!
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
        [refWalk.current, refWalkResult, reload]
    );

    return {
        toggleChildExpand,
        refreshPath,
        resolver,
        getNodeByIndex,
        size: refWalkResult.childCount,
    };
}

type Factory = typeof objectTreeWalking;

function useWalkingFn(): {
    refWalk: RefObject<ReturnType<Factory> | undefined>;
} {
    const refWalkFn = useRef<Factory>(undefined);
    const refWalk = useRef<ReturnType<Factory>>(undefined);

    const factory = objectTreeWalking;

    if (!refWalk.current || refWalkFn.current != factory) {
        refWalkFn.current = factory;
        refWalk.current = factory();
    };

    return {
        refWalk,
    };
}

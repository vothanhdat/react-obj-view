import { RefObject, useCallback, useMemo, useRef, useState } from "react";
import { Virtuoso } from 'react-virtuoso'
import { ObjectViewProps } from "../ObjectViewV2/ObjectView";
import { ResolverFn } from "../V3/types";
import { DEFAULT_RESOLVER } from "../V3/resolver";
import { WalkingConfig } from "../V3/NodeData";
import { NodeResult, WalkingResult, walkingToIndexFactory } from "./walkingToIndexFactory";
import { RenderNode } from "../Virtualize/RenderNode";
import "../Virtualize/style.css"
import { getObjectUniqueId } from "../V4/getObjectUniqueId";

export const V5Index: React.FC<ObjectViewProps> = ({
    value,
    name,
    expandLevel,
    highlightUpdate,
    resolver,
    nonEnumerable = false,
    preview = true,
    showLineNumbers = false,
}) => {


    const { getNodeByIndex, toggleChildExpand, combinedResolver, size } = useFlattenObjectView(
        value,
        name,
        typeof expandLevel == 'boolean'
            ? (expandLevel ? 20 : 0)
            : Number(expandLevel),
        nonEnumerable,
        resolver,
    );

    const dataPLeft = String(size).length

    const nodeRender = useCallback(
        (index: number) => <div style={{
            height: "14px",
            borderBottom: "solid 1px #8881",
        }} data-p-left={showLineNumbers ? dataPLeft : 0}>
            {showLineNumbers &&
                <span className="index-counter">{String(index).padStart(dataPLeft, " ")}
                </span>}
            <RenderNode
                enablePreview={preview}
                resolver={combinedResolver}
                node={getNodeByIndex(index)}
                toggleChildExpand={toggleChildExpand as any}
                key={getNodeByIndex(index).path} />
        </div>,
        [getNodeByIndex, toggleChildExpand, preview, showLineNumbers ? dataPLeft : 0]
    )

    const computeItemKey = useCallback(
        (index: number) => getNodeByIndex(index).path,
        [getNodeByIndex]
    )

    return <>
        <div className="big-objview-root" style={{ height: `400px` }}>
            <Virtuoso
                style={{ height: '100%' }}
                computeItemKey={computeItemKey}
                fixedItemHeight={14}
                totalCount={size}
                itemContent={nodeRender}
            />
        </div>
    </>
}



const WALK_CACHE_CAPACITY = 2;
const WALK_RESULT_CACHE = new WeakMap<object, Map<string, WalkingResult>>();

const getConfigCacheKey = (
    config: Pick<WalkingConfig, "expandDepth" | "nonEnumerable" | "resolver">,
    reload: number,
) => {
    const resolverId = getObjectUniqueId(config.resolver ?? DEFAULT_RESOLVER);
    return [
        reload,
        config.expandDepth,
        config.nonEnumerable ? 1 : 0,
        resolverId,
    ].join(":");
};

function useFlattenObjectView(
    value: any,
    name: string | undefined,
    expandDepth: number,
    nonEnumerable: boolean,
    resolver: Map<any, ResolverFn> | undefined,
) {

    const resolverRef = useRef<Map<any, ResolverFn> | undefined>(undefined);
    const resolverInputRef = useRef<typeof resolver>(undefined);

    if (!resolverRef.current || resolverInputRef.current !== resolver) {
        resolverInputRef.current = resolver;

        const merged = new Map(DEFAULT_RESOLVER);
        if (resolver) {
            for (const [key, value] of resolver) {
                merged.set(key, value);
            }
        }

        resolverRef.current = merged;
    }

    const combinedResolver = resolverRef.current!;

    const config = useMemo(
        () => ({
            expandDepth,
            resolver: combinedResolver,
            nonEnumerable,
            symbol: false,
        }) as WalkingConfig,
        [nonEnumerable, expandDepth, combinedResolver]
    )

    const [reload, setReload] = useState(0);

    const { refWalk } = useWalkingFn("v3");

    const refWalkResult = useMemo(
        () => {
            const isCacheable = typeof value === "object" && value !== null;
            const cacheKey = getConfigCacheKey(config, reload);

            if (isCacheable) {
                const cachedMap = WALK_RESULT_CACHE.get(value as object);
                const cachedResult = cachedMap?.get(cacheKey);
                if (cachedResult) {
                    return cachedResult;
                }
            }

            console.time("walking");
            const result = refWalk.current!.walking(
                value,
                config,
                "ROOT",
                true,
            );
            console.timeEnd("walking");

            if (isCacheable) {
                let cachedMap = WALK_RESULT_CACHE.get(value as object);
                if (!cachedMap) {
                    cachedMap = new Map();
                    WALK_RESULT_CACHE.set(value as object, cachedMap);
                }
                cachedMap.set(cacheKey, result);
                if (cachedMap.size > WALK_CACHE_CAPACITY) {
                    const oldestEntry = cachedMap.keys().next();
                    if (!oldestEntry.done) {
                        cachedMap.delete(oldestEntry.value);
                    }
                }
            }

            return result;
        },
        [refWalk, value, config, reload]
    );


    const toggleChildExpand = useCallback(
        (node: NodeResult) => {
            console.time("toggleExpand")
            refWalk.current?.toggleExpand(node.paths, config)
            console.timeEnd("toggleExpand");
            setReload(e => e + 1);
        },
        [refWalk, config]
    );

    const getNodeByIndex = useMemo(
        () => {
            let m = new Map()

            return (index: number) => {
                let data = m.get(index);

                if (!data) {
                    m.set(index, data = refWalk.current?.getNode(index, config)!);
                }

                return data
            }
        },
        [refWalk, config, refWalkResult.count, reload, refWalkResult.value]
    )

    // console.log("COUNT", refWalkResult.count)

    return {
        toggleChildExpand,
        combinedResolver,
        getNodeByIndex,
        size: refWalkResult.count,
    };
}

type Factory = typeof walkingToIndexFactory

function useWalkingFn(version: "v3" | "v4"): {
    refWalk: RefObject<ReturnType<Factory> | undefined>,
} {
    const refWalkFn = useRef<Factory>(undefined);
    const refWalk = useRef<ReturnType<Factory>>(undefined);

    const factory = walkingToIndexFactory

    if (!refWalk.current || refWalkFn.current != factory) {
        refWalkFn.current = factory;
        refWalk.current = factory();
    };

    return {
        refWalk,
    };
}


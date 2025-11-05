import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Virtuoso } from 'react-virtuoso'
import { ObjectViewProps } from "../ObjectViewV2/ObjectView";
import { ResolverFn } from "../V3/types";
import { DEFAULT_RESOLVER } from "../V3/resolver";
import { WalkingConfig, walkingFactory } from "../V3/NodeData";
import { walkingToIndexFactory } from "./walkingToIndexFactory";
import { RenderNode } from "../Virtualize/RenderNode";
import { NodeData } from "../V4/NodeData";
import "../Virtualize/style.css"

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
                toggleChildExpand={toggleChildExpand}
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



function useFlattenObjectView(
    value: any,
    name: string | undefined,
    expandDepth: number,
    nonEnumerable: boolean,
    resolver: Map<any, ResolverFn> | undefined,
) {

    const combinedResolver = useMemo(
        () => new Map([
            ...DEFAULT_RESOLVER,
            ...resolver ?? [],
        ]), [resolver, DEFAULT_RESOLVER]
    )

    const config = useMemo(
        () => ({
            expandDepth,
            resolver: combinedResolver,
            nonEnumerable,
        }) as WalkingConfig,
        [nonEnumerable, expandDepth, combinedResolver]
    )

    const [reload, setReload] = useState(0);

    const { refWalk } = useWalkingFn("v3");

    const refWalkResult = useMemo(
        () => {
            console.log("walking config", config)
            console.time("walking")
            const result = refWalk.current!.walking(
                value,
                config,
                "ROOT",
                true,
            );
            console.timeEnd("walking")
            return result;
        },
        [refWalk.current, value, name, config]
    );


    const toggleChildExpand = useCallback(
        (node: NodeData) => {
            // console.log({ node })
            // console.time("toggleExpand")
            // refWalk.current?.toggleExpand(node.paths, config)
            // console.timeEnd("toggleExpand")
            // setReload(e => e + 1);
        },
        [refWalk, config]
    );

    const getNodeByIndex = useMemo(
        () => {
            let m = new Map()

            return (index: number) => {
                let data = m.get(index);

                if (!data) {
                    let parse = refWalk.current?.getNode(index, config)!;
                    data = {
                        ...parse.state,
                        paths: parse.paths,
                        path: parse.paths.join("."),
                        depth: parse.depth,
                    };
                    m.set(index, data);
                }

                return data
            }
        },
        [refWalk.current, config]
    )

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


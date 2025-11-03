import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RenderNode } from "./RenderNode";
import { Virtuoso } from 'react-virtuoso'
import "./style.css"
import { ObjectViewProps } from "../ObjectViewV2/ObjectView";
import { ResolverFn } from "../V3/types";
import { DEFAULT_RESOLVER } from "../V3/resolver";
import { WalkingConfig } from "../V3/NodeData";
import { walkingFactoryV4 } from "./walkingV4";
import { linkListToArray } from "./LinkedNode";
import { NodeData } from "./NodeData";

export const V12: React.FC<ObjectViewProps> = ({
    value,
    name,
    expandLevel,
    highlightUpdate,
    resolver,
    nonEnumerable = false,
    preview,
}) => {


    const { flattenNodes, toggleChildExpand, combinedResolver } = useFlattenObjectView(
        value,
        name,
        typeof expandLevel == 'boolean'
            ? (expandLevel ? 100 : 0)
            : Number(expandLevel),
        nonEnumerable,
        resolver,
    );

    const nodeRender = useCallback(
        (index: number) => <div style={{ height: "15px" }}>
            <RenderNode
                resolver={combinedResolver}
                node={flattenNodes[index]}
                toggleChildExpand={toggleChildExpand}
                key={flattenNodes[index].path} />
        </div>,
        [toggleChildExpand, flattenNodes]
    )

    const computeItemKey = useCallback(
        (index: number) => flattenNodes[index].path,
        [flattenNodes]
    )

    return <>
        <div className="big-objview-root" style={{ height: `400px` }}>
            <Virtuoso
                style={{ height: '100%' }}
                computeItemKey={computeItemKey}
                fixedItemHeight={14}
                totalCount={flattenNodes.length}
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
    const refWalkFn = useRef<typeof walkingFactoryV4>(undefined);
    const refWalk = useRef<ReturnType<typeof walkingFactoryV4>>(undefined);

    if (!refWalk.current || refWalkFn.current != walkingFactoryV4) {
        refWalkFn.current = walkingFactoryV4;
        refWalk.current = walkingFactoryV4();
    }

    const linkList = useMemo(
        () => {
            console.log("walking config", config)
            console.time("walking")
            const result = refWalk.current!.walking(
                value,
                config,
                "ROOT"
            );
            console.timeEnd("walking")
            return result;
        },
        [value, name, config]
    );

    const flattenNodes = useMemo(
        () => {
            console.time("linkListToArray")
            let r = linkListToArray(linkList);
            console.timeEnd("linkListToArray")
            return r;
        },
        [linkList, reload]
    );

    const toggleChildExpand = useCallback(
        (node: NodeData) => {
            console.log({ node })
            console.time("toggleExpand")
            refWalk.current?.toggleExpand(node.paths, config)
            console.timeEnd("toggleExpand")
            setReload(e => e + 1);
        },
        [refWalk, config]
    );
    return {
        flattenNodes,
        toggleChildExpand,
        combinedResolver
    };
}


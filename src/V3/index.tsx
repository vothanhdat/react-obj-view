import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NodeData, walkingFactory, WalkingConfig } from "./NodeData";
import { linkListToArray } from "./LinkList";
import { RenderNode } from "./RenderNode";
import { Virtuoso } from 'react-virtuoso'
import "./style.css"
import { ObjectViewProps, ResolverFn } from "./types";

export const V8: React.FC<ObjectViewProps> = ({
    value,
    name,
    expandLevel,
    highlightUpdate,
    resolver,
    nonEnumerable = false,
    preview,
}) => {


    const { flattenNodes, toggleChildExpand } = useFlattenObjectView(
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


    const config = useMemo(
        () => ({
            expandDepth,
            resolver,
            nonEnumerable,
        }) as WalkingConfig,
        [resolver, nonEnumerable, expandDepth]
    )


    const [reload, setReload] = useState(0);
    const refWalkFn = useRef<typeof walkingFactory>(undefined);
    const refWalk = useRef<ReturnType<typeof walkingFactory>>(undefined);

    if (!refWalk.current || refWalkFn.current != walkingFactory) {
        refWalkFn.current = walkingFactory;
        refWalk.current = walkingFactory();
    }

    const linkList = useMemo(
        () => {
            console.time("walking")
            const result = refWalk.current!.walking(
                value,
                config,
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
            console.time("toggleExpand")
            refWalk.current?.toggleExpand(node.paths, config)
            console.timeEnd("toggleExpand")
            setReload(e => e + 1);
        },
        [refWalk, config]
    );
    return { flattenNodes, toggleChildExpand };
}


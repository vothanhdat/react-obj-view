import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ObjectViewProps } from "../ObjectViewV2/ObjectView";
import { expandRefSymbol, expandSymbol, NodeData, walkAsLinkList } from "./NodeData";
import { linkListToArray } from "./LinkList";
import { RenderNode } from "./RenderNode";
import { Virtuoso } from 'react-virtuoso'


export const V8: React.FC<ObjectViewProps> = ({
    value,
    name,
    expandLevel,
}) => {

    const { flattenNodes, toggleChildExpand } = useFlattenObjectView(expandLevel, value, name);

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
        <div style={{ height: `300px`, overflow: 'auto', fontFamily: 'monospace', fontSize: "12px" }}>
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



function useFlattenObjectView(expandLevel: number | boolean | undefined, value: any, name: string | undefined) {
    const [reload, setReload] = useState(0);
    const refWalkFn = useRef<typeof walkAsLinkList>(undefined);
    const refWalk = useRef<ReturnType<typeof walkAsLinkList>>(undefined);
    const refExpandMap = useRef<Map<any, any>>(undefined);

    if (!refWalk.current || refWalkFn.current != walkAsLinkList) {
        refWalkFn.current = walkAsLinkList;
        refWalk.current = walkAsLinkList();
    }



    if (!refExpandMap.current)
        refExpandMap.current = new Map();

    const level = typeof expandLevel == 'boolean'
        ? (expandLevel ? 100 : 0)
        : Number(expandLevel);

    const linkList = useMemo(
        () => {
            // console.time("walking")
            const result = refWalk.current!.walking(value, true, level, [], refExpandMap.current);
            // console.timeEnd("walking")
            return result;
        },
        [value, name, level]
    );

    const flattenNodes = useMemo(
        () => {
            // console.time("linkListToArray")
            let r = linkListToArray(linkList);
            // console.timeEnd("linkListToArray")
            return r;
        },
        [linkList, reload]
    );

    const toggleChildExpand = useCallback(
        (node: NodeData) => {
            let current = refExpandMap.current!;
            let defaultExpand = level > node.depth;

            if (!current)
                return;

            for (let path of node.paths) {
                if (!current.has(path)) {
                    current.set(path, new Map());
                }
                current.set(expandRefSymbol, Math.random());
                current = current!.get(path);
            }

            const nextExpand = !(current?.get(expandSymbol) ?? defaultExpand);

            current?.set(expandSymbol, nextExpand);

            // console.time("walkingSwap")
            refWalk.current?.walkingSwap(
                node.value,
                node.enumerable,
                level,
                node.paths,
                current
            );
            // console.timeEnd("walkingSwap")
            setReload(e => e + 1);
        },
        [refExpandMap, refWalk, level]
    );
    return { flattenNodes, toggleChildExpand };
}


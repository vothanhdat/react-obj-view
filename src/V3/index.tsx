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
    const [reload, setReload] = useState(0);

    const refWalkFn = useRef<typeof walkAsLinkList>(undefined)
    const refWalk = useRef<ReturnType<typeof walkAsLinkList>>(undefined)

    if (!refWalk.current || refWalkFn.current != walkAsLinkList) {
        refWalkFn.current = walkAsLinkList
        refWalk.current = walkAsLinkList()
    }

    const refExpandMap = useRef<Map<any, any>>(undefined)
    if (!refExpandMap.current)
        refExpandMap.current = new Map()

    const level = typeof expandLevel == 'boolean'
        ? (expandLevel ? 100 : 0)
        : Number(expandLevel)

    const linkList = useMemo(
        () => refWalk.current!.walking(value, true, level, [], refExpandMap.current),
        [value, name, level, reload]
    )

    const flattenNodes = useMemo(
        () => linkListToArray(linkList),
        [linkList]
    )

    const toggleChildExpand = useCallback(
        (node: NodeData) => {
            let current = refExpandMap.current!;
            let defaultExpand = level > node.depth;

            if (!current)
                return;

            for (let path of node.paths) {
                if (!current.has(path)) {
                    current.set(path, new Map())
                }
                current.set(expandRefSymbol, Math.random())
                current = current?.get(path)
            }

            current?.set(
                expandSymbol,
                !(current?.get(expandSymbol) ?? defaultExpand)
            );

            setReload(e => e + 1)
        },
        [refExpandMap, level]
    )

    const nodeRender = useCallback(
        (_, node: NodeData) => <div >
            <RenderNode
                node={node}
                toggleChildExpand={toggleChildExpand}
                key={node.path} />
        </div>,
        [toggleChildExpand]
    )

    const computeItemKey = useCallback(
        (_, node: NodeData) => node.path,
        []
    )

    return <>
        <div style={{ height: `300px`, overflow: 'auto', }}>
            <Virtuoso
                style={{ height: '100%' }}
                computeItemKey={computeItemKey}
                data={flattenNodes}
                itemContent={nodeRender}
            />
        </div>
    </>
}




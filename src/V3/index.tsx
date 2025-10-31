import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ObjectViewProps } from "../ObjectViewV2/ObjectView";
import { NodeData, walkingFactory } from "./NodeData";
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
    const refWalkFn = useRef<typeof walkingFactory>(undefined);
    const refWalk = useRef<ReturnType<typeof walkingFactory>>(undefined);

    if (!refWalk.current || refWalkFn.current != walkingFactory) {
        refWalkFn.current = walkingFactory;
        refWalk.current = walkingFactory();
    }


    const level = typeof expandLevel == 'boolean'
        ? (expandLevel ? 100 : 0)
        : Number(expandLevel);

    const linkList = useMemo(
        () => {
            // console.time("walking")
            const result = refWalk.current!.walking(value, level);
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
            // console.time("toggleExpand")
            refWalk.current?.toggleExpand(...node.paths)
            // console.timeEnd("toggleExpand")
            setReload(e => e + 1);
        },
        [refWalk, level]
    );
    return { flattenNodes, toggleChildExpand };
}


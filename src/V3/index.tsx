import { useMemo, useRef } from "react";
import { ObjectViewProps } from "../ObjectViewV2/ObjectView";
import { NodeData, walkAsLinkList } from "./NodeData";
import { linkListToArray } from "./LinkList";
import { RenderNode } from "./RenderNode";
import { useVirtualizer, VirtualItem } from "@tanstack/react-virtual";


export const V8: React.FC<ObjectViewProps> = ({
    value,
    name,
}) => {

    const refWalk = useRef<ReturnType<typeof walkAsLinkList>>(undefined)
    if (!refWalk.current)
        refWalk.current = walkAsLinkList()

    // console.time("refWalk")

    const linkList = useMemo(
        () => refWalk.current!(value, true, []),
        [value, name]
    )
    // console.timeEnd("refWalk")

    // console.time("linkListToArray")
    const flattenNodes = useMemo(
        () => linkListToArray(linkList),
        [linkList]
    )
    // console.timeEnd("linkListToArray")
    const parentRef = useRef(null)

    const rowHeight = 20

    const rowVirtualizer = useVirtualizer({
        count: flattenNodes.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => rowHeight,
        overscan: 5,
    });


    return <div style={{ height: `300px`, overflow: 'auto', }} ref={parentRef}>

        <div
            style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
            }}
        >
            {rowVirtualizer
                .getVirtualItems()
                .map(virtualRow => [virtualRow, flattenNodes[virtualRow.index]] as [VirtualItem, NodeData])
                .map(([virtualRow, nodeData]) => (
                    <div
                        key={virtualRow.index}
                        className={virtualRow.index % 2 ? 'ListItemOdd' : 'ListItemEven'}
                        style={{
                            position: 'absolute', top: 0, left: 0, width: '100%',
                            height: `${virtualRow.size}px`,
                            transform: `translateY(${virtualRow.start}px)`,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                    >
                        <RenderNode
                            node={nodeData}
                            key={nodeData.path} />
                    </div>

                ))}
        </div>

        {/* {flattenNodes
            ?.map(e => <RenderNode node={e} key={e.path} />)} */}
    </div>
}


import { RefObject, useCallback, useMemo, useRef, useState } from "react";
import { Virtuoso } from 'react-virtuoso'
import { ObjectViewProps } from "../ObjectViewV2/ObjectViewProps";
import { ResolverFn } from "../V3/types";
import { DEFAULT_RESOLVER } from "../V3/resolver";
import { WalkingConfig, walkingFactory } from "../V3/NodeData";
import { NodeData, RenderNode } from "./RenderNode";
import { walkingFactoryV4 } from "../V4/walkingV4";
import { linkListToArray as linkToArrV4 } from "../V4/LinkedNode";
import { linkListToArray as linkToArrV3 } from "../V3/LinkList";
import "./style.css"

export const ObjectViewVirtualize: React.FC<ObjectViewProps> = ({
    value,
    name,
    expandLevel,
    highlightUpdate,
    resolver,
    nonEnumerable = false,
    preview = true,
    showLineNumbers = false,
}) => {


    const { flattenNodes, toggleChildExpand, combinedResolver } = useFlattenObjectView(
        value,
        name,
        typeof expandLevel == 'boolean'
            ? (expandLevel ? 20 : 0)
            : Number(expandLevel),
        nonEnumerable,
        resolver,
    );

    const dataPLeft = String(flattenNodes.length).length

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
                node={flattenNodes[index]}
                toggleChildExpand={toggleChildExpand}
                key={flattenNodes[index].path} />
        </div>,
        [toggleChildExpand, flattenNodes, preview, showLineNumbers ? dataPLeft : 0]
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

    const { refWalk, linkToArray } = useWalkingFn("v4");

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
        [refWalk.current, value, name, config]
    );

    const flattenNodes = useMemo(
        () => {
            console.time("linkListToArray")
            let r = linkToArray(linkList);
            console.timeEnd("linkListToArray")
            return r;
        },
        [linkList, linkToArray, reload]
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

type Factory = (typeof walkingFactoryV4) | (typeof walkingFactory)

function useWalkingFn(version: "v3" | "v4"): {
    refWalk: RefObject<ReturnType<Factory> | undefined>,
    linkToArray: any,
} {
    const refWalkFn = useRef<Factory>(undefined);
    const refWalk = useRef<ReturnType<Factory>>(undefined);

    const factory = version == 'v3' ? walkingFactory : walkingFactoryV4

    const linkToArray = version == 'v3' ? linkToArrV3 : linkToArrV4

    if (!refWalk.current || refWalkFn.current != factory) {
        refWalkFn.current = factory;
        refWalk.current = factory();
    };

    return {
        refWalk,
        linkToArray,
    };
}


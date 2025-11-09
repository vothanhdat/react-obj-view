import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Virtuoso } from 'react-virtuoso'
import { ObjectViewProps } from "../ObjectViewV2/ObjectView";
import { ResolverFn } from "../V3/types";
import { DEFAULT_RESOLVER } from "../V3/resolver";
import { WalkingConfig, walkingFactory } from "../V3/NodeData";
import { NodeResult, walkingToIndexFactory } from "./walkingToIndexFactory";
import { RenderNode } from "../Virtualize/RenderNode";
import "../Virtualize/style.css"

export const V5Index: React.FC<ObjectViewProps> = ({
    valueGetter,
    name,
    expandLevel,
    highlightUpdate,
    resolver: customResolver,
    nonEnumerable = false,
    preview = true,
    showLineNumbers = false,
}) => {
    "use no memo";

    let value = useMemo(() => valueGetter(), [valueGetter])

    const { getNodeByIndex, toggleChildExpand, resolver, size } = useFlattenObjectView(
        value,
        name,
        typeof expandLevel == 'boolean'
            ? (expandLevel ? 20 : 0)
            : Number(expandLevel),
        nonEnumerable,
        customResolver,
    );

    const dataPLeft = String(size).length

    const NodeRender = useCallback(
        ({ index }: { index: number }) => {
            const node: NodeResult = getNodeByIndex(index);
            const nodeData = useMemo(
                () => node.getData(),
                [node.updateStamp]
            )

            return <div style={{
                height: "14px",
                borderBottom: "solid 1px #8881",
            }} data-p-left={showLineNumbers ? dataPLeft : 0}>
                {showLineNumbers &&
                    <span className="index-counter">{String(index).padStart(dataPLeft, " ")}
                    </span>}
                <RenderNode
                    enablePreview={preview}
                    resolver={resolver}
                    node={nodeData}
                    toggleChildExpand={toggleChildExpand as any}
                    key={nodeData.path} />
            </div>
        },
        [getNodeByIndex, toggleChildExpand, preview, showLineNumbers ? dataPLeft : 0]
    )

    const nodeRender = useCallback(
        (index: number) => <NodeRender index={index} />,
        [NodeRender, toggleChildExpand, preview, showLineNumbers ? dataPLeft : 0]
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

type ValueRef<T> = RefObject<{ value: T; id: number; }>

const useValueWithID = <T,>(value: any): ValueRef<T> => {
    let ref = useRef<{ value: T, id: number }>({ value, id: 0 })
    if (ref.current.value != value) {
        ref.current.id++;
        ref.current.value = value
    }
    return ref
}

const useObjectId = <T,>(value: any) => {
    let ref = useRef<{ value: T, id: number }>({ value, id: 0 })
    if (ref.current.value !== value) {
        ref.current.value = value;
        ref.current.id++;
    }
    return ref.current.id
}

function useFlattenObjectView(
    value: ValueRef<unknown>,
    name: string | undefined,
    expandDepth: number,
    nonEnumerable: boolean,
    _resolver: Map<any, ResolverFn> | undefined,
) {

    const resolver = useMemo(
        () => new Map([
            ...DEFAULT_RESOLVER,
            ..._resolver ?? [],
        ]),
        [useObjectId(_resolver), DEFAULT_RESOLVER]
    )

    const config = useMemo(
        () => ({ expandDepth, resolver, nonEnumerable, }) as WalkingConfig,
        [nonEnumerable, expandDepth, resolver]
    )

    const [reload, setReload] = useState(0);

    const { refWalk } = useWalkingFn();

    const refWalkResult = useMemo(
        () => {
            console.time("walking")
            const result = refWalk.current!.walking(
                value,
                config,
                "ROOT",
                true,
            );

            console.log("updateStamp", result.updateStamp)
            console.timeEnd("walking")
            return { ...result };
        },
        [refWalk, value, name, reload, config]
    );

    const toggleChildExpand = useCallback(
        (node: NodeResult) => {
            console.time("toggleExpand")
            refWalk.current?.toggleExpand(node.paths, config)
            console.timeEnd("toggleExpand");
            setReload(e => e + 1);
        },
        [refWalk.current, config]
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
        [refWalk.current, config, refWalkResult, reload]
    )

    return {
        toggleChildExpand,
        resolver,
        getNodeByIndex,
        size: refWalkResult.count,
    };
}

type Factory = typeof walkingToIndexFactory

function useWalkingFn(): {
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


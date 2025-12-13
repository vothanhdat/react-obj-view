import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { WalkingAdaperBase, InferWalkingInstance, InferWalkingType, InferNodeResult, InferWalkingResult } from "../tree-core";
import { MetaParserBase, FlattenNodeWrapper } from "./FlattenNodeWrapper";
import { ReactTreeHookParams } from "./types";
import { WalkingResult } from "../tree-core/types";
import { isDev } from "../../utils/isDev";



export const useReactTree = <
    T extends WalkingAdaperBase,
    MetaParser extends MetaParserBase<T>
>({
    factory, config, expandDepth, metaParser, value, name, iterateSize
}: ReactTreeHookParams<T, MetaParser>) => {

    const [reload, setReload] = useState(0);

    const ref = useRef({
        factory: undefined as any as (() => InferWalkingInstance<T>),
        instance: undefined as any as InferWalkingInstance<T>,
    });

    if (ref.current.factory != factory) {
        ref.current.factory = factory;
        ref.current.instance = factory();
    }

    const [walkingResult, setWalkingResult] = useState<WalkingResult<any, any, any>>()

    useEffect(
        () => {

            let iterate = ref.current.instance.walkingAsync(value, name, config, expandDepth, iterateSize)
            let isRunning = true


            setTimeout(async () => {


                // console.log("iterate new")

                for (let result of iterate) {
                    // console.log("iterate", { isRunning })

                    if (isRunning) {
                        setWalkingResult({ ...result });

                        await new Promise(r => (window.requestIdleCallback ?? window.requestAnimationFrame)(r))

                    } else {
                        // console.log("stop, switch to new")
                        break;
                    }
                }
                // console.log("iterate finish", { isRunning })


            }, 0)

            return () => { isRunning = false }

        },
        [ref.current.instance, value, name, config, expandDepth, reload]

    )

    const refreshPath = useCallback(
        ({ paths }: { paths: InferWalkingType<T>['Key'][]; }) => {
            ref.current.instance.refreshPath(paths);
            setReload(e => e + 1);
        },
        [ref]
    );

    const setChildExpand = useCallback(
        ({ paths, isExpanded }: { paths: InferWalkingType<T>['Key'][]; isExpanded: boolean }) => {
            ref.current.instance.setExpand(paths, () => isExpanded);
            setReload(e => e + 1);
        },
        [ref]
    );

    const toggleChildExpand = useCallback(
        ({ paths }: { paths: InferWalkingType<T>['Key'][]; }) => {
            ref.current.instance.setExpand(paths, (prev) => !prev);
            setReload(e => e + 1);
        },
        [ref]
    );

    const getNodeByIndex = useMemo(
        () => {
            let m = new Map<any, FlattenNodeWrapper<T, MetaParser>>();

            return (index: number) => {
                try {

                    let data = m.get(index);

                    if (!data) {
                        let state = ref.current.instance.getNode(index);
                        data = new FlattenNodeWrapper(
                            metaParser,
                            state.state as InferWalkingResult<T>,
                            state.depth,
                            state.paths,
                            state.parentIndex
                        );

                        m.set(index, data);
                    }


                    return data;
                } catch (error) {
                    console.error(error)
                    return undefined;
                }
            };
        },
        [ref.current.instance, walkingResult, reload]
    );

    const computeItemKey = useCallback(
        (index: number) => walkingResult && index < walkingResult.childCount
            ? getNodeByIndex(index)?.path ?? `index:${index}`
            : "",
        [getNodeByIndex, walkingResult?.childCount]
    );


    return {
        refreshPath,
        toggleChildExpand,
        setChildExpand,
        getNodeByIndex,
        computeItemKey,
        childCount: walkingResult?.childCount ?? 0,
    };
};

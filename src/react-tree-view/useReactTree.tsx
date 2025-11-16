import { useState, useRef, useMemo, useCallback } from "react";
import { WalkingAdaperBase, InferWalkingInstance, InferWalkingType, InferNodeResult, InferWalkingResult } from "../libs/tree-core";
import { MetaParserBase, FlattenNodeWrapper } from "./FlattenNodeWrapper";
import { ReactTreeHookParams } from "./types";



export const useReactTree = <
    T extends WalkingAdaperBase,
    MetaParser extends MetaParserBase<T>
>({
    factory, config, expandDepth, metaParser, value, name,
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

    const walkingResult = useMemo(
        () => ({
            ...ref.current.instance.walking(
                value, name, config, expandDepth
            )
        }),
        [ref.current.instance, value, name, config, expandDepth, reload]
    );

    const refreshPath = useCallback(
        ({ paths }: { paths: InferWalkingType<T>['Key'][]; }) => {
            ref.current.instance.refreshPath(paths);
            setReload(e => e + 1);
        },
        [ref]
    );

    const toggleChildExpand = useCallback(
        ({ paths }: { paths: InferWalkingType<T>['Key'][]; }) => {
            ref.current.instance.toggleExpand(paths);
            setReload(e => e + 1);
        },
        [ref]
    );

    const getNodeByIndex = useMemo(
        () => {
            let m = new Map<any, FlattenNodeWrapper<T, MetaParser>>();

            return (index: number) => {
                let data = m.get(index);

                if (!data) {
                    //TODO remove any
                    let state: InferNodeResult<T> = ref.current.instance.getNode(index) as any;
                    data = new FlattenNodeWrapper(
                        metaParser,
                        //TODO remove as InferWalkingResult<T>
                        state.state as InferWalkingResult<T>,
                        state.depth,
                        state.paths,
                        state.parentIndex
                    );

                    m.set(index, data);
                }

                return data;
            };
        },
        [ref.current.instance, walkingResult, reload]
    );

    const computeItemKey = useCallback(
        (index: number) => index < walkingResult.childCount ? getNodeByIndex(index).path : "",
        [getNodeByIndex, walkingResult.childCount]
    );


    return {
        refreshPath,
        toggleChildExpand,
        getNodeByIndex,
        computeItemKey,
        childCount: walkingResult.childCount,
    };
};

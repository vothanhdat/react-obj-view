import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { WalkingAdaperBase, InferWalkingInstance, InferWalkingType, InferNodeResult, InferWalkingResult } from "../tree-core";
import { MetaParserBase, FlattenNodeWrapper } from "./FlattenNodeWrapper";
import { ReactTreeHookParams } from "./types";
import { WalkingResult } from "../tree-core/types";
import { isDev } from "../../utils/isDev";
import { promiseWithResolvers } from "../../utils/promiseWithResolvers";



export const useReactTree = <
    T extends WalkingAdaperBase,
    MetaParser extends MetaParserBase<T>
>({
    factory, config, expandDepth, metaParser, value, name, iterateSize,
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

    const runningRef = useRef({
        each: undefined as PromiseWithResolvers<void> | undefined,
        finish: undefined as PromiseWithResolvers<void> | undefined,
        expandingPaths: undefined as PropertyKey[] | undefined,
    })

    useEffect(
        () => {

            let iterate = ref.current.instance.walkingAsync(value, name, config, expandDepth, iterateSize)
            let isRunning = true

            runningRef.current.each = promiseWithResolvers()
            runningRef.current.finish = promiseWithResolvers()

            setTimeout(async () => {

                for (let result of iterate) {

                    if (isRunning) {
                        setWalkingResult({ ...result });

                        runningRef.current.each?.resolve();
                        runningRef.current.each = promiseWithResolvers()

                        await new Promise(r => (window.requestIdleCallback ?? window.requestAnimationFrame)(r))

                        if (!isRunning) {
                            runningRef.current.each?.reject();

                            break;
                        }

                    } else {
                        runningRef.current.each?.reject();

                        break;
                    }
                }
                if (isRunning) {
                    runningRef.current.each?.resolve();
                    runningRef.current.finish?.resolve();
                } else {
                    runningRef.current.each?.reject();
                    runningRef.current.finish?.reject();
                }

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


    const expandAndGetIndex = useCallback(
        async (paths: InferWalkingType<T>['Key'][]) => {

            runningRef.current.expandingPaths = paths;

            ref.current.instance.expandPath(paths);

            setReload(e => e + 1);

            let t = Date.now()

            do {
                let r = await Promise
                    .race([
                        runningRef.current.finish?.promise.then(() => 2),
                        runningRef.current.each?.promise.then(() => 1),
                    ])
                    .catch((err) => (console.log(err), 0))

                if (runningRef.current.expandingPaths != paths) {
                    console.log("Break")
                    return -1;
                }

                const index = ref.current.instance.getIndexForPath(paths);

                if (index > -1) {
                    return index
                }

                if (r == 1) {
                    continue
                } else {
                    if (Date.now() - t >= 2000 || runningRef.current.expandingPaths != paths) {
                        return -1;
                    }

                    await new Promise(r => setTimeout(r, 200))
                }

            } while (true)

        },
        [ref, value, name, config, expandDepth]
    );

    const travelAndSearch = useCallback(
        (
            cb: (value: InferWalkingType<T>['Value'], key: InferWalkingType<T>['Key'], paths: InferWalkingType<T>['Key'][],) => void,
            iterateSize?: number, maxDepth?: number, fullSearch?: boolean,
        ) => ref.current.instance.traversalAndFindPaths(
            cb,
            config,
            iterateSize, maxDepth, fullSearch,
        ),
        [config, ref]
    )

    return {
        refreshPath,
        toggleChildExpand,
        setChildExpand,
        getNodeByIndex,
        computeItemKey,
        expandAndGetIndex,
        travelAndSearch,
        childCount: walkingResult?.childCount ?? 0,
    };
};

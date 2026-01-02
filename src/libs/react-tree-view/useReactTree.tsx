import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { WalkingAdapterBase, InferWalkingInstance, InferWalkingType, InferNodeResult, InferWalkingResult } from "../tree-core";
import { MetaParserBase, FlattenNodeWrapper } from "./FlattenNodeWrapper";
import { ReactTreeHookParams } from "./types";
import { WalkingResult } from "../tree-core/types";
import { PromiseEvent, promiseEvent } from "./promiseEvent";
import { isDev } from "../../utils/isDev";




enum IterateEvent {
    ROUND = "ROUND",
    FINISH = "FINISH",
    ABORT = "ABORT",
}

export const useReactTree = <
    T extends WalkingAdapterBase,
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
        event: undefined as any as PromiseEvent<IterateEvent>,
        expandingPaths: undefined as PropertyKey[] | undefined,
    })

    if (!runningRef.current.event) {
        runningRef.current.event = promiseEvent()
    }

    useEffect(
        () => {

            let iterate = ref.current.instance.walkingAsync(value, name, config, expandDepth, iterateSize)
            let isRunning = true

            setTimeout(async () => {

                for (let result of iterate) {

                    setWalkingResult({ ...result });

                    runningRef.current.event.emit(IterateEvent.ROUND)

                    await new Promise(r => (window.requestIdleCallback ?? window.requestAnimationFrame)(r))

                    if (!isRunning) {
                        break;
                    }

                }

                if (isRunning) {
                    runningRef.current.event.emit(IterateEvent.FINISH);
                } else {
                    runningRef.current.event.emit(IterateEvent.ABORT);
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
                    if (isDev) {
                        console.error(`Failed to get node at index ${index}:`, error);
                    }
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

            if (!ref.current.instance.expandPath(paths)) {
                let index = ref.current.instance.getIndexForPath(paths);
                if (index > -1) { return index }
            }

            runningRef.current.expandingPaths = paths;

            setReload(e => e + 1);

            let t = Date.now()

            do {

                let ev = await runningRef.current.event.wait()

                const index = ref.current.instance.getIndexForPath(paths);

                if (index > -1) { return index }

                if (runningRef.current.expandingPaths != paths) {
                    return -1;
                }

                if (ev == IterateEvent.ROUND) {
                    // console.log("Wait Round")
                    continue;
                } else if (ev == IterateEvent.ABORT) {
                    // console.log("Break")
                    return -1;
                } else {

                    if (Date.now() - t >= 2000 || runningRef.current.expandingPaths != paths) {
                        // console.log("Break")
                        return -1;
                    } else {
                        // console.log("Wait tree walking")
                    }

                    await new Promise(r => setTimeout(r, 200))
                }

            } while (true)

        },
        [ref, value, name, config, expandDepth]
    );

    const travelAndSearch = useCallback(
        (
            cb: (value: InferWalkingType<T>['Value'], key: InferWalkingType<T>['Key'], paths: InferWalkingType<T>['Key'][],) => boolean | void,
            iterateSize?: number, maxDepth?: number, fullSearch?: boolean,
            fullSearchShouldIterate?: (
                value: InferWalkingType<T>['Value'], key: InferWalkingType<T>['Key'], meta: InferWalkingType<T>['Meta'], ctx: InferWalkingType<T>['Context']
            ) => boolean
        ) => ref.current.instance.traversalAndFindPaths(
            cb,
            config,
            iterateSize, maxDepth, fullSearch, fullSearchShouldIterate
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

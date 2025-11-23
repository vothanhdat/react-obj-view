import { StateFactory, StateReadonyWrap, StateWrap } from "./utils/StateFactory"
import { WalkingContext, WalkingAdaper, WalkingResult, NodeResult } from "./types"


const iterateChildWrap = <Value, Key, Meta, Config, Context extends WalkingContext<Config>>(
    iterateChilds: WalkingAdaper<Value, Key, Meta, Config, Context>['iterateChilds'],
    walkingInternal: any,
    value: Value,
    ctx: Context,
    currentDepth: number,
    state: WalkingResult<Value, Key, Meta>,
    getChild: StateWrap<WalkingResult<Value, Key, Meta>, Key>['getChild'],
) => {

    let childCount = 1
    let childDepth = currentDepth
    let childCanExpand = false;
    let childOffsets = [childCount]
    let childKeys = [] as Key[]

    iterateChilds(
        value, ctx, state,
        (value, key, meta) => {

            let r = walkingInternal(
                value,
                key,
                meta,
                ctx,
                currentDepth + 1,
                getChild(key as any),
            )

            childCount += r.childCount
            childDepth = Math.max(childDepth, r.childDepth)
            childCanExpand ||= r.childCanExpand

            childOffsets.push(childCount)

            childKeys.push(key);

            return ctx.iterateCounter < 0;
        }
    )

    return {
        childCount,
        childDepth,
        childCanExpand,
        childOffsets,
        childKeys,
    }
}

const iterateChildWrapContinues = <Value, Key, Meta, Config, Context extends WalkingContext<Config>>(
    iterateChilds: WalkingAdaper<Value, Key, Meta, Config, Context>['iterateChilds'],
    walkingInternal: any,
    value: Value,
    ctx: Context,
    currentDepth: number,
    state: WalkingResult<Value, Key, Meta>,
    getChild: StateWrap<WalkingResult<Value, Key, Meta>, Key>['getChild'],
    touchChild: StateWrap<WalkingResult<Value, Key, Meta>, Key>['touchChild'],
) => {

    let childCount = state.childCount
    let childDepth = state.childDepth
    let childCanExpand = state.childCanExpand
    let childOffsets = state.childOffsets!
    let childKeys = state.childKeys!
    let iterateIndex = 0
    let isInCache = true


    iterateChilds(
        value, ctx, state,
        (value, key, meta) => {

            if (isInCache && iterateIndex < childKeys.length - 1) {
                touchChild(key as any);
                iterateIndex++;
                return false;
            } else if (isInCache) {
                let stateWrap = getChild(key as any);
                if (stateWrap.state.earlyReturn) {
                    isInCache = false;

                    childCount -= stateWrap.state.childCount

                    let r = walkingInternal(
                        value,
                        key,
                        meta,
                        ctx,
                        currentDepth + 1,
                        stateWrap,
                    )
                    childCount += r.childCount

                    childDepth = Math.max(childDepth, r.childDepth)
                    childCanExpand ||= r.childCanExpand

                    childOffsets[iterateIndex + 1] = childCount

                    iterateIndex++;
                    return ctx.iterateCounter < 0;

                } else {
                    iterateIndex++;
                    isInCache = false;
                    return false;
                }
            } else {
                isInCache = false;
                let r = walkingInternal(
                    value,
                    key,
                    meta,
                    ctx,
                    currentDepth + 1,
                    getChild(key as any),
                )

                childCount += r.childCount
                childDepth = Math.max(childDepth, r.childDepth)
                childCanExpand ||= r.childCanExpand

                childOffsets.push(childCount)

                childKeys.push(key);

                return ctx.iterateCounter < 0;
            }




        }
    )

    return {
        childCount,
        childDepth,
        childCanExpand,
        childOffsets,
        childKeys,
    }
}

function walkingRecursiveFactory<Value, Key, Meta, Config, Context extends WalkingContext<Config>>(
    {
        iterateChilds, valueHasChild, onEnterNode, onExitNode,
        valueDefaultExpaned,
        isValueChange,
        transformValue,
    }: WalkingAdaper<Value, Key, Meta, Config, Context>
) {

    return function walkingInternal(
        value: Value,
        key: Key,
        meta: Meta,
        ctx: Context,
        currentDepth: number,
        { state, cleanChild, getChild, touchChild }: StateWrap<WalkingResult<Value, Key, Meta>, Key>,
    ) {
        value = transformValue
            ? transformValue(value, state)
            : value;

        const hasChild = valueHasChild(value, key, meta)

        const limitByDepth = currentDepth <= ctx.expandDepth

        const defaultExpand = valueDefaultExpaned
            ? limitByDepth && valueDefaultExpaned(meta, ctx)
            : limitByDepth

        const isExpand = state.userExpand
            ?? (hasChild && defaultExpand);

        const isChange = isValueChange
            ? isValueChange(state.value, value)
            : state.value !== value

        const shoudUpdate = (
            isChange
            || state.expanded !== isExpand
            || state.updateToken !== ctx.updateToken
            || (isExpand
                && state.expandedDepth < ctx.expandDepth
                && state.childCanExpand
            )
            || (isExpand
                && state.childDepth >= ctx.expandDepth
                && state.expandedDepth > ctx.expandDepth
            )
        )

        if (shoudUpdate || !state.iterateFinish) {
            let childCount = 1;
            let childDepth = currentDepth
            let childCanExpand = hasChild && !isExpand;

            let childOffsets = undefined
            let childKeys = undefined

            if (hasChild && isExpand) {

                let iterateResult = (!shoudUpdate && state.earlyReturn) ? iterateChildWrapContinues(
                    iterateChilds,
                    walkingInternal,
                    value,
                    ctx,
                    currentDepth,
                    state,
                    getChild,
                    touchChild,
                ) : iterateChildWrap(
                    iterateChilds,
                    walkingInternal,
                    value,
                    ctx,
                    currentDepth,
                    state,
                    getChild,
                )

                // onExitNode?.(value, key, meta, ctx);

                childCount = iterateResult.childCount
                childOffsets = iterateResult.childOffsets
                childKeys = iterateResult.childKeys
                childDepth = Math.max(iterateResult.childDepth, currentDepth)
                childCanExpand ||= iterateResult.childCanExpand

            } else {
                childOffsets = undefined
            }


            cleanChild();

            state.key = key;
            state.value = value
            state.meta = meta

            state.childCount = childCount
            state.childDepth = childDepth
            state.childCanExpand = childCanExpand

            state.childKeys = childKeys;
            state.childOffsets = childOffsets

            state.expanded = isExpand
            state.expandedDepth = ctx.expandDepth
            state.updateToken = ctx.updateToken;
            state.updateStamp = ctx.updateStamp;
            state.iterateFinish = ctx.iterateCounter >= 0;
            state.earlyReturn = !state.iterateFinish;
            state.selfStamp++;
            ctx.iterateCounter--;

        }

        return state


    }
}

const unsetSymbol = Symbol()

const stateFactoryFn: () => WalkingResult<any, any, any> = () => ({
    value: unsetSymbol as any,
    key: undefined,
    childKeys: undefined,
    childOffsets: undefined,

    childCount: 0,
    childCanExpand: false,
    childDepth: 0,

    iterateFinish: false,
    earlyReturn: false,
    selfStamp: 0,

    expandedDepth: 0,
    expanded: false,
    updateToken: 0,
    updateStamp: 0,

    userExpand: undefined,

    meta: undefined,
})

export const walkingFactory = <Value, Key, Meta, Config, Context extends WalkingContext<Config>>(
    adapter: WalkingAdaper<Value, Key, Meta, Config, Context>
) => {
    const { defaultMeta, defaultContext, getConfigTokenId } = adapter;

    type WalkingResultAlias = WalkingResult<Value, Key, Meta>


    const { stateFactory, getStateOnly } = StateFactory<WalkingResultAlias, Key>(stateFactoryFn)

    let updateStamp = 0

    const rootMapState: any = {}

    const stateRoot = stateFactory(rootMapState)
    const stateRead = getStateOnly(rootMapState)

    const walkingInternal = walkingRecursiveFactory(adapter)

    const getContextDefault = (config: Config, expandDepth: number): Context => defaultContext({
        config,
        expandDepth,
        updateToken: getConfigTokenId(config),
        updateStamp: updateStamp++,
        iterateCounter: 1000000000,
    })

    const walking = (value: Value, key: Key, config: Config, expandDepth: number) => walkingInternal(
        value,
        key,
        defaultMeta(value, key),
        getContextDefault(config, expandDepth),
        1,
        stateRoot,
    )



    const walkingAsync = function* (value: Value, key: Key, config: Config, expandDepth: number, iterateSize = 100000) {

        let context = getContextDefault(config, expandDepth);

        while (true) {
            context.iterateCounter = iterateSize;

            let state = walkingInternal(
                value,
                key,
                defaultMeta(value, key),
                context,
                1,
                stateRoot,
            )

            yield state

            if (state.iterateFinish)
                return;
        }
    }

    const refreshPath = (paths: Key[]) => {
        let currentState = stateRead

        for (let path of paths) {
            if (!currentState) {
                throw new Error("State Error: Paths not inited")
            }
            currentState.state.updateToken = -1;
            currentState = currentState.getChildOnly(path as any)
        }
        currentState.state.updateToken = -1;
    }

    const toggleExpand = (paths: Key[],) => {
        let currentState = stateRead;
        for (let path of paths) {
            if (!currentState) {
                throw new Error("State Error: Paths not inited")
            }
            currentState.state.updateToken = -1;
            currentState = currentState.getChildOnly(path as any)
        }
        const currentExpand = currentState.state.userExpand
            ?? currentState.state.expanded
        currentState.state.userExpand = !currentExpand
    }

    const getNodeInternal = (
        index: number,
        { state, getChildOnly }: StateReadonyWrap<WalkingResult<Value, Key, Meta>, Key>,
        depth = 1,
        paths: Key[] = [],
        parentIndex: number[] = [0]
    ): NodeResult<Value, Key, Meta> => {

        if (index == 0 || depth >= 100) {
            return { state, depth, paths, parentIndex }
        } else {
            if (!state.childOffsets || !state.childKeys) {
                console.log("Wrong state", {
                    index,
                    paths,
                    parentIndex,
                })
                throw new Error("Wrong state")
            }

            const { childOffsets } = state;

            let start = 0, end = childOffsets.length - 1
            let c = 0

            while (start + 1 < end && c++ < 50) {
                let mid = (start + end) >> 1
                if (index >= childOffsets[mid]) {
                    start = mid
                } else {
                    end = mid
                }
            }

            let keyNames = state.childKeys![start]
            // console.log({paths: [...paths, keyNames]})

            return getNodeInternal(
                index - childOffsets[start],
                getChildOnly(keyNames as any),
                depth + 1,
                [...paths, keyNames],
                [...parentIndex, (parentIndex.at(-1) ?? 0) + childOffsets[start]]
            )


        }
    }

    const getNode = (
        index: number,
    ) => getNodeInternal(
        index,
        stateRead,
        1,
        [],
        [0]
    )

    return {
        walking,
        walkingAsync,
        refreshPath,
        toggleExpand,
        getNode,
    }

}


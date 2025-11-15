import { getObjectUniqueId } from "../V5/getObjectUniqueId"
import { GetStateFn, StateFactory } from "../V5/StateFactory"


export type WalkingResult<Value, Key, Meta = number> = {
    value?: Value,
    key?: Key,
    childKeys?: Key[],
    childOffsets?: number[],

    childCount: number,
    childCanExpand: boolean,
    childDepth: number,

    expandedDepth: number,
    expanded: boolean,
    updateToken: number,
    updateStamp: number,

    userExpand?: boolean,

    meta?: Meta,
}

type NodeResult<Value, Key, Meta = number> = {
    state: WalkingResult<Value, Key, Meta>,
    depth: number,
    paths: Key[],
    parentIndex: number[],
}

export type WalkingContext<Config> = {
    config: Config,
    updateToken: number
    expandDepth: number
    updateStamp: number
}



export type WalkingAdaper<Value, Key, Meta, Config, Context extends WalkingContext<Config>> = {
    valueHasChild: (value: Value) => boolean,
    iterateChilds: (
        value: Value, ctx: Context, stableRef: unknown,
        cb: (value: Value, key: Key, meta: Meta) => boolean,
    ) => void,
    defaultMeta: (value: Value, key: Key) => Meta,
    defaultContext: (ctx: WalkingContext<Config>) => Context,
    valueDefaultExpaned?: (value: Value, key: Key, meta: Meta, ctx: Context) => boolean,
    isValueChange?: (a: Value | undefined, b: Value | undefined) => boolean,
    transformValue?: (value: Value) => Value,
    onEnterNode?: (value: Value, key: Key, meta: Meta, ctx: Context) => void,
    onExitNode?: (value: Value, key: Key, meta: Meta, ctx: Context) => void,
}


const iterateChildWrap = <Value, Key, Meta, Config, Context extends WalkingContext<Config>>(
    iterateChilds: WalkingAdaper<Value, Key, Meta, Config, Context>['iterateChilds'],
    walkingInternal: any,
    value: Value,
    ctx: Context,
    currentDepth: number,
    state: WalkingResult<Value, Key, Meta>,
    getChild: (key: PropertyKey) => any,
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

            return false
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

function walkingRecursiveFactory<Value, Key, Meta, Config, Context extends WalkingContext<Config>>({
    iterateChilds, valueHasChild, onEnterNode, onExitNode,
    valueDefaultExpaned,
    isValueChange,
    transformValue,
}: WalkingAdaper<Value, Key, Meta, Config, Context>) {

    return function walkingInternal(
        value: Value,
        key: Key,
        meta: Meta,
        ctx: Context,
        currentDepth: number,
        { state, cleanChild, getChild }: ReturnType<GetStateFn<WalkingResult<Value, Key, Meta>>>,
    ) {
        value = transformValue
            ? transformValue(value)
            : value;

        const hasChild = valueHasChild(value)

        const limitByDepth = currentDepth <= ctx.expandDepth

        const defaultExpand = valueDefaultExpaned
            ? limitByDepth && valueDefaultExpaned(value, key, meta, ctx)
            : limitByDepth

        const isExpand = state.userExpand
            ?? (hasChild && defaultExpand);

        const isChange = isValueChange
            ? isValueChange(state.value, value)
            : state.value !== value

        const shoudUpdate = (
            isChange
            || state.expanded !== isExpand
            || (isExpand
                && state.expandedDepth < ctx.expandDepth
                && state.childCanExpand
            )
            || (isExpand
                && state.childDepth >= ctx.expandDepth
                && state.expandedDepth > ctx.expandDepth
            )
        )

        if (shoudUpdate) {
            let childCount = 1;
            let childDepth = currentDepth
            let childCanExpand = hasChild && !isExpand;

            let childOffsets = undefined
            let keys = undefined

            if (hasChild && isExpand) {

                onEnterNode?.(value, key, meta, ctx);

                let iterateResult = iterateChildWrap(
                    iterateChilds,
                    walkingInternal,
                    value,
                    ctx,
                    currentDepth,
                    state,
                    getChild,
                )

                onExitNode?.(value, key, meta, ctx);

                childCount = iterateResult.childCount
                childOffsets = iterateResult.childOffsets
                keys = iterateResult.childKeys
                childDepth = Math.max(iterateResult.childDepth, currentDepth)
                childCanExpand ||= iterateResult.childCanExpand

            } else {
                childOffsets = undefined
            }


            cleanChild?.();

            state.key = key;
            state.value = value
            state.meta = meta

            state.childCount = childCount
            state.childDepth = childDepth
            state.childCanExpand = childCanExpand

            state.childKeys = keys;
            state.childOffsets = childOffsets

            state.expanded = isExpand
            state.expandedDepth = ctx.expandDepth
            state.updateToken = ctx.updateToken;
            state.updateStamp = ctx.updateStamp;

        }

        return state


    }
}

export const walkingFactory = <Value, Key, Meta, Config, Context extends WalkingContext<Config>>(
    adapter: WalkingAdaper<Value, Key, Meta, Config, Context>
) => {
    const { defaultMeta, defaultContext } = adapter;

    type WalkingResultAlias = WalkingResult<Value, Key, Meta>

    const unsetSymbol = Symbol()

    const { stateFactory, getStateOnly } = StateFactory<WalkingResultAlias>(() => ({
        value: unsetSymbol as any,
        key: undefined,
        childKeys: undefined,
        childOffsets: undefined,

        childCount: 0,
        childCanExpand: false,
        childDepth: 0,

        expandedDepth: 0,
        expanded: false,
        updateToken: 0,
        updateStamp: 0,

        userExpand: undefined,

        meta: undefined,
    }))

    let updateStamp = 0

    const rootMapState: any = {}

    const stateRoot = stateFactory(rootMapState)
    const stateRead = getStateOnly(rootMapState)

    const walkingInternal = walkingRecursiveFactory(adapter)

    const getContextDefault = (config: Config, expandDepth: number): Context => defaultContext({
        config,
        expandDepth,
        updateToken: getObjectUniqueId(config),
        updateStamp: updateStamp++,
    })

    const walking = (value: Value, key: Key, config: Config, expandDepth: number) => walkingInternal(
        value,
        key,
        defaultMeta(value, key),
        getContextDefault(config, expandDepth),
        1,
        stateRoot,
    )

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
        { state, getChildOnly } = stateRead,
        depth = 1,
        paths: Key[] = [],
        parentIndex: number[] = [0]
    ): NodeResult<Value, Key, Meta> => {

        if (index == 0 || depth >= 100) {
            return { state, depth, paths, parentIndex }
        } else {
            if (!state.childOffsets || !state.childKeys) {
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
        refreshPath,
        toggleExpand,
        getNode,
    }

}

import { isRef } from "../utils/isRef";
import { getEntriesCb } from "./getEntries";
import { WalkingConfig } from "./types";
import { CircularChecking } from "./CircularChecking";
import { getObjectUniqueId } from "./getObjectUniqueId";
import { GetStateFn, StateFactory } from "./StateFactory";
import { LazyValue, LazyValueError } from "./LazyValueWrapper";



export type WalkingResult = {
    value: unknown,
    cumulate?: number[],
    name: PropertyKey,
    keys?: PropertyKey[],
    count: number,
    enumerable: boolean,
    maxDepth: number,
    expandedDepth: number,
    expanded: boolean,
    isCircular: boolean,
    childCanExpand: boolean,
    userExpand?: boolean,
    updateToken?: number,
    updateStamp: number,
}

export type NodeResultData = WalkingResult & { depth: number, path: string, paths: PropertyKey[] }

export class NodeResult {

    constructor(
        public state: WalkingResult,
        public depth: number,
        public paths: PropertyKey[],
    ) {
        Object.assign(this, state)
    }

    public get path(): string {
        return this.paths
            .map(e => {
                try {
                    return String(e);
                } catch (error) {
                    return "";
                }
            }).join("/");
    }

    getData(): NodeResultData {
        const state = this.state
        return ({
            value: state.value,
            cumulate: state.cumulate,
            name: state.name,
            count: state.count,
            depth: this.depth,
            enumerable: state.enumerable,
            maxDepth: state.maxDepth,
            expandedDepth: state.expandedDepth,
            expanded: state.expanded,
            isCircular: state.isCircular,
            childCanExpand: state.childCanExpand,
            userExpand: state.userExpand,
            updateToken: state.updateToken,
            updateStamp: state.updateStamp,
            path: this.path,
            paths: this.paths,
        })
    }

}

export const objectHasChild = (e: unknown) => {
    return isRef(e)
        && !(e instanceof Date)
        && !(e instanceof RegExp)
        && !(e instanceof LazyValue)
}

const getEntriesCbBinded = (
    //@ts-ignore
    value, config, walking, updateToken, depth, getChild,
    //@ts-ignore
    count, maxDepth, childCanExpand, cumulate, keys, state,
) => {


    getEntriesCb(
        value, config, false,
        state,
        (key, value, enumerable) => {
            const result = walking(
                value, config, key, enumerable,
                updateToken,
                depth + 1,
                getChild(key),
            );

            count += result.count;
            maxDepth = Math.max(maxDepth, result.maxDepth)
            childCanExpand ||= result.childCanExpand;
            cumulate.push(count)
            keys.push(key)
        }
    )

    return { count, maxDepth, childCanExpand }
}

const getUpdateToken = (config: WalkingConfig) => {
    return (
        (config.nonEnumerable ? 0 : 1)
        | (getObjectUniqueId(config.resolver) << 1)
    )
}

export const walkingToIndexFactory = () => {

    let updateStamp = 0

    const { stateFactory, getStateOnly } = StateFactory<WalkingResult>(() => ({
        value: undefined,
        count: 0,
        name: "",
        maxDepth: 0,
        expandedDepth: 0,
        enumerable: false,
        childCanExpand: false,
        expanded: false,
        isCircular: false,
        updateStamp,
    }))

    const rootMapState: any = {}

    const stateRoot = stateFactory(rootMapState)
    const stateRead = getStateOnly(rootMapState)

    const cirularChecking = new CircularChecking()

    const walkingInternal = (
        _value: unknown,
        config: WalkingConfig,
        name: PropertyKey,
        enumerable: boolean,
        updateToken: number,
        depth: number,
        { state, cleanChild, getChild }: ReturnType<GetStateFn<WalkingResult>>,
    ): WalkingResult => {

        let value = _value instanceof LazyValue && _value.inited
            ? _value.value ?? _value.error
            : _value;

        let count = 1;
        let maxDepth = depth
        let hasChild = objectHasChild(value)
        let isCircular = cirularChecking.checkCircular(value)
        let canExpand = hasChild && !isCircular
        let defaultExpanded = enumerable && depth <= config.expandDepth
        let isExpand = canExpand && (state.userExpand ?? defaultExpanded)
        let childCanExpand = canExpand && !isExpand;


        let shoudUpdate = (
            state.value !== value
            || state.expanded != isExpand
            || state.updateToken != updateToken
            || (isExpand
                && state.expandedDepth < config.expandDepth
                && state.childCanExpand
            ) || (isExpand
                && state.maxDepth >= config.expandDepth
                && state.expandedDepth > config.expandDepth
            )
        )

        if (shoudUpdate) {

            // console.group(name)
            // console.log(value)

            let cumulate = undefined
            let keys = undefined

            if (hasChild && isExpand && !isCircular) {
                cumulate = [count]
                keys = [] as PropertyKey[]

                cirularChecking.enterNode(value);

                let r = getEntriesCbBinded(
                    value, config, walkingInternal, updateToken, depth, getChild,
                    count, maxDepth, childCanExpand,
                    cumulate, keys, state,
                );

                count = r.count
                maxDepth = r.maxDepth
                childCanExpand = r.childCanExpand

                cirularChecking.exitNode(value)

            }

            state.name = name;
            state.value = value
            state.enumerable = enumerable

            state.count = count
            state.maxDepth = maxDepth
            state.childCanExpand = childCanExpand

            state.keys = keys;
            state.cumulate = cumulate

            state.expanded = isExpand
            state.expandedDepth = config.expandDepth
            state.isCircular = isCircular
            state.updateToken = updateToken;
            state.updateStamp = updateStamp;

            cleanChild()

            // console.groupEnd()


            return state
        } else {
            return state
        }

    }

    const walking = (
        value: unknown,
        config: WalkingConfig,
        name: PropertyKey,
        enumerable: boolean,
    ) => {
        updateStamp++;
        return walkingInternal(
            value,
            config,
            name,
            enumerable,
            getUpdateToken(config),
            1,
            stateRoot,
        )
        // return rest
    }


    const getNode = (
        index: number,
        config: WalkingConfig,
        { state, getChildOnly } = stateRead,
        depth = 1,
        paths: PropertyKey[] = [],
    ): NodeResult => {

        if (index == 0 || depth >= 100) {
            return new NodeResult(state, depth, paths)
        } else {
            if (!state.cumulate || !state.keys) {
                throw new Error("Wrong state")
            }
            const { cumulate, value } = state;

            let start = 0, end = cumulate.length - 1
            let c = 0

            while (start + 1 < end && c++ < 50) {
                let mid = (start + end) >> 1
                if (index >= cumulate[mid]) {
                    start = mid
                } else {
                    end = mid
                }
            }

            let keyNames = state.keys[start]

            return getNode(
                index - cumulate[start],
                config,
                getChildOnly(keyNames),
                depth + 1,
                [...paths, keyNames]
            )


        }
    }

    const refreshPath = (paths: PropertyKey[],) => {
        let currentState = stateRead
        for (let path of paths) {
            if (!currentState) {
                throw new Error("State Error: Paths not inited")
            }
            currentState.state.updateToken = -1;
            currentState = currentState.getChildOnly(path)
        }
        currentState.state.updateToken = -1;
    }

    const toggleExpand = (
        paths: PropertyKey[],
        config: WalkingConfig,
        currentState = stateRead,
    ) => {

        for (let path of paths) {
            if (!currentState) {
                throw new Error("State Error: Paths not inited")
            }
            currentState.state.updateToken = -1;
            currentState = currentState.getChildOnly(path)
        }
        const currentExpand = currentState.state.userExpand
            ?? currentState.state.expanded

        currentState.state.userExpand = !currentExpand
    }

    return {
        walking,
        getNode,
        toggleExpand,
        refreshPath,
    }
}

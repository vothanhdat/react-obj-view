import { isRef } from "../utils/isRef";
import { getEntries } from "../V3/getEntries";
import { WalkingConfig } from "../V3/NodeData"
import { CircularChecking } from "../V4/CircularChecking";
import { getObjectUniqueId } from "../V4/getObjectUniqueId";
import { GetStateFn, StateFactory } from "./StateFactory";



export type WalkingResult = {
    value: unknown,
    cumulate: number[],
    name: PropertyKey,
    keys: PropertyKey[],
    count: number,
    enumerable: boolean,
    maxDepth: number,
    expandedDepth: number,
    expanded: boolean,
    isCircular: boolean,
    childCanExpand: boolean,
    userExpand?: boolean,
    updateToken?: number,
}

// export type NodeResult = {
//     state: WalkingResult,
//     depth: number,
//     paths: PropertyKey[],
// }

export class NodeResult implements WalkingResult {
    value!: unknown
    cumulate!: number[]
    name!: PropertyKey
    keys!: PropertyKey[]
    count!: number
    enumerable!: boolean
    maxDepth!: number
    expandedDepth!: number
    expanded!: boolean
    isCircular!: boolean
    childCanExpand!: boolean
    userExpand?: boolean
    updateToken?: number

    constructor(
        state: WalkingResult,
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
            }).join(".");
    }

}

const objectHasChild = (e: unknown) => {
    return isRef(e) && !(e instanceof Date)
}


export const walkingToIndexFactory = () => {


    const { stateFactory, getStateOnly } = StateFactory<WalkingResult>(() => ({
        value: undefined,
        count: 0,
        cumulate: [],
        keys: [],
        name: "",
        maxDepth: 0,
        expandedDepth: 0,
        enumerable: false,
        childCanExpand: false,
        expanded: false,
        isCircular: false,
    }))

    const rootMapState: any = new Map<any, any>()

    const stateRoot = stateFactory(rootMapState)
    const stateRead = getStateOnly(rootMapState)

    const cirularChecking = new CircularChecking()

    const getUpdateToken = (config: WalkingConfig) => {
        return (
            (config.nonEnumerable ? 0 : 1)
            | (getObjectUniqueId(config.resolver) << 1)
        )
    }




    const walking = (
        value: unknown,
        config: WalkingConfig,
        name: PropertyKey,
        enumerable: boolean,
        updateToken = getUpdateToken(config),
        depth = 1,
        { state, cleanChild, getChild }: ReturnType<GetStateFn<WalkingResult>> = stateRoot,
    ): WalkingResult => {

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


            let cumulate = [count];
            let keys = []


            if (hasChild && isExpand) {

                isCircular || cirularChecking.enterNode(value)

                for (let entry of getEntries(value, config)) {

                    const { key, value, enumerable } = entry

                    const result = walking(
                        value, config, key, enumerable,
                        updateToken,
                        depth + 1,
                        getChild(key),
                    );

                    count += result.count;
                    maxDepth = Math.max(maxDepth, result.maxDepth)
                    childCanExpand ||= result.childCanExpand;
                    keys.push(key)
                    cumulate.push(count);

                }

                isCircular || cirularChecking.exitNode(value)

            }


            state.count = count
            state.cumulate = cumulate
            state.value = value
            state.enumerable = enumerable
            state.maxDepth = maxDepth
            state.childCanExpand = childCanExpand
            state.expanded = isExpand
            state.expandedDepth = config.expandDepth
            state.isCircular = isCircular
            state.name = name;
            state.keys = keys;
            state.updateToken = updateToken;

            cleanChild()

            return state
        } else {
            return state
        }

    }


    const getNode = (
        index: number,
        config: WalkingConfig,
        { state, getChildOnly } = stateRead,
        depth = 1,
        paths: PropertyKey[] = [],
    ): NodeResult => {

        if (index == 0 || depth >= 100) {
            return new NodeResult(
                state,
                depth,
                paths,
            )
        } else {
            const { cumulate, value } = state;

            let start = 0, end = cumulate.length - 1
            let c = 0

            while (start + 1 < end && c++ < 50) {
                let mid = ((start + end) >> 1);
                if (index >= cumulate[mid]) {
                    start = mid
                } else {
                    end = mid
                }
            }


            // let keyNames = getEntries(value, config).drop(start).next()?.value?.key!

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


    const toggleExpand = (
        paths: PropertyKey[],
        config: WalkingConfig,
        { state, getChildOnly } = stateRead,
    ) => {
        console.log(paths)
        state.updateToken = -1;
        if (paths.length == 0) {
            const currentExpand = state.userExpand ?? state.expanded
            state.userExpand = !currentExpand
        } else {
            toggleExpand(
                paths.slice(1),
                config,
                getChildOnly(paths.at(0)!)
            )
        }
    }

    return {
        walking,
        getNode,
        toggleExpand,
    }
}

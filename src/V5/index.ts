import { isRef } from "../utils/isRef";
import { memorizeMapWithWithClean } from "../utils/memorizeMapWithWithClean";
import { getEntries } from "../V3/getEntries";
import { WalkingConfig } from "../V3/NodeData"
import { CircularChecking } from "../V4/CircularChecking";
import { getObjectUniqueId } from "../V4/getObjectUniqueId";
import { StateGetterV2 } from "../V4/types";
import { GetStateFn, StateFactory } from "./StateFactory";



export type WalkingResult = {
    value: unknown,
    cumulate: number[],
    name: PropertyKey,
    keys: PropertyKey[],
    count: number,
    enumerable: boolean,
    maxDepth: number,
    isExpand: boolean,
    isCircular: boolean,
    childCanExpand: boolean,
    userExpand?: boolean,
    updateToken?: number,
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
        enumerable: false,
        childCanExpand: false,
        isExpand: false,
        isCircular: false,
    }))

    const stateRoot = stateFactory()
    const stateRead = getStateOnly()

    const cirularChecking = new CircularChecking()

    const shouldUpdate = (state: WalkingResult, config: WalkingConfig, value: unknown) => {
        if (state.value !== value)
            return true
        return false
    }

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
        depth = 0,
        //@ts-ignore
        { state, cleanChild, getChild }: GetStateFn<WalkingResult> = stateRoot,
    ): WalkingResult => {

        if (shouldUpdate(state, config, value)) {


            let count = 1;
            let cumulate = [count];
            let keys = []
            let maxDepth = depth
            let childCanExpand = false;
            let hasChild = objectHasChild(value)
            let canExpand = hasChild
            let defaultExpanded = enumerable && depth <= config.expandDepth
            let isExpand = canExpand && (state.userExpand ?? defaultExpanded)
            let isCircular = cirularChecking.checkCircular(value)

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
            state.isExpand = isExpand
            state.isCircular = isCircular
            state.name = name;
            state.keys = keys;

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
        depth = 0
    ) => {

        if (index == 0 || depth >= 20) {
            return {
                name: state.name,
                value: String(state.value)
                    .slice(0, 20)?.split("\n")
                    .at(0),
                depth,
                state,
            }
        } else {
            const { cumulate } = state;

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

            let keyNames = state.keys[start]

            return getNode(
                index - cumulate[start],
                config,
                //@ts-ignore
                getChildOnly(keyNames),
                depth + 1,
            )


        }
    }

    return {
        walking,
        getNode,
    }
}

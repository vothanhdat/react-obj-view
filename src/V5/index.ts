import { isRef } from "../utils/isRef";
import { memorizeMapWithWithClean } from "../utils/memorizeMapWithWithClean";
import { getEntries } from "../V3/getEntries";
import { WalkingConfig } from "../V3/NodeData"
import { CircularChecking } from "../V4/CircularChecking";
import { getObjectUniqueId } from "../V4/getObjectUniqueId";
import { StateGetterV2 } from "../V4/types";
import { StateFactory } from "./StateFactory";





export type WalkingResult = {
    value: unknown,
    cumulate: number[],
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


    const stateRoot = StateFactory(() => ({
        value: undefined,
        count: 0,
        cumulate: [],
        maxDepth: 0,
        enumerable: false,
        childCanExpand: false,
        isExpand: false,
        isCircular: false,

    } as WalkingResult))()

    const cirularChecking = new CircularChecking()

    const shouldUpdate = (state: WalkingResult, config: WalkingConfig, value: unknown) => {
        if (state.value != value)
            return true
        return false
    }

    let getUpdateToken = (config: WalkingConfig) => {
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
        { state, cleanChild, getChild } = stateRoot,
    ): WalkingResult => {

        if (shouldUpdate(state, config, value)) {


            let count = 1;
            let cumulate = [count];
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

            cleanChild()

            return state
        } else {
            return state
        }

    }


    return {
        walking
    }
}

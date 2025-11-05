import { isRef } from "../utils/isRef";
import { memorizeMapWithWithClean } from "../utils/memorizeMapWithWithClean";
import { getEntries } from "../V3/getEntries";
import { WalkingConfig } from "../V3/NodeData"
import { StateGetterV2 } from "../V4/types";
import { StateFactory } from "./StateFactory";





export type WalkingResult = {
    count: number,
    value: unknown,
    cumulate: number[],
    enumerable: boolean
}

export const walkingToIndexFactory = () => {


    const getStateRoot = StateFactory(() => ({
        count: 0,
        cumulate: [],
        value: undefined,
        enumerable: false
    } as WalkingResult))

    const hasChild = (e: unknown) => {
        return isRef(e) && !(e instanceof Date)
    }

    const shouldUpdate = (state: WalkingResult, config: WalkingConfig, value: unknown) => {
        if (state.value != value)
            return true
        return false
    }

    const walking = (
        value: unknown,
        config: WalkingConfig,
        name: PropertyKey,
        enumerable: boolean,
        depth = 0,
        { state, cleanChild, getChild } = getStateRoot(),
    ): WalkingResult => {
        if (shouldUpdate(state, config, value)) {
            let count = 1;
            let cumulate = [count];

            if (hasChild(value)) {

                for (let entry of getEntries(value, config)) {
                    const { key, value, enumerable } = entry

                    const result = walking(
                        value, config, key, enumerable, depth + 1,
                        getChild(key),
                    );

                    count += result.count;

                    cumulate.push(count);
                }
            }

            cleanChild()

            state.count = count
            state.cumulate = cumulate
            state.value = value
            state.enumerable = enumerable

            return state
        } else {
            return state
        }

    }


    return {
        walking
    }
}

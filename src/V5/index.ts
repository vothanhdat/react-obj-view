import { isRef } from "../utils/isRef";
import { memorizeMapWithWithClean } from "../utils/memorizeMapWithWithClean";
import { getEntries } from "../V3/getEntries";
import { WalkingConfig } from "../V3/NodeData"
import { StateGetterV2 } from "../V4/types";





export type WalkingResult = {
    count: number,
    cumulate: number[],
    value: unknown,
}

const StateFactory = <T>(onNew: () => T) => {

    const stateSymbol = Symbol()
    const rootMap: Map<any, any> & { [stateSymbol]: T } = new Map() as any

    const getState = (currentMap: typeof rootMap = rootMap) => {

        const state = currentMap[stateSymbol] ||= onNew()

        const touchedKeys = new Set<PropertyKey>();

        let hasNewKey = false;

        const getChild = (key: PropertyKey) => {
            touchedKeys.add(key);
            let map = currentMap.get(key);
            if (!map) {
                map = new Map()
                currentMap.set(key, map);
                hasNewKey = true;
            }
            return getState(map)
        }

        const cleanChild = () => {
            if (!hasNewKey && touchedKeys.size === currentMap.size) {
                // fully reused, no pruning needed
            } else {
                for (const key of currentMap.keys()) {
                    if (!touchedKeys.has(key)) {
                        currentMap.delete(key);
                    }
                }
            }
            hasNewKey = false;
            touchedKeys.clear()
        }

        return {
            state,
            getChild, cleanChild
        }
    }

    return getState

}

export const walkingToIndexFactory = () => {


    const getStateRoot = StateFactory(() => ({
        count: 0,
        cumulate: [],
        value: undefined
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
                        value, config, key, depth + 1,
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

            return state
        } else {
            return state
        }

    }


    return {
        walking
    }
}

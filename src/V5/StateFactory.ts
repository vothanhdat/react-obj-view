
type StateDiff = { touchedValue: any, isDiff: boolean }

type StateMap<T> = {
    state: T;
    touched: number,
    childs: Map<PropertyKey, StateMap<T>>
}

let touchedCounter = 1

export type GetStateFn<T> = (currentMap: StateMap<T>) => {
    state: T;
    getChild: (key: PropertyKey) => any;
    cleanChild: () => void;
}

export type GetStateOnlyFn<T> = (map: StateMap<T>) => ({
    state: T
    getChildOnly: (key: PropertyKey) => any
})


const getChildFn = <T>(
    getState: GetStateFn<T>,
    currentMap: StateMap<T>,
    state: StateDiff
) => (key: PropertyKey) => {

    if (!currentMap.childs) {
        currentMap.childs = new Map()
    }

    let childMap = currentMap.childs.get(key)!;

    if (!childMap) {
        childMap = { state: undefined, touched: undefined, childs: undefined } as any as StateMap<T>;
        currentMap.childs.set(key, childMap);
    }

    state.isDiff ||= (childMap.touched !== state.touchedValue);

    childMap.touched = state.touchedValue;

    return getState(childMap);
};

const cleanChildFn = <T>(
    currentMap: StateMap<T>,
    state: StateDiff
) => () => {
    if (!state.isDiff) {
        return;
    }
    let touchedValue = state.touchedValue
    let map = currentMap.childs
    for (const [key, value] of map) {

        if (value.touched !== touchedValue) {
            map.delete(key);
        }
    }
    state.isDiff = false;
    state.touchedValue = touchedCounter++;
};

const getChildOnly = <T>(
    getState: GetStateOnlyFn<T>,
    currentMap: StateMap<T>,
) => (key: PropertyKey) => {
    return getState(currentMap.childs.get(key)!)
}



export const StateFactory = <T>(onNew: () => T) => {

    const stateFactory: GetStateFn<T> = (currentMap: StateMap<T>) => {
        if (!currentMap) {
            throw new Error("currentMap not found")
        }
        const state: StateDiff = { isDiff: false, touchedValue: touchedCounter++ }
        return {
            state: currentMap.state ||= onNew(),
            getChild: getChildFn(stateFactory, currentMap, state),
            cleanChild: cleanChildFn(currentMap, state),
        };
    };

    const getStateOnly: GetStateOnlyFn<T> = (currentMap: StateMap<T>) => {
        if (!currentMap) {
            throw new Error("currentMap not found")
        }
        return {
            state: currentMap.state,
            getChildOnly: getChildOnly(getStateOnly, currentMap)
        }
    }

    return {
        stateFactory: stateFactory as GetStateFn<T>,
        getStateOnly: getStateOnly as GetStateOnlyFn<T>,
    }

};

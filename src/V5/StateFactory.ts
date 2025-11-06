export const stateSymbol = Symbol("state");
export const touchedSymbol = Symbol("touched");
export const mapSymbol = Symbol("touched");


type StateDiff = { touchedValue: any, isDiff: boolean }

type StateMap<T> = {
    [stateSymbol]: T;
    [touchedSymbol]: number,
    [mapSymbol]: Map<PropertyKey, StateMap<T>>
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

    if (!currentMap[mapSymbol]) {
        currentMap[mapSymbol] = new Map()
    }

    let childMap = currentMap[mapSymbol].get(key)!;

    if (!childMap) {
        childMap = {} as any as StateMap<T>;
        currentMap[mapSymbol].set(key, childMap);
    }

    state.isDiff ||= (childMap[touchedSymbol] !== state.touchedValue);

    childMap[touchedSymbol] = state.touchedValue;

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
    let map = currentMap[mapSymbol]
    for (const [key, value] of map) {

        if (value[touchedSymbol] !== touchedValue) {
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
    return getState(currentMap[mapSymbol].get(key)!)
}



export const StateFactory = <T>(onNew: () => T) => {

    const stateFactory: GetStateFn<T> = (currentMap: StateMap<T>) => {
        if (!currentMap) {
            throw new Error("currentMap not found")
        }
        const state: StateDiff = { isDiff: false, touchedValue: touchedCounter++ }
        return {
            state: currentMap[stateSymbol] ||= onNew(),
            getChild: getChildFn(stateFactory, currentMap, state),
            cleanChild: cleanChildFn(currentMap, state),
        };
    };

    const getStateOnly: GetStateOnlyFn<T> = (currentMap: StateMap<T>) => {
        if (!currentMap) {
            throw new Error("currentMap not found")
        }
        return {
            state: currentMap[stateSymbol],
            getChildOnly: getChildOnly(getStateOnly, currentMap)
        }
    }

    return {
        stateFactory: stateFactory as GetStateFn<T>,
        getStateOnly: getStateOnly as GetStateOnlyFn<T>,
    }

};

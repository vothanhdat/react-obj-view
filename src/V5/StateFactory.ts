export const stateSymbol = Symbol("state");
export const touchedSymbol = Symbol("touched");


type StateDiff = { touchedValue: any, isDiff: boolean }

type StateMap<T> = Map<PropertyKey, StateMap<T>> & {
    [stateSymbol]: T;
    [touchedSymbol]: number
}

export type GetStateFn<T> = (map?: StateMap<T>) => ({
    state: T
    getChild: (key: PropertyKey) => GetStateFn<T>
    cleanChild: () => void
})

export type GetStateOnlyFn<T> = (map?: StateMap<T>) => ({
    state: T
    getChildOnly: (key: PropertyKey) => GetStateOnlyFn<T>
})


const getChild = <T>(
    getState: GetStateFn<T>,
    currentMap: StateMap<T>,
    state: StateDiff
) => (key: PropertyKey) => {

    let map = currentMap.get(key)!;

    if (!map) {
        map = (new Map()) as any as StateMap<T>;
        currentMap.set(key, map);
    }

    state.isDiff ||= (map[touchedSymbol] !== state.touchedValue);

    map[touchedSymbol] = state.touchedValue;

    return getState(map);
};

const cleanChild = <T>(
    currentMap: StateMap<T>,
    state: StateDiff
) => () => {

    if (!state.isDiff) {
        return;
    }
    let touchedValue = state.touchedValue
    for (const [key, value] of currentMap.entries()) {
        if (value[touchedSymbol] !== touchedValue) {
            currentMap.delete(key);
        }
    }
    state.isDiff = false;
    state.touchedValue = Math.random()
};

const getChildOnly = <T>(
    getState: GetStateOnlyFn<T>,
    currentMap: StateMap<T>,
) => (key: PropertyKey) => {
    // console.log(key)
    return getState(currentMap.get(key)!)
}



export const StateFactory = <T>(onNew: () => T) => {

    const rootMap: StateMap<T> = new Map() as any;

    //@ts-ignore
    const stateFactory: GetStateFn<T> = (currentMap: StateMap<T> = rootMap) => {
        if (!currentMap) {
            throw new Error("currentMap not found")
        }
        const state: StateDiff = { isDiff: false, touchedValue: Math.random() }
        return {
            state: currentMap[stateSymbol] ||= onNew(),
            getChild: getChild(stateFactory, currentMap, state),
            cleanChild: cleanChild(currentMap, state),
            // getState: getStateOnly(getState, currentMap),
        };
    };

    //@ts-ignore
    const getStateOnly: GetStateOnlyFn<T> = (currentMap: StateMap<T> = rootMap) => {
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

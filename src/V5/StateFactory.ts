export const stateSymbol = Symbol("state");
export const touchedSymbol = Symbol("touched");


type StateDiff = { touchedValue: any, isDiff: boolean }

type StateMap<T> = Map<any, any> & {
    [stateSymbol]: T;
    [touchedSymbol]: number
}

type GetState<T> = (map: StateMap<T>) => ({
    state: T
    getChild: (key: PropertyKey) => GetState<T>
    cleanChild: () => void
})

const getChild = <T>(
    getState: GetState<T>,
    currentMap: StateMap<T>,
    state: StateDiff
) => (key: PropertyKey) => {

    let map = currentMap.get(key);

    if (!map) {
        map = new Map();
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


export const StateFactory = <T>(onNew: () => T) => {

    const rootMap: Map<any, any> & {
        [stateSymbol]: T;
        [touchedSymbol]: number
    } = new Map() as any;


    //@ts-ignore
    const getState: GetState<T> = (currentMap: StateMap<T> = rootMap) => {
        if (!currentMap) {
            throw new Error("currentMap not found")
        }
        const state: StateDiff = { isDiff: false, touchedValue: Math.random() }
        return {
            state: currentMap[stateSymbol] ||= onNew(),
            getChild: getChild(getState, currentMap, state),
            cleanChild: cleanChild(currentMap, state),
        };
    };

    return getState as GetState<T>;

};

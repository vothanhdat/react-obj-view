

type StateMap<T, Key> = {
    state: T;
    touched: number,
    childs: Map<Key, StateMap<T, Key>>
}

export type StateWrap<T, Key> = {
    state: T;
    getChild: (key: Key) => StateWrap<T, Key>;
    cleanChild: () => void;
}

export type StateReadonyWrap<T, Key> = {
    state: T;
    getChildOnly: (key: Key) => StateReadonyWrap<T, Key>;
}


export type GetStateFn<T, Key> = (currentMap: StateMap<T, Key>) => StateWrap<T, Key>

export type GetStateOnlyFn<T, Key> = (map: StateMap<T, Key>) => StateReadonyWrap<T, Key>


const getChildFn = <T, Key>(
    getState: GetStateFn<T, Key>,
    currentMap: StateMap<T, Key>,
    touchToken: any
) => (key: Key) => {

    if (!currentMap.childs) {
        currentMap.childs = new Map()
    }

    let childMap = currentMap.childs.get(key)!;

    if (!childMap) {
        childMap = { state: undefined, touched: touchToken, childs: undefined } as any as StateMap<T, Key>;
        currentMap.childs.set(key, childMap);
    } else {
        childMap.touched = touchToken;
    }

    return getState(childMap);
};

const cleanChildFn = <T, Key>(
    currentMap: StateMap<T, Key>,
    touchToken: any,
) => () => {
    let map = currentMap.childs
    if (!map) return;
    for (const [key, value] of map) {
        if (value.touched !== touchToken) {
            map.delete(key);
        }
    }
};

const voidFn = () => { }

const getChildOnly = <T, Key>(
    getState: GetStateOnlyFn<T, Key>,
    currentMap: StateMap<T, Key>,
) => (key: Key) => {
    return getState(currentMap.childs.get(key)!)
}



export const StateFactory = <T, Key>(onNew: () => T) => {

    let touchTokenCounter = 1

    const stateFactory: GetStateFn<T, Key> = (currentMap: StateMap<T, Key>) => {
        if (!currentMap) {
            throw new Error("currentMap not found")
        }
        const touchToken = touchTokenCounter++;
        const isNew = !currentMap.state
        return {
            state: currentMap.state ||= onNew(),
            getChild: getChildFn(stateFactory, currentMap, touchToken),
            cleanChild: isNew ? voidFn : cleanChildFn(currentMap, touchToken),
        };
    };

    const getStateOnly: GetStateOnlyFn<T, Key> = (currentMap: StateMap<T, Key>) => {
        if (!currentMap) {
            throw new Error("currentMap not found")
        }
        return {
            state: currentMap.state,
            getChildOnly: getChildOnly(getStateOnly, currentMap)
        }
    }

    return {
        stateFactory: stateFactory as GetStateFn<T, Key>,
        getStateOnly: getStateOnly as GetStateOnlyFn<T, Key>,
    }

};

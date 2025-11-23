

type StateMap<T, Key> = {
    state: T;
    touched: number,
    childs: Map<Key, StateMap<T, Key>>
}

export type StateWrap<T, Key> = {
    state: T;
    getChild: (key: Key) => StateWrap<T, Key>;
    touchChild: (key: Key) => void;
    cleanChild: () => void;
}

export type StateReadonyWrap<T, Key> = {
    state: T;
    getChildOnly: (key: Key) => StateReadonyWrap<T, Key>;
}





const getChildFn = <T, Key>(
    getState: (currentMap: StateMap<T, Key>) => StateWrap<T, Key>,
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

const touchChildOnlyFn = <T, Key>(
    currentMap: StateMap<T, Key>,
    touchToken: any
) => (key: Key) => {
    let childMap = currentMap.childs.get(key)!;
    childMap.touched = touchToken;
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
    getState: (map: StateMap<T, Key>) => StateReadonyWrap<T, Key>,
    currentMap: StateMap<T, Key>,
) => (key: Key) => {
    return getState(currentMap.childs.get(key)!)
}



export const StateFactory = <T, Key>(onNew: () => T) => {

    let touchTokenCounter = 1

    const stateFactory = (currentMap: StateMap<T, Key>): StateWrap<T, Key> => {
        if (!currentMap) {
            throw new Error("currentMap not found")
        }
        const touchToken = touchTokenCounter++;
        const isNew = !currentMap.state
        return {
            state: currentMap.state ||= onNew(),
            getChild: getChildFn(stateFactory, currentMap, touchToken),
            touchChild: touchChildOnlyFn(currentMap,touchToken),
            cleanChild: isNew ? voidFn : cleanChildFn(currentMap, touchToken),
        };
    };

    const getStateOnly = (currentMap: StateMap<T, Key>): StateReadonyWrap<T, Key> => {
        if (!currentMap) {
            throw new Error("currentMap not found")
        }
        return {
            state: currentMap.state,
            getChildOnly: getChildOnly(getStateOnly, currentMap)
        }
    }

    return {
        stateFactory,
        getStateOnly,
    }

};

export const stateSymbol = Symbol("state");
export const touchedSymbol = Symbol("touched");

export const StateFactory = <T>(onNew: () => T) => {

    const rootMap: Map<any, any> & {
        [stateSymbol]: T;
        [touchedSymbol]: number
    } = new Map() as any;

    const getState = (currentMap: typeof rootMap = rootMap) => {

        const state = currentMap[stateSymbol] ||= onNew();

        let touchedValue = Date.now()
        let isDiff = false

        const getChild = (key: PropertyKey) => {
            let map = currentMap.get(key);

            if (!map) {
                map = new Map();
                currentMap.set(key, map);
                isDiff = true;
            }

            isDiff ||= (map[touchedSymbol] != touchedValue);

            map[touchedSymbol] = touchedValue;

            return getState(map);
        };

        const cleanChild = () => {

            if (!isDiff) {
                return;
            }

            for (const [key, value] of currentMap.entries()) {
                if (value[touchedSymbol] !== touchedValue) {
                    currentMap.delete(key);
                }

            }
            isDiff = false;
            touchedValue = Math.random()
        };

        return {
            state,
            getChild,
            cleanChild,
        };
    };

    return getState;

};

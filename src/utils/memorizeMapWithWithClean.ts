


export const memorizeMapWithWithClean = <T extends (...param: any[]) => any>(
    onNewEl: T
) => {
    const rootMap = new Map()
    const resultSymbol = Symbol("result")


    return (...params: any[]) => {

        let current = rootMap,
            parent = rootMap,
            lastParam = undefined,
            newMap = new Map(),
            cleaned: boolean = false;

        for (let param of ['@', ...params]) {
            if (!current.has(param))
                current.set(param, new Map());
            parent = current;
            lastParam = param;
            current = current.get(param)
        }

        if (!current || (parent == current)) {
            throw new Error("memorizeMapWithWithClean unexpected error")
        }

        return {
            get(key: any) {
                if (cleaned) {
                    throw new Error("memorizeMapWithWithClean cleaned")
                }
                let currentMap: Map<any, any> = undefined as never;

                if (newMap.has(key)) {
                    currentMap = newMap.get(key)
                } else if (current.has(key)) {
                    currentMap = current.get(key)
                    newMap.set(key, currentMap)
                } else {
                    currentMap = new Map()
                    newMap.set(key, currentMap)
                    current.set(key, currentMap)
                }

                if (!currentMap.has(resultSymbol)) {
                    currentMap.set(resultSymbol, onNewEl(...params, key))
                }

                return currentMap.get(resultSymbol)
            },
            clean() {
                let d = current.size - newMap.size
                d >= 100 && console.log("CLEAN size %s => %s", current.size, newMap.size);
                if (!newMap.has(resultSymbol) && current.has(resultSymbol)) {
                    newMap.set(resultSymbol, current.get(resultSymbol))
                }
                parent.set(lastParam, newMap);
                cleaned = true;
                //@ts-ignore
                current = null;
                //@ts-ignore
                parent = null;
            }
        }
    }
}
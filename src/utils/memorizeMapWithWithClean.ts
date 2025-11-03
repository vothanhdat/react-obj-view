


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
            parent = current;
            lastParam = param;
            
            if (!current.has(param))
                current.set(param, new Map());
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

                //@ts-ignore
                return (currentMap[resultSymbol] ||= onNewEl(...params, key))

            },
            clean() {
                let d = current.size - newMap.size
                d >= 100 && console.log("CLEAN size %s => %s", current.size, newMap.size);
                //@ts-ignore
                if (!newMap[resultSymbol] && current[resultSymbol]) {
                    //@ts-ignore
                    newMap[resultSymbol] = current[resultSymbol]
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



export const memorizeMapWithWithClean = <T extends (...param: any[]) => any>(
    onNewEl: T
) => {
    const rootMap = new Map<any, any>();
    const resultSymbol = Symbol("result")


    return (...params: any[]) => {

        let current: Map<any, any> = rootMap,
            parent: Map<any, any> = rootMap,
            lastParam: any = undefined,
            cleaned = false;

        const touchedKeys = new Set<any>();
        let hasNewKey = false;

        for (let param of ['@', ...params]) {
            parent = current;
            lastParam = param;
            
            if (!current.has(param))
                current.set(param, new Map<any, any>());
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

                touchedKeys.add(key);

                let currentMap = current.get(key);

                if (!currentMap) {
                    currentMap = new Map<any, any>();
                    current.set(key, currentMap);
                    hasNewKey = true;
                }

                //@ts-ignore
                return (currentMap[resultSymbol] ||= onNewEl(...params, key))

            },
            clean() {
                if (cleaned) {
                    return;
                }
                let deleted = 0;

                if (!hasNewKey && touchedKeys.size === current.size) {
                    // fully reused, no pruning needed
                } else {
                    for (const key of current.keys()) {
                        if (!touchedKeys.has(key)) {
                            current.delete(key);
                            deleted++;
                        }
                    }
                }

                deleted >= 100 && console.log("CLEAN delete %s current size %s", deleted, current.size);

                if (current.size === 0 && !Object.prototype.hasOwnProperty.call(current, resultSymbol)) {
                    parent.delete(lastParam);
                }

                cleaned = true;
                //@ts-ignore
                current = null;
                //@ts-ignore
                parent = null;
            }
        }
    }
}

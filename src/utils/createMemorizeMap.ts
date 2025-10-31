



export const createMemorizeMap = <T extends (...param: any[]) => any>(
    onNewEl: T
) => {
    const rootMap = new Map()
    const resultSymbol = Symbol("result")

    const fn = ((...params: any) => {
        let current = rootMap;
        for (let param of params) {
            if (!current.has(param))
                current.set(param, new Map());
            current = current.get(param)
        }

        if (!current.has(resultSymbol))
            current.set(resultSymbol, onNewEl(...params));

        return current.get(resultSymbol)

    }) as T & { checkUnusedKeyAndDeletes: (...params: any[]) => { mark: any, clean: any } };

    fn.checkUnusedKeyAndDeletes = (...params: any) => {

        let current = rootMap;

        for (let param of params) {
            if (current) {
                current = current.get(param)
            } else { }
        }

        if (current) {

            let keyToDeletes = new Set(current.keys())

            keyToDeletes.delete(resultSymbol);

            return {
                mark(key: any) {
                    keyToDeletes.delete(key)
                },
                clean() {
                    // keyToDeletes.size > 0 && console.log(`[${params.join(".")}]`, `[CLEAN]`, keyToDeletes)
                    for (let key of keyToDeletes) {
                        current.delete(key);
                    }
                }
            }
        } else {
            return { mark() { }, clean() { } }
        }

    }

    return fn
}
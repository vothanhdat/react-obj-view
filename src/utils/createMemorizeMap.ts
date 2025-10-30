



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

    }) as T & { clear: (...params: any[]) => void };

    fn.clear = (...params: any) => {
        let current = rootMap;
        
        for (let param of params) {
            if (current) {
                current = current.get(param)
            } else {
                return;
            }
        }

        if (current) {
            current.clear()
        }
    }

    return fn
}




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

    }) as T & { clearAllChild: (...params: any[]) => void };

    fn.clearAllChild = (...params: any) => {
        let current = rootMap;

        for (let param of params) {
            if (current) {
                current = current.get(param)
            } else {
                return;
            }
        }

        if (current) {
            const value = current.get(resultSymbol)
            current.clear()
            current.set(resultSymbol, value)
        }
    }

    return fn
}
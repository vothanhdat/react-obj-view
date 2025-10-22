



export const createMemorizeMap = <T extends (...param: any[]) => any>(
    onNewEl: T
) => {
    const rootMap = new Map()
    const resultSymbol = Symbol("result")

    return ((...params: any) => {
        let current = rootMap;
        for (let param of params) {
            if (!current.has(param))
                current.set(param, new Map());
            current = current.get(param)
        }

        if (!current.has(resultSymbol))
            current.set(resultSymbol, onNewEl(...params));

        return current.get(resultSymbol)

    }) as T
}
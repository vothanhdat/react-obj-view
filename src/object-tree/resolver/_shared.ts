export const weakMapCache = <T extends (e: any) => any>(fn: T) => {

    let cache = new WeakMap();


    return ((e: any) => {
        if (!cache.has(e)) {
            let tmp = fn(e);
            cache.set(e, tmp);
            return tmp
        }

        return cache.get(e);

    }) as T;
};


export const weakMapCacheMultipleLevel = <T extends (...params: any[]) => any>(fn: T) => {
    let cache = new WeakMap();

    return ((...params: any[]) => {

        let currentMap: (Map<any, any> | WeakMap<any, any>) = cache

        let paths = params.slice(0, -1);

        let end = params.at(-1);

        for (let param of paths) {
            if (!currentMap.has(param)) {
                currentMap.set(param, new Map());
            }
            currentMap = currentMap.get(param);
        }

        if (!currentMap.has(end)) {
            currentMap.set(end, fn(...params));
        }
        return currentMap.get(end);
    }) as T;
}

export const simpleCache = <T extends (...params: any[]) => any>(
    fn: T,
    resolver = (...params: Parameters<T>) => params.join(",")
) => {

    let map: Map<any, any> | undefined = undefined;//new Map()

    let fnWithCache = ((...params: Parameters<T>) => {
        map ||= new Map()

        let key = resolver(...params)
        if (!map.has(key)) { map.set(key, fn(...params)) }
        return map.get(key);
    }) as T & { clear: any }

    fnWithCache.clear = () => map?.clear();

    return fnWithCache;

}
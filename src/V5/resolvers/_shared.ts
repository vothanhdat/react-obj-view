export const weakMapCache = <T extends (e: any) => any>(fn: T) => {

    let cache = new WeakMap();


    return ((e: any) => {
        if (!cache.has(e)) {
            cache.set(e, fn(e));
        }

        return cache.get(e);

    }) as T;
};

import { GroupedProxy, objectGroupProxyFactory } from "../custom-class/groupedProxy";
import { ResolverFn } from "../types";

const weakMapCache = new WeakMap()

export const groupArrayResolver: (size: number) => ResolverFn<any[]> = (size: number) => (
    arr: any[],
    cb,
    next,
    isPreview,
    config,
    stableRef,
) => {
    if (!isPreview && arr instanceof Array && arr.length > size) {
        let groupProxyFactory = weakMapCache.get(stableRef)
        if (!groupProxyFactory) {
            weakMapCache.set(stableRef, groupProxyFactory = objectGroupProxyFactory())
        }
        const proxyValue = groupProxyFactory(arr, size)
        next(proxyValue);
        proxyValue instanceof GroupedProxy && next([]);
    } else {
        next(arr);
    }
};

export const groupObjectResolver: (size: number) => ResolverFn<any[]> = (size: number) => (
    value: Object,
    cb,
    next,
    isPreview,
    config,
    stableRef,
) => {
    if (!isPreview && !(value instanceof GroupedProxy)) {
        let groupProxyFactory = weakMapCache.get(stableRef)
        if (!groupProxyFactory) {
            weakMapCache.set(stableRef, groupProxyFactory = objectGroupProxyFactory())
        }
        const proxyValue = groupProxyFactory(value, size); 
        next(proxyValue);
        proxyValue instanceof GroupedProxy && next({});
    } else {
        next(value);
    }
};

export const GROUP_OBJECT_RESOLVER = (size: number) => ([
    [Object, groupObjectResolver(size)]
]) as [any, ResolverFn][];

export const GROUP_ARRAY_RESOLVER = (size: number) => ([
    [Array, groupArrayResolver(size)]
]) as [any, ResolverFn][];

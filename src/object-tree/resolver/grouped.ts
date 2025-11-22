import { GroupedProxy, objectGroupProxyFactory } from "../custom-class/groupedProxy";
import { ResolverFn } from "../types";

const weakMapCache = new WeakMap()

export const groupArrayResolver: (size: number) => ResolverFn<any[]> = (size: number) => function* (
    arr: any[],
    next,
    isPreview,
    config,
    stableRef,
) {
    if (!isPreview && arr instanceof Array && arr.length > size) {
        let groupProxyFactory = weakMapCache.get(stableRef)
        if (!groupProxyFactory) {
            weakMapCache.set(stableRef, groupProxyFactory = objectGroupProxyFactory())
        }
        const proxyValue = groupProxyFactory(arr, size)
        yield* next(proxyValue);
        proxyValue instanceof GroupedProxy && (yield* next([]));
    } else {
        yield* next(arr);
    }
};

export const groupObjectResolver: (size: number) => ResolverFn<any[]> = (size: number) => function* (
    value: Object,
    next,
    isPreview,
    config,
    stableRef,
) {
    if (!isPreview && !(value instanceof GroupedProxy)) {
        let groupProxyFactory = weakMapCache.get(stableRef)
        if (!groupProxyFactory) {
            weakMapCache.set(stableRef, groupProxyFactory = objectGroupProxyFactory())
        }
        const proxyValue = groupProxyFactory(value, size); 
        yield* next(proxyValue);
        proxyValue instanceof GroupedProxy && (yield* next({}));
    } else {
        yield* next(value);
    }
};

export const GROUP_OBJECT_RESOLVER = (size: number) => ([
    [Object, groupObjectResolver(size)]
]) as [any, ResolverFn][];

export const GROUP_ARRAY_RESOLVER = (size: number) => ([
    [Array, groupArrayResolver(size)]
]) as [any, ResolverFn][];

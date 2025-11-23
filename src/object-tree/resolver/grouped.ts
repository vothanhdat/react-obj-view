import { GroupedProxy, objectGroupProxyFactory } from "../custom-class/groupedProxy";
import { DEFAULT_COLLAPSE, ENUMERABLE_BIT, ENUMERABLE_BUT_COLLAPSE } from "../meta" with {type: "macro"};
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
        if (proxyValue instanceof GroupedProxy) {
            next(proxyValue, (k, v, meta) => cb(k, v, meta | ENUMERABLE_BUT_COLLAPSE));
            next([]);
        } else {
            next(proxyValue)
        }
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
        if (proxyValue instanceof GroupedProxy) {
            next(proxyValue, (k, v, meta) => cb(k, v, meta | ENUMERABLE_BUT_COLLAPSE));
            next({});
        } else {
            next(proxyValue)
        }

    } else {
        next(value);
    }
};

export const groupProxyResolver: ResolverFn<GroupedProxy> = (
    value: GroupedProxy,
    cb,
    next,
    isPreview,
    config,
    stableRef,
) => {
    if (!isPreview) {
        for (let key in value) {
            if (cb(
                key,
                (value as any)[key],
                ENUMERABLE_BUT_COLLAPSE
            )) return
        }
    }
}

export const GROUP_OBJECT_RESOLVER = (size: number) => ([
    [Object, groupObjectResolver(size)]
]) as [any, ResolverFn][];

export const GROUP_ARRAY_RESOLVER = (size: number) => ([
    [Array, groupArrayResolver(size)]
]) as [any, ResolverFn][];

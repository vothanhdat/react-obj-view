import { GroupedProxy, objectGroupProxyFactory } from "../utils/groupedProxy";
import { ResolverFn } from "../types";

const weakMapCache = new WeakMap<object, ReturnType<typeof objectGroupProxyFactory>>();

const getProxyFactory = (stableRef: unknown) => {
    if (typeof stableRef === "object" && stableRef !== null) {
        let factory = weakMapCache.get(stableRef);
        if (!factory) {
            factory = objectGroupProxyFactory();
            weakMapCache.set(stableRef, factory);
        }
        return factory;
    }
    return objectGroupProxyFactory();
};

export const groupArrayResolver: (size: number) => ResolverFn<any[]> = (size: number) => (
    arr: any[],
    cb,
    next,
    isPreview,
    config,
    stableRef,
) => {
    if (!isPreview && arr instanceof Array && arr.length > size) {
        const factory = getProxyFactory(stableRef);
        next(factory(arr, size));
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
    if (!isPreview) {
        const factory = getProxyFactory(stableRef);
        next(factory(value, size));
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

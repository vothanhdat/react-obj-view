import { GroupedProxy, getArrayGroupProxyEntries, getObjectGroupProxyEntries } from "../../ObjectViewV2/utils/groupedProxy";
import { ResolverFn } from "../types";

const selfGrouped = Object.getPrototypeOf(new GroupedProxy());

export const groupArrayResolver: (size: number) => ResolverFn<any[]> = (size: number) => (
    arr: any[],
    cb,
    next,
    isPreview
) => {
    if (!isPreview && arr.length >= size) {
        next(
            getArrayGroupProxyEntries(arr, size),
            (key, value, enumrable) => value != selfGrouped
                && cb(key, value, enumrable)
        );
    } else {
        next(arr);
    }
};

export const groupObjectResolver: (size: number) => ResolverFn<any[]> = (size: number) => (
    value: Object,
    cb,
    next,
    isPreview
) => {
    if (!isPreview) {
        next(
            getObjectGroupProxyEntries(value, size),
            (key, value, enumrable) => value != selfGrouped
                && cb(key, value, enumrable)
        );
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

import type { TreeWalkerAdapter } from "@react-obj-view/tree-core";
import { CircularChecking } from "./CircularChecking";
import { getEntriesCb } from "./getEntries";
import { LazyValue } from "./LazyValueWrapper";
import { objectHasChild } from "./objectHasChild";
import type { ResolverFn } from "./types";
import { getObjectUniqueId } from "./getObjectUniqueId";

export type ObjectNodeMeta = number;

export const META_ENUMERABLE_BIT = 1 << 0;
export const META_CIRCULAR_BIT = 1 << 1;

const packMeta = (enumerable: boolean = true, isCircular: boolean = false): ObjectNodeMeta =>
    (enumerable ? META_ENUMERABLE_BIT : 0) |
    (isCircular ? META_CIRCULAR_BIT : 0);
export const metaIsEnumerable = (meta?: ObjectNodeMeta) =>
    meta === undefined || Boolean(meta & META_ENUMERABLE_BIT);
export const metaIsCircular = (meta?: ObjectNodeMeta) =>
    Boolean(meta && (meta & META_CIRCULAR_BIT));

export type ObjectWalkerAdapterOptions = {
    resolver: Map<any, ResolverFn> | undefined;
    includeSymbols: boolean;
    nonEnumerable: boolean;
};



export const getObjectNodeMeta = (
    enumerable = true,
    isCircular = false,
): ObjectNodeMeta => packMeta(enumerable, isCircular);

export const createObjectWalkerAdapter = (
    options: ObjectWalkerAdapterOptions,
): TreeWalkerAdapter<unknown, PropertyKey, ObjectNodeMeta> => {
    const circularChecking = new CircularChecking();

    const enumeratorConfig = {
        resolver: options.resolver,
        nonEnumerable: options.nonEnumerable,
        symbol: options.includeSymbols,
    };

    return {
        canHaveChildren: (value, meta) =>
            !metaIsCircular(meta) && objectHasChild(value),
        createMeta: (value) => packMeta(true, circularChecking.checkCircular(value)),
        getChildren: (value, _meta, _ctx, emit) => {
            if (!objectHasChild(value) || circularChecking.checkCircular(value)) {
                return;
            }

            circularChecking.enterNode(value);
            getEntriesCb(
                value,
                enumeratorConfig,
                false,
                value,
                (key, childValue, enumerable) => {
                    const normalized =
                        childValue instanceof LazyValue && childValue.inited
                            ? childValue.value ?? childValue.error
                            : childValue;
                    const isCircular = circularChecking.checkCircular(normalized);
                    emit({
                        key,
                        value: normalized,
                        meta: packMeta(enumerable, isCircular),
                    });
                },
            );
            circularChecking.exitNode(value);
        },
        shouldExpand: (_value, meta, { depth }, config) => {
            if (metaIsCircular(meta)) return false;
            const isEnumerable = metaIsEnumerable(meta);
            return isEnumerable && depth <= config.expandDepth;
        },
    };
};

export const getObjectWalkerVersionToken = (
    options: ObjectWalkerAdapterOptions,
) => {
    return (
        (options.nonEnumerable ? 0 : 1) |
        (options.includeSymbols ? 0 : 2) |
        (getObjectUniqueId(options.resolver) << 2)
    );
};

import type { TreeWalkerAdapter } from "@react-obj-view/tree-core";
import { CircularChecking } from "./CircularChecking";
import { getEntriesCb } from "./getEntries";
import { LazyValue } from "./LazyValueWrapper";
import { objectHasChild } from "./objectHasChild";
import type { ResolverFn } from "./types";
import { getObjectUniqueId } from "./getObjectUniqueId";

export type ObjectNodeMeta = {
    enumerable?: boolean;
    isCircular?: boolean;
};

export type ObjectWalkerAdapterOptions = {
    resolver: Map<any, ResolverFn> | undefined;
    includeSymbols: boolean;
    nonEnumerable: boolean;
};

const metaCache = {
    true: {
        true: { enumerable: true, isCircular: true } as ObjectNodeMeta,
        false: { enumerable: true, isCircular: false } as ObjectNodeMeta,
    },
    false: {
        true: { enumerable: false, isCircular: true } as ObjectNodeMeta,
        false: { enumerable: false, isCircular: false } as ObjectNodeMeta,
    },
};

export const getObjectNodeMeta = (
    enumerable = true,
    isCircular = false,
): ObjectNodeMeta => metaCache[enumerable ? "true" : "false"][isCircular ? "true" : "false"];

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
            !meta?.isCircular && objectHasChild(value),
        createMeta: (value) => getObjectNodeMeta(true, circularChecking.checkCircular(value)),
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
                        meta: getObjectNodeMeta(enumerable, isCircular),
                    });
                },
            );
            circularChecking.exitNode(value);
        },
        shouldExpand: (_value, meta, { depth }, config) => {
            if (meta?.isCircular) return false;
            const isEnumerable = meta?.enumerable !== false;
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

import type {
    TreeWalkerAdapter,
    WalkerChild,
} from "@react-obj-view/tree-core";
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

export const createObjectWalkerAdapter = (
    options: ObjectWalkerAdapterOptions,
): TreeWalkerAdapter<unknown, PropertyKey, ObjectNodeMeta> => {
    const circularChecking = new CircularChecking();

    const enumeratorConfig = {
        resolver: options.resolver,
        nonEnumerable: options.nonEnumerable,
        symbol: options.includeSymbols,
    };

    const normalizeValue = (value: unknown) =>
        value instanceof LazyValue && value.inited
            ? value.value ?? value.error
            : value;

    return {
        canHaveChildren: (value, meta) =>
            !meta?.isCircular && objectHasChild(value),
        getChildren: (value) => {
            if (!objectHasChild(value) || circularChecking.checkCircular(value)) {
                return [];
            }

            const children: WalkerChild<
                unknown,
                PropertyKey,
                ObjectNodeMeta
            >[] = [];

            circularChecking.enterNode(value);
            getEntriesCb(
                value,
                enumeratorConfig,
                false,
                value,
                (key, childValue, enumerable) => {
                    const normalized = normalizeValue(childValue);
                    const isCircular = circularChecking.checkCircular(normalized);
                    children.push({
                        key,
                        value: normalized,
                        meta: {
                            enumerable,
                            isCircular,
                        },
                    });
                },
            );
            circularChecking.exitNode(value);

            return children;
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

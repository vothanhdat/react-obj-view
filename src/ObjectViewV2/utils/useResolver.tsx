import { useMemo } from "react";
import { JSONViewCtx, ResolverFn } from "../types";

const defaultResolver: ResolverFn = (e: any, iterator, isPreview) => {
    return iterator;
};
export const useResolver = (value: any, context: JSONViewCtx) => useMemo(
    () => value?.constructor?.prototype?.isPrototypeOf(value)
        ? context?.resolver?.get(value?.constructor) ?? defaultResolver : defaultResolver,
    [value?.constructor, context?.resolver]
);

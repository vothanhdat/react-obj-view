import { infoSymbol } from "../../ObjectViewV2/utils/groupedProxy";
import { LazyValue, LazyValueError } from "../LazyValueWrapper";
import { ResolverFn } from "../types";
import { mapResolver, setResolver, CustomIterator, iteraterResolver } from "./collections";
import { promiseResolver } from "./promise";

const lazyValueResolver: ResolverFn<LazyValue> = (
    lazyValue: LazyValue,
    cb,
    next,
    isPreview,
) => {
    if (lazyValue.inited) {
        if (lazyValue?.error) {
            next(lazyValue?.error)
        } else {
            next(lazyValue?.value)
        }
    } else {
        next(lazyValue)
    }
}


export const DEFAULT_RESOLVER = new Map<any, ResolverFn>([
    [Map, mapResolver],
    [Set, setResolver],
    [CustomIterator, iteraterResolver],
    [Promise, promiseResolver],
    [LazyValue, lazyValueResolver],
]);


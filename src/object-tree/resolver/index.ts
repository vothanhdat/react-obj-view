import { GroupedProxy } from "../custom-class/groupedProxy";
import { ResolverFn } from "../types";
import { LazyValue } from "../custom-class/LazyValueWrapper";
import { mapResolver, setResolver, CustomIterator, iteraterResolver } from "./collections";
import { lazyValueResolver } from "./lazyValueResolver";
import { InternalPromise, internalPromiseResolver, promiseResolver } from "./promise";
import { groupProxyResolver } from "./grouped";


export const DEFAULT_RESOLVER = new Map<any, ResolverFn>([
    [InternalPromise, internalPromiseResolver],
    [LazyValue, lazyValueResolver],
    [CustomIterator, iteraterResolver],

    [Map, mapResolver],
    [Set, setResolver],
    [Promise, promiseResolver],
    [GroupedProxy, groupProxyResolver],
]);

export const PROTOTYPE_DISABLE = new Set([
    InternalPromise,
    LazyValue,
    GroupedProxy,
    CustomIterator,
])

export { GROUP_ARRAY_RESOLVER, GROUP_OBJECT_RESOLVER } from "./grouped"

export { CustomEntry, CustomIterator } from "./collections"
export { InternalPromise } from "./promise"
export { TYPED_ARRAY_RESOLVERS, ItemViewBase } from "./typedArray";


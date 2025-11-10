import { GroupedProxy } from "../../utils/groupedProxy";
import { LazyValue } from "../LazyValueWrapper";
import { ResolverFn } from "../types";
import { mapResolver, setResolver, CustomIterator, iteraterResolver } from "./collections";
import { lazyValueResolver } from "./lazyValueResolver";
import { InternalPromise, internalPromiseResolver, promiseResolver } from "./promise";

export const DEFAULT_RESOLVER = new Map<any, ResolverFn>([
    [InternalPromise, internalPromiseResolver],
    [LazyValue, lazyValueResolver],
    [CustomIterator, iteraterResolver],

    [Map, mapResolver],
    [Set, setResolver],
    [Promise, promiseResolver],
]);

export const PROTOTYPE_DISABLE = new Set([
    InternalPromise,
    LazyValue,
    GroupedProxy,
    CustomIterator,
])


export { LazyValue, LazyValueError } from "./LazyValueWrapper";
export { CircularChecking } from "./CircularChecking";
export { getEntriesCb, getEntriesCbOriginal, hidePrototype } from "./getEntries";
export { getObjectUniqueId } from "./getObjectUniqueId";
export {
    DEFAULT_RESOLVER,
    PROTOTYPE_DISABLE,
} from "./resolvers";
export {
    GROUP_ARRAY_RESOLVER,
    GROUP_OBJECT_RESOLVER,
} from "./resolvers/grouped";
export {
    mapResolver,
    setResolver,
    iteraterResolver,
    CustomEntry,
    CustomIterator,
} from "./resolvers/collections";
export { InternalPromise } from "./resolvers/promise";
export { GroupedProxy, objectGroupProxyFactory, proxyInfo, groupedProxyIsEqual } from "./utils/groupedProxy";
export type { ResolverFn, ResolverFnCb, Entry, ResolverConfig } from "./types";
export { objectHasChild } from "./objectHasChild";
export {
    createObjectWalkerAdapter,
    getObjectWalkerVersionToken,
    getObjectNodeMeta,
    type ObjectNodeMeta,
    type ObjectWalkerAdapterOptions,
} from "./objectWalkerAdapter";

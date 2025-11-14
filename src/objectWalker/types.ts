export type ResolverFnCb = (
    key: PropertyKey,
    value: unknown,
    enumerable: boolean
) => boolean | void;

export type ResolverFn<T = any> = (
    value: T,
    cb: ResolverFnCb,
    next: (value: unknown, cb?: ResolverFnCb) => void,
    isPreview: boolean,
    config: ResolverConfig,
    stableRef: unknown,
) => void;

export type Entry = {
    key: PropertyKey;
    value: unknown;
    enumerable: boolean;
};

export type ResolverConfig = {
    nonEnumerable: boolean;
    symbol?: boolean;
    resolver: Map<any, ResolverFn> | undefined;
};

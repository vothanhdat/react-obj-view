
type ResolverFnCb = (key: PropertyKey, value: unknown, enumerable: boolean) => boolean | void

export type ResolverFn<T = any> = (
    value: T,
    cb: ResolverFnCb,
    next: (value: unknown, cb?: ResolverFnCb) => void,
    isPreview: boolean
) => void

export type Entry = {
    key: PropertyKey
    value: unknown,
    enumerable: boolean
};

export type WalkingConfig = {
    expandDepth: number;
    nonEnumerable: boolean;
    symbol?: boolean;
    resolver: Map<any, ResolverFn> | undefined;
    arrayGroup?: number
};

export type ObjectViewProps = {
    valueGetter: any;
    name?: string;
    style?: any;
    expandLevel?: number | boolean;
    objectGroupSize?: number;
    arrayGroupSize?: number;
    resolver?: Map<any, ResolverFn>;
    highlightUpdate?: boolean;
    preview?: boolean;
    nonEnumerable?: boolean;
    showLineNumbers?: boolean;
};



import { ThemeColor } from "../themes";

type ResolverFnCb = (key: PropertyKey, value: unknown, enumerable: boolean) => boolean | void

export type ResolverFn<T = any> = (
    value: T,
    cb: ResolverFnCb,
    next: (value: unknown, cb?: ResolverFnCb) => void,
    isPreview: boolean,
    config: WalkingConfig,
    stableRef: any,
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
};

export type ObjectViewProps = {
    valueGetter: () => unknown;
    name?: string;

    expandLevel?: number | boolean;
    objectGroupSize?: number; // >= 2 or no grouping
    arrayGroupSize?: number; // >= 2 or no grouping
    resolver?: Map<any, ResolverFn>;
    highlightUpdate?: boolean;
    preview?: boolean;
    nonEnumerable?: boolean;
    showLineNumbers?: boolean;
    includeSymbols?: boolean;

    style?: React.CSSProperties | ThemeColor;
    lineHeight?: number;
    className?: string;
};

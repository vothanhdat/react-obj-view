import { parseWalkingMeta } from "./objectWalkingAdapter";
import type { WalkingContext, WalkingAdapter, InferWalkingResult, InferNodeResult, InferWalkingInstance } from "../libs/tree-core";
import { CircularChecking } from "./utils/CircularChecking";

type ResolverFnCb = (key: PropertyKey, value: unknown, meta: number) => boolean | void

export type ResolverFn<T = any> = (
    value: T,
    cb: ResolverFnCb,
    next: (value: unknown, cb?: ResolverFnCb) => void,
    isPreview: boolean,
    config: WalkingConfig,
    stableRef: any,
) => void


export type WalkingConfig = {
    expandDepth: number;
    nonEnumerable: boolean;
    symbol?: boolean;
    resolver: Map<any, ResolverFn> | undefined;
};
export type WalkingMeta = number;

export type ObjectWalkingConfig = {
    nonEnumerable: boolean;
    symbol?: boolean;
    resolver: Map<any, ResolverFn> | undefined;
};

export type ObjectWalkingContext = WalkingContext<ObjectWalkingConfig> & {
    circularChecking: CircularChecking;
};

export type ObjectWalkingAdapter = WalkingAdapter<
    unknown, PropertyKey, WalkingMeta, ObjectWalkingConfig, ObjectWalkingContext
>;

export type ObjectWalkingResult = InferWalkingResult<ObjectWalkingAdapter>;

export type ObjectWalkingNode = InferNodeResult<ObjectWalkingAdapter>;

export type ObjectWalkingInstance = InferWalkingInstance<ObjectWalkingAdapter>;

export type ObjectWalkingMetaParser = typeof parseWalkingMeta;



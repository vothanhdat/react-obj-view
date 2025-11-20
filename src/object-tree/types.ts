import { parseWalkingMeta } from "./objectWalkingAdaper";
import type { WalkingContext, WalkingAdaper, InferWalkingResult, InferNodeResult, InferWalkingInstance } from "../libs/tree-core";
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

export type ObjectWalkingAdater = WalkingAdaper<
    unknown, PropertyKey, WalkingMeta, ObjectWalkingConfig, ObjectWalkingContext
>;

export type ObjectWalkingResult = InferWalkingResult<ObjectWalkingAdater>;

export type ObjectWalkingNode = InferNodeResult<ObjectWalkingAdater>;

export type ObjectWalkingInstance = InferWalkingInstance<ObjectWalkingAdater>;

export type ObjectWalkingMetaParser = typeof parseWalkingMeta;



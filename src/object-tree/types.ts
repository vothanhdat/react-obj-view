import { parseWalkingMeta } from "./objectWalkingAdaper";
import type { WalkingContext, WalkingAdaper, InferWalkingResult, InferNodeResult, InferWalkingInstance } from "../libs/tree-core";
import { CircularChecking } from "./utils/CircularChecking";


export type ResolverEntry = [PropertyKey, unknown, number];

export type ResolverFn<T = any> = (
    value: T,
    next: (value: unknown) => IterableIterator<ResolverEntry>,
    isPreview: boolean,
    config: WalkingConfig,
    stableRef: any,
) => IterableIterator<ResolverEntry>


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



import type { walkingFactory } from "./walkingFactory";

export type WalkingResult<Value, Key, Meta> = {
    value?: Value;
    key?: Key;
    childKeys?: Key[];
    childOffsets?: number[];

    childCount: number;
    childCanExpand: boolean;
    childDepth: number;

    expandedDepth: number;
    expanded: boolean;
    updateToken: number;
    updateStamp: number;
    iterateFinish: boolean
    earlyReturn: boolean
    selfStamp: number;

    userExpand?: boolean;

    meta?: Meta;
};

export type NodeResult<Value, Key, Meta> = {
    state: WalkingResult<Value, Key, Meta>;
    depth: number;
    paths: Key[];
    parentIndex: number[];
};

export type WalkingContext<Config> = {
    config: Config;
    updateToken: number;
    expandDepth: number;
    updateStamp: number;
    iterateCounter: number;
};


export type WalkingAdapter<Value, Key, Meta, Config, Context extends WalkingContext<Config>> = {
    valueHasChild: (value: Value, meta: Meta, ctx: Context) => boolean;
    iterateChilds: (
        value: Value, ctx: Context, stableRef: unknown,
        cb: (value: Value, key: Key, meta: Meta) => boolean
    ) => void;

    defaultMeta: (value: Value, key: Key) => Meta;
    defaultContext: (ctx: WalkingContext<Config>) => Context;
    getConfigTokenId: (config: Config) => number;
    valueDefaultExpaned?: (meta: Meta, ctx: Context) => boolean;
    isValueChange?: (a: Value | undefined, b: Value | undefined) => boolean;
    transformValue?: (value: Value, stableRef: unknown) => Value;
    onEnterNode?: (value: Value, key: Key, meta: Meta, ctx: Context) => void;
    onExitNode?: (value: Value, key: Key, meta: Meta, ctx: Context) => void;
};

export type WalkingAdapterBase = WalkingAdapter<any, any, any, any, any>

export type InferWalkingResult<T extends WalkingAdapterBase>
    = T extends WalkingAdapter<infer Value, infer Key, infer Meta, any, any>
    ? WalkingResult<Value, Key, Meta>
    : WalkingResult<any, any, any>

export type InferNodeResult<T extends WalkingAdapterBase>
    = T extends WalkingAdapter<infer Value, infer Key, infer Meta, any, any>
    ? NodeResult<Value, Key, Meta>
    : NodeResult<any, any, any>

export type InferWalkingInstance<T extends WalkingAdapterBase>
    = T extends WalkingAdapter<infer Value, infer Key, infer Meta, infer Config, infer Context>
    ? ReturnType<typeof walkingFactory<Value, Key, Meta, Config, Context>>
    : ReturnType<typeof walkingFactory<any, any, any, any, any>>

export type InferWalkingType<T extends WalkingAdapterBase>
    = T extends WalkingAdapter<infer Value, infer Key, infer Meta, infer Config, infer Context>
    ? { Value: Value; Key: Key; Meta: Meta; Config: Config; Context: Context }
    : { Value: any; Key: any; Meta: any; Config: any; Context: any }


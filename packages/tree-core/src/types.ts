export type TreeWalkerAdapter<Value, Key extends PropertyKey = PropertyKey, Meta = unknown> = {
    canHaveChildren: (value: Value, meta?: Meta) => boolean;
    getChildren: (
        value: Value,
        meta: Meta | undefined,
        context: WalkerAdapterContext,
        emit: (key: Key, value: Value, meta?: Meta) => boolean | void,
    ) => void;
    stringifyPath?: (path: readonly Key[]) => string;
    isSameValue?: (previous: Value | undefined, next: Value | undefined) => boolean;
    shouldExpand?: (
        value: Value,
        meta: Meta | undefined,
        context: WalkerAdapterContext,
        config: WalkingConfig
    ) => boolean;
    createMeta?: (value: Value, context: WalkerAdapterContext) => Meta | undefined;
};

export type WalkerAdapterContext = {
    depth: number;
};

export type WalkingConfig = {
    expandDepth: number;
    versionToken?: number;
};

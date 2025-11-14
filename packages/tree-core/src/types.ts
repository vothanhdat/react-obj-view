export type WalkerChild<Value, Key extends PropertyKey = PropertyKey, Meta = unknown> = {
    key: Key;
    value: Value;
    meta?: Meta;
    canHaveChildren?: boolean;
};

export type TreeWalkerAdapter<Value, Key extends PropertyKey = PropertyKey, Meta = unknown> = {
    canHaveChildren: (value: Value, meta?: Meta) => boolean;
    getChildren: (
        value: Value,
        meta: Meta | undefined,
        context: WalkerAdapterContext
    ) => Iterable<WalkerChild<Value, Key, Meta>> | void;
    stringifyPath?: (path: readonly Key[]) => string;
    isSameValue?: (previous: Value | undefined, next: Value | undefined) => boolean;
};

export type WalkerAdapterContext = {
    depth: number;
};

export type WalkingConfig = {
    expandDepth: number;
    versionToken?: number;
};

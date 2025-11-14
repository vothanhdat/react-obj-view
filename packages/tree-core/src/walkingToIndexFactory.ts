import { GetStateFn, StateFactory } from "./StateFactory";
import { TreeWalkerAdapter, WalkerChild, WalkingConfig } from "./types";

export type WalkingResult<Value = unknown, Key = unknown, Meta = unknown> = {
    value: Value;
    name: Key;
    meta?: Meta;
    childOffsets?: number[];
    childKeys?: Key[];
    count: number;
    maxDepth: number;
    expandedDepth: number;
    expanded: boolean;
    childCanExpand: boolean;
    userExpand?: boolean;
    updateToken?: number;
    updateStamp: number;
};

export type NodeResultData<Value = unknown, Key = unknown, Meta = unknown> =
    WalkingResult<Value, Key, Meta> & {
        depth: number;
        path: string;
        paths: Key[];
    };

const defaultStringifyPath = (path: readonly unknown[]) =>
    path
        .map((segment) => {
            try {
                return String(segment);
            } catch {
                return "";
            }
        })
        .join("/");

export class NodeResult<Value = unknown, Key = unknown, Meta = unknown> {
    constructor(
        public state: WalkingResult<Value, Key, Meta>,
        public depth: number,
        public paths: Key[],
        public parentIndex: number[],
        private stringifyPath: (path: readonly Key[]) => string,
    ) {
        Object.assign(this, state);
    }

    public get path(): string {
        return this.stringifyPath(this.paths);
    }

    getData(): NodeResultData<Value, Key, Meta> {
        const state = this.state;
        return {
            ...state,
            depth: this.depth,
            path: this.path,
            paths: this.paths,
        };
    }
}

export const walkingToIndexFactory = <
    Value = unknown,
    Key extends PropertyKey = PropertyKey,
    Meta = unknown
>(
    adapter: TreeWalkerAdapter<Value, Key, Meta>,
) => {
    let updateStamp = 0;

    const stringifyPath = adapter.stringifyPath ?? defaultStringifyPath;
    const isSameValue =
        adapter.isSameValue ??
        ((previous: Value | undefined, next: Value | undefined) =>
            Object.is(previous, next));

    const { stateFactory, getStateOnly } = StateFactory<
        WalkingResult<Value, Key, Meta>
    >(() => ({
        value: undefined as Value,
        name: undefined as unknown as Key,
        meta: undefined,
        count: 0,
        maxDepth: 0,
        expandedDepth: 0,
        childCanExpand: false,
        expanded: false,
        updateStamp,
    }));

    const rootMapState: any = {};

    const stateRoot = stateFactory(rootMapState);
    const stateRead = getStateOnly(rootMapState);

    const enumerateChildren = (
        value: Value,
        meta: Meta | undefined,
        depth: number,
        getChild: ReturnType<GetStateFn<WalkingResult<Value, Key, Meta>>>["getChild"],
        config: WalkingConfig,
        updateToken: number,
        walking: typeof walkingInternal,
    ) => {
        let count = 1;
        let maxDepth = depth;
        let childCanExpand = false;
        let childOffsets: number[] = [count];
        let childKeys: Key[] = [];

        const children: Iterable<WalkerChild<Value, Key, Meta>> =
            adapter.getChildren(value, meta, { depth }) ?? [];

        for (const child of children) {
            const childResult = walking(
                child.value,
                config,
                child.key,
                child.meta,
                updateToken,
                depth + 1,
                getChild(child.key),
            );

            count += childResult.count;
            maxDepth = Math.max(maxDepth, childResult.maxDepth);
            childCanExpand ||= childResult.childCanExpand;
            childOffsets.push(count);
            childKeys.push(child.key);
        }

        return { count, maxDepth, childCanExpand, childOffsets, childKeys };
    };

    const walkingInternal = (
        value: Value,
        config: WalkingConfig,
        name: Key,
        meta: Meta | undefined,
        updateToken: number,
        depth: number,
        { state, cleanChild, getChild }: ReturnType<
            GetStateFn<WalkingResult<Value, Key, Meta>>
        >,
    ): WalkingResult<Value, Key, Meta> => {
        let count = 1;
        let maxDepth = depth;
        const canExpand = adapter.canHaveChildren(value, meta);
        const defaultExpanded = adapter.shouldExpand
            ? adapter.shouldExpand(value, meta, { depth }, config)
            : depth <= config.expandDepth;
        const isExpanded = canExpand && (state.userExpand ?? defaultExpanded);
        let childCanExpand = canExpand && !isExpanded;

        const shouldUpdate =
            !isSameValue(state.value, value) ||
            state.meta !== meta ||
            state.expanded !== isExpanded ||
            state.updateToken !== updateToken ||
            (isExpanded &&
                state.expandedDepth < config.expandDepth &&
                state.childCanExpand) ||
            (isExpanded &&
                state.maxDepth >= config.expandDepth &&
                state.expandedDepth > config.expandDepth);

        if (shouldUpdate) {
            let childOffsets: number[] | undefined;
            let childKeys: Key[] | undefined;

            if (canExpand && isExpanded) {
                const result = enumerateChildren(
                    value,
                    meta,
                    depth,
                    getChild,
                    config,
                    updateToken,
                    walkingInternal,
                );

                count = result.count;
                maxDepth = result.maxDepth;
                childCanExpand ||= result.childCanExpand;
                childOffsets = result.childOffsets.length > 1
                    ? result.childOffsets
                    : undefined;
                childKeys = result.childKeys.length ? result.childKeys : undefined;
            }

            state.name = name;
            state.meta = meta;
            state.value = value;
            state.count = count;
            state.maxDepth = maxDepth;
            state.childCanExpand = childCanExpand;
            state.childOffsets = childOffsets;
            state.childKeys = childKeys;
            state.expanded = isExpanded;
            state.expandedDepth = config.expandDepth;
            state.updateToken = updateToken;
            state.updateStamp = updateStamp;

            cleanChild();

            return state;
        }

        return state;
    };

    const walking = (
        value: Value,
        config: WalkingConfig,
        name: Key,
        meta?: Meta,
    ) => {
        updateStamp++;
        const resolvedMeta =
            meta ?? adapter.createMeta?.(value, { depth: 1 });
        return walkingInternal(
            value,
            config,
            name,
            resolvedMeta,
            config.versionToken ?? 0,
            1,
            stateRoot,
        );
    };

    const getNode = (
        index: number,
        config: WalkingConfig,
        { state, getChildOnly } = stateRead,
        depth = 1,
        paths: Key[] = [],
        parentIndex: number[] = [0],
    ): NodeResult<Value, Key, Meta> => {
        if (index === 0 || depth >= 100) {
            return new NodeResult(
                state,
                depth,
                paths,
                parentIndex,
                stringifyPath,
            );
        }

        if (!state.childOffsets || !state.childKeys) {
            throw new Error("State Error: child offsets not initialised");
        }

        const { childOffsets, childKeys } = state;

        let start = 0;
        let end = childOffsets.length - 1;
        let guard = 0;

        while (start + 1 < end && guard++ < 50) {
            const mid = (start + end) >> 1;
            if (index >= childOffsets[mid]) {
                start = mid;
            } else {
                end = mid;
            }
        }

        const key = childKeys[start];

        return getNode(
            index - childOffsets[start],
            config,
            getChildOnly(key),
            depth + 1,
            [...paths, key],
            [...parentIndex, (parentIndex.at(-1) ?? 0) + childOffsets[start]],
        );
    };

    const refreshPath = (pathKeys: Key[]) => {
        let currentState = stateRead;

        for (const key of pathKeys) {
            if (!currentState) {
                throw new Error("State Error: Paths not initialised");
            }
            currentState.state.updateToken = -1;
            currentState = currentState.getChildOnly(key);
        }

        currentState.state.updateToken = -1;
    };

    const toggleExpand = (
        paths: Key[],
        config: WalkingConfig,
        currentState = stateRead,
    ) => {
        for (const key of paths) {
            if (!currentState) {
                throw new Error("State Error: Paths not initialised");
            }
            currentState.state.updateToken = -1;
            currentState = currentState.getChildOnly(key);
        }

        const currentExpand =
            currentState.state.userExpand ?? currentState.state.expanded;

        currentState.state.userExpand = !currentExpand;
    };

    return {
        walking,
        getNode,
        toggleExpand,
        refreshPath,
    };
};

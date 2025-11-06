import { createMemorizeMap } from "../utils/createMemorizeMap";
import { isRef } from "../utils/isRef";
import { memorizeMapWithWithClean } from "../utils/memorizeMapWithWithClean";
import { getObjectUniqueId } from "../V4/getObjectUniqueId";
import { WalkingState } from "../V4/types";
import { GetStateFn, StateFactory } from "../V5/StateFactory";
import { getEntries } from "./getEntries";
import { immutableNestedUpdate } from "./immutableNestedUpdate";
import { FirstNode, LastNode, LinkList } from "./LinkList";
import { ResolverFn } from "./types";

type ExpandState = boolean | ExpandTree | undefined;
type ExpandTree = { [key in PropertyKey]?: ExpandState };

export type WalkingConfig = {
    expandDepth: number,
    nonEnumerable: boolean,
    resolver: Map<any, ResolverFn> | undefined,
}

type NodeWalkState = {
    inited: boolean;
    object: unknown;
    start?: LinkList<NodeData>;
    end?: LinkList<NodeData>;
    isExpanded: boolean;
    userExpanded?: boolean;
    expandedDepth: number;
    updateToken?: any
    childStats: ChildStats;
};

export type ChildStats = {
    childMaxDepth: number,
    childCanExpand: boolean,
}


type NodeContext = {
    object: unknown;
    paths: PropertyKey[];
    isCircular: boolean;
    isExpanded: boolean;
    enumerable: boolean;
    isRefObject: boolean;
    canExpand: boolean;
    config: WalkingConfig;
    updateToken?: any
    expandDepth: number,
    cleanChild: any,
    getChild: any,
};


export class NodeData {

    constructor(
        public readonly paths: PropertyKey[],
        public readonly value: any,
        public readonly enumerable: boolean,
        public readonly isCircular: boolean,
        public readonly walkUID: number,
        public readonly expanded: boolean,

    ) { }

    get hasChild() {
        return isRef(this.value)
    }

    get path(): string {
        return this.paths
            .map(e => {
                try {
                    return String(e)
                } catch (error) {
                    return ""
                }
            }).join(".")
    }
    get name(): PropertyKey | undefined {
        return this.paths.at(-1)!
    }

    get depth(): number {
        return this.paths.length
    }

}



export const walkingFactory = () => {

    const defaultConfig = { expandDepth: 0, nonEnumerable: false, resolver: undefined }


    const { stateFactory, getStateOnly } = StateFactory<NodeWalkState>(() => ({
        inited: false,
        object: undefined,
        isExpanded: false,
        childStats: { childCanExpand: false, childMaxDepth: 0 },
        expandedDepth: 0,
    }))

    const rootMapState: any = {}

    const stateRoot = stateFactory(rootMapState)
    const stateRead = getStateOnly(rootMapState)

    const visiting = new WeakSet<object>();

    let getUpdateToken = (config: WalkingConfig) => {
        return (
            (config.nonEnumerable ? 0 : 1)
            | (getObjectUniqueId(config.resolver) << 1)
        )
    }

    const hydrateState = (state: NodeWalkState, meta: NodeContext,) => {
        state.inited = true;
        state.object = meta.object;
        state.isExpanded = meta.isExpanded;
        state.updateToken = meta.updateToken;
        state.expandedDepth = meta.expandDepth
        state.childStats.childMaxDepth = 0
        state.childStats.childCanExpand = meta.canExpand && !meta.isExpanded

        state.start = state.end = new LinkList<NodeData>(
            new NodeData(
                meta.paths,
                meta.object,
                meta.enumerable,
                meta.isCircular,
                0,
                state.isExpanded
            )
        );
    };

    const rebuildBranch = (
        state: NodeWalkState,
        meta: NodeContext,
    ) => {
        const startNode = state.start!;
        let currentLink = startNode;

        const { getChild, cleanChild } = meta
        // const { get: getState, clean: cleanState } = stateFactory(...meta.paths);

        if (!meta.isCircular && meta.isExpanded && meta.isRefObject) {
            for (let { key, value, enumerable } of getEntries(meta.object, meta.config)) {
                // mark(key);

                const { start: childStart, end: childEnd, stats } = walkingInternal(
                    value,
                    enumerable,
                    meta.config,
                    [...meta.paths, key],
                    getChild(key),
                    state.updateToken,
                );

                if (!childStart || !childEnd) {
                    throw new Error("Invalid child traversal bounds");
                }

                currentLink.next = childStart;
                childStart.prev = currentLink;

                currentLink = childEnd;

                state.childStats.childCanExpand ||= stats.childCanExpand
                state.childStats.childMaxDepth = Math.max(
                    state.childStats.childMaxDepth,
                    stats.childMaxDepth + 1,
                )
            }
        }

        cleanChild();

        state.end = currentLink;

        const endNode = state.end!;
        endNode.next = new LastNode(undefined as any, endNode, undefined);
        startNode.prev = new FirstNode(undefined as any, undefined, startNode);
    };

    const shouldRefreshState = (state: NodeWalkState, snapshot: NodeContext,) =>
        !state.inited
        || state.object !== snapshot.object
        || state.isExpanded !== snapshot.isExpanded
        || state.updateToken !== snapshot.updateToken
        || (
            state.isExpanded
            && state.childStats.childCanExpand
            && state.expandedDepth < snapshot.expandDepth
        ) || (
            state.isExpanded
            && state.childStats.childMaxDepth >= snapshot.expandDepth
            && state.expandedDepth > snapshot.expandDepth
        )


    const collectAncestorRefs = (paths: PropertyKey[]): object[] => {
        const ancestors: object[] = [];
        let current = stateRead

        for (const segment of paths) {
            if (isRef(current.state.object)) {
                ancestors.push(current.state.object!);
            }
            current = current.getChildOnly(segment)
        }

        return ancestors;
    };

    //        const updateToken = getUpdateToken(config)

    const walkingInternal = (
        object: unknown,
        enumerable: boolean,
        config: WalkingConfig,
        paths: PropertyKey[],
        { state, cleanChild, getChild }: ReturnType<GetStateFn<NodeWalkState>>,
        updateToken?: any,
    ): {
        start: LinkList<NodeData> | undefined,
        end: LinkList<NodeData> | undefined,
        stats: ChildStats
    } => {

        const { expandDepth, nonEnumerable, resolver } = config

        if (expandDepth < 0) {
            throw new Error("expandDepth must be non-negative");
        }

        const isRefObject = isRef(object);

        const isCircular = isRefObject && visiting.has(object as object);

        const shouldTrackCircular = isRefObject && !isCircular;

        const isDefaultExpand = isRefObject && enumerable && !isCircular && expandDepth > paths.length;

        const canExpand = isRefObject && !isCircular;

        const isExpanded = !isCircular && (state.userExpanded ?? isDefaultExpand);


        const nodeContext: NodeContext = {
            object,
            paths,
            isCircular,
            isExpanded,
            config,
            enumerable,
            isRefObject,
            updateToken,
            canExpand,
            expandDepth,
            cleanChild,
            getChild,
        };


        if (shouldRefreshState(state, nodeContext)) {
            try {

                hydrateState(state, nodeContext);

                shouldTrackCircular && visiting.add(object as object);

                rebuildBranch(state, nodeContext);

            } finally {

                shouldTrackCircular && visiting.delete(object as object);

            }

            return { start: state.start, end: state.end, stats: state.childStats };
        } else if (state.start && state.end) {
            return { start: state.start, end: state.end, stats: state.childStats };
        } else {
            throw new Error("Invalid Walk Into");
        }
    };

    const walking = (
        object: unknown,
        config: WalkingConfig,
        rootName = ""
    ): [LinkList<NodeData> | undefined, LinkList<NodeData> | undefined] => {
        // let { get, clean } = stateFactory()
        let { start, end } = walkingInternal(
            object,
            true,
            config,
            [rootName],
            stateRoot.getChild(rootName),
            getUpdateToken(config),
        )
        stateRoot.cleanChild()
        return [start, end]
    };

    const walkingSwap = (
        paths: PropertyKey[] = [],
        config: WalkingConfig
    ) => {

        const swapState = paths.reduce(
            ({ getChild }, path) => getChild(path),
            stateRoot
        )

        const state = swapState.state

        if (!state.start || !state.end) {
            throw new Error("Invalid state: missing start or end nodes");
        }

        const ancestors = collectAncestorRefs(paths);
        // Avoid flagging ancestors as circular while rebuilding this branch.
        ancestors.forEach((object) => visiting.add(object));

        try {
            const head = state.start.prev;
            const tail = state.end.next;

            if (!head || !tail) {
                throw new Error("Invalid state: missing list boundaries");
            }

            const { start: startAfter, end: endAfter } = walkingInternal(
                state.object,
                state.start.obj.enumerable,
                config,
                paths,
                swapState,
            );

            if (!startAfter || !endAfter) {
                throw new Error("walkingInternal returned incomplete bounds");
            }

            if (startAfter === endAfter) {
                state.start = state.end = startAfter;
                head.next = startAfter;
                tail.prev = startAfter;
                startAfter.prev = head;
                startAfter.next = tail;
            } else {
                state.start = startAfter;
                state.end = endAfter;

                head.next = startAfter;
                startAfter.prev = head;

                tail.prev = endAfter;
                endAfter.next = tail;
            }
        } finally {
            ancestors.forEach((object) => visiting.delete(object));
        }
    };

    const toggleExpand = (
        paths: PropertyKey[],
        config: WalkingConfig
    ) => {
        console.log({ rootMapState })
        let current = stateRead
        for (let path of paths) {
            current.state.updateToken = Math.random()
            current = current.getChildOnly(path)
            console.log("=>", path, current)
        }

        current.state.userExpanded = !(
            current.state.userExpanded
            ?? current.state.isExpanded
            ?? false
        );

        walkingSwap(paths, config);

    };

    return {
        walking,
        toggleExpand,
    };
};

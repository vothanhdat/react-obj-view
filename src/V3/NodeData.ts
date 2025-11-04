import { createMemorizeMap } from "../utils/createMemorizeMap";
import { isRef } from "../utils/isRef";
import { memorizeMapWithWithClean } from "../utils/memorizeMapWithWithClean";
import { WalkingState } from "../V4/types";
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
    // path: string;
    first: boolean;
    object: unknown;
    start?: LinkList<NodeData>;
    end?: LinkList<NodeData>;
    isExpanded: boolean;
    userExpanded?: boolean;
    forceUpdate?: boolean;
    config: WalkingConfig;
};

type NodeContext = {
    object: unknown;
    paths: PropertyKey[];
    isCircular: boolean;
    isExpanded: boolean;
    enumerable: boolean;
    isRefObject: boolean;
    config: WalkingConfig;
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

    const { stateFactory, getState } = memorizeMapWithWithClean((...paths): NodeWalkState => ({
        first: true,
        object: undefined,
        config: defaultConfig,
        isExpanded: false,
    }));

    const visiting = new WeakSet<object>();

    const hydrateState = (state: NodeWalkState, meta: NodeContext,) => {
        state.first = false;
        state.object = meta.object;
        state.isExpanded = meta.isExpanded;
        state.config = meta.config;
        state.forceUpdate = false

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
        const { get: getState, clean: cleanState } = stateFactory(...meta.paths);

        if (!meta.isCircular && meta.isExpanded && meta.isRefObject) {
            for (let { key, value, enumerable } of getEntries(meta.object, meta.config)) {
                // mark(key);

                const [childStart, childEnd] = walkingInternal(
                    value,
                    enumerable,
                    meta.config,
                    [...meta.paths, key],
                    getState(key),
                );

                if (!childStart || !childEnd) {
                    throw new Error("Invalid child traversal bounds");
                }

                currentLink.next = childStart;
                childStart.prev = currentLink;

                currentLink = childEnd;
            }
        }

        cleanState();

        state.end = currentLink;

        const endNode = state.end!;
        endNode.next = new LastNode(undefined as any, endNode, undefined);
        startNode.prev = new FirstNode(undefined as any, undefined, startNode);
    };

    const shouldRefreshState = (state: NodeWalkState, snapshot: NodeContext,) =>
        state.first
        || state.object !== snapshot.object
        || state.isExpanded !== snapshot.isExpanded
        || state.config !== snapshot.config
        || state.forceUpdate;

    const collectAncestorRefs = (paths: PropertyKey[]): object[] => {
        const ancestors: object[] = [];
        let current: unknown = getState("ROOT").object;

        for (const segment of paths.slice(1)) {
            if (isRef(current)) {
                ancestors.push(current as object);
            }
            current = (current as any)?.[segment];
        }

        return ancestors;
    };

    const walkingInternal = (
        object: unknown,
        enumerable: boolean,
        config: WalkingConfig,
        paths: PropertyKey[],
        state: NodeWalkState,
    ): [LinkList<NodeData> | undefined, LinkList<NodeData> | undefined] => {
        const { expandDepth, nonEnumerable, resolver } = config
        if (expandDepth < 0) {
            throw new Error("expandDepth must be non-negative");
        }

        const isRefObject = isRef(object);
        const isCircular = isRefObject && visiting.has(object as object);
        const shouldTrackCircular = isRefObject && !isCircular;

        const isDefaultExpand = isRefObject && enumerable && !isCircular && expandDepth > paths.length;

        const isExpanded = !isCircular && (state.userExpanded ?? isDefaultExpand);

        const nodeContext: NodeContext = {
            object,
            paths,
            isCircular,
            isExpanded,
            config,
            enumerable,
            isRefObject,

        };


        if (shouldRefreshState(state, nodeContext)) {
            try {

                hydrateState(state, nodeContext);

                shouldTrackCircular && visiting.add(object as object);

                rebuildBranch(state, nodeContext);

            } finally {

                shouldTrackCircular && visiting.delete(object as object);

            }

            return [state.start, state.end];
        } else if (state.start && state.end) {
            return [state.start, state.end];
        } else {
            throw new Error("Invalid Walk Into");
        }
    };

    const walking = (
        object: unknown,
        config: WalkingConfig,
        rootName = ""
    ) => {
        let { get, clean } = stateFactory()
        let r = walkingInternal(
            object,
            true,
            config,
            [rootName],
            get(rootName),
        )
        clean();
        return r
    };

    const walkingSwap = (
        paths: PropertyKey[] = [],
        config: WalkingConfig
    ) => {
        const state = getState(...paths);

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

            const [startAfter, endAfter] = walkingInternal(
                state.object,
                state.start.obj.enumerable,
                config,
                paths,
                state,
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

        for (let i = 1; i < paths.length; i++) {
            getState(...paths.slice(0, i)).forceUpdate = true;
        }
        let state: NodeWalkState = getState(...paths)

        state.userExpanded = !(state.userExpanded ?? state.isExpanded ?? false);

        walkingSwap(paths, config);

    };

    return {
        walking,
        toggleExpand,
    };
};

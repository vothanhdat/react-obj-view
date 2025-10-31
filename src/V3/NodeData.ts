import { createMemorizeMap } from "../utils/createMemorizeMap";
import { isRef } from "../utils/isRef";
import { getEntries } from "./getEntries";
import { immutableNestedUpdate } from "./immutableNestedUpdate";
import { FirstNode, LastNode, LinkList } from "./LinkList";

type ExpandState = boolean | ExpandTree;
type ExpandTree = { [key in PropertyKey]?: ExpandState };

type NodeWalkState = {
    path: string;
    first: boolean;
    object: unknown;
    start?: LinkList<NodeData>;
    end?: LinkList<NodeData>;
    isExpanded: boolean;
    expandDepth: number;
    expandState?: ExpandState;
};

type NodeContext = {
    object: unknown;
    paths: PropertyKey[];
    isCircular: boolean;
    isExpanded: boolean;
    expandDepth: number;
    enumerable: boolean;
    isRefObject: boolean;
    expandState: ExpandState;
};


export class NodeData {

    constructor(
        public readonly value: any,
        public readonly enumerable: boolean,
        public readonly paths: PropertyKey[],
        public readonly isCircular: boolean,
        public readonly walkState: NodeWalkState,
    ) { }

    get hasChild() {
        return isRef(this.value)
    }

    get path(): string {
        return this.paths.join(".")
    }
    get name(): PropertyKey | undefined {
        return this.paths.at(-1)!
    }

    get depth(): number {
        return this.paths.length
    }

}

export const walkingFactory = () => {

    const stateGetter = createMemorizeMap((...path): NodeWalkState => ({
        first: true,
        object: undefined,
        path: path.join("."),
        expandDepth: 0,
        isExpanded: true,
        expandState: undefined,
    }));

    let currentExpandMap: ExpandTree = {};

    const visiting = new WeakSet<object>();

    const getChildExpandState = (state: ExpandState, key: PropertyKey): ExpandState => {
        if (state && typeof state === "object") {
            return state[key] || false;
        }
        return false;
    };

    const hydrateState = (state: NodeWalkState, meta: NodeContext,) => {
        state.first = false;
        state.object = meta.object;
        state.isExpanded = meta.isExpanded;
        state.expandDepth = meta.expandDepth;
        state.expandState = meta.expandState;

        state.start = state.end = new LinkList<NodeData>(
            new NodeData(
                meta.object,
                meta.enumerable,
                meta.paths,
                meta.isCircular,
                state,
            )
        );
    };

    const rebuildBranch = (
        state: NodeWalkState,
        meta: NodeContext,
    ) => {
        const startNode = state.start!;
        let currentLink = startNode;
        const { mark, clean } = stateGetter.checkUnusedKeyAndDeletes(...meta.paths);

        if (!meta.isCircular && meta.isExpanded && meta.isRefObject) {
            for (let { key, value, enumerable } of getEntries(meta.object)) {
                mark(key);

                const [childStart, childEnd] = walkingInternal(
                    value,
                    meta.expandDepth,
                    enumerable,
                    [...meta.paths, key],
                    getChildExpandState(meta.expandState, key),
                );

                if (!childStart || !childEnd) {
                    throw new Error("Invalid child traversal bounds");
                }

                currentLink.next = childStart;
                childStart.prev = currentLink;

                currentLink = childEnd;
            }
        }

        clean();

        state.end = currentLink;

        const endNode = state.end!;
        endNode.next = new LastNode(undefined as any, endNode, undefined);
        startNode.prev = new FirstNode(undefined as any, undefined, startNode);
    };

    const shouldRefreshState = (state: NodeWalkState, snapshot: NodeContext,) =>
        state.first
        || state.object !== snapshot.object
        || state.isExpanded !== snapshot.isExpanded
        || state.expandDepth !== snapshot.expandDepth
        || state.expandState !== snapshot.expandState;

    const collectAncestorRefs = (paths: PropertyKey[]): object[] => {
        const ancestors: object[] = [];
        let current: unknown = stateGetter().object;

        for (const segment of paths) {
            if (isRef(current)) {
                ancestors.push(current as object);
            }
            current = (current as any)?.[segment];
        }

        return ancestors;
    };

    const resolveExpandState = (paths: PropertyKey[]): ExpandState => {
        let branch: ExpandState = currentExpandMap;

        for (const segment of paths) {
            branch = getChildExpandState(branch, segment);
        }

        return branch;
    };

    const walkingInternal = (
        object: unknown,
        expandDepth: number,
        enumerable: boolean,
        paths: PropertyKey[],
        expandState: ExpandState,
    ): [LinkList<NodeData> | undefined, LinkList<NodeData> | undefined] => {

        if (expandDepth < 0) {
            throw new Error("expandDepth must be non-negative");
        }

        const isRefObject = isRef(object);
        const isCircular = isRefObject && visiting.has(object as object);
        const shouldTrackCircular = isRefObject && !isCircular;

        const isDefaultExpand = isRefObject && !isCircular && expandDepth > paths.length;

        const isExpanded = !isCircular && !!(expandState ?? isDefaultExpand);

        const state = stateGetter(...paths);

        const nodeContext: NodeContext = {
            object,
            paths,
            isCircular,
            isExpanded,
            expandDepth,
            expandState,
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

    const walking = (object: unknown, expandDepth: number) => walkingInternal(
        object,
        expandDepth,
        true,
        [],
        currentExpandMap,
    );

    const walkingSwap = (paths: PropertyKey[] = []) => {
        const state = stateGetter(...paths);

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
                state.expandDepth,
                true,
                paths,
                resolveExpandState(paths),
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
        ...paths: PropertyKey[]
    ) => {

        currentExpandMap = immutableNestedUpdate(
            currentExpandMap,
            expand => !(expand ?? stateGetter(...paths).isExpanded),
            paths,
        ) as ExpandTree;

        walkingSwap(paths);

    };

    return {
        walking,
        toggleExpand,
    };
};

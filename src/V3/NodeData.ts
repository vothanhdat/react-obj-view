import { createMemorizeMap } from "../utils/createMemorizeMap";
import { isRef } from "../utils/isRef";
import { getEntries } from "./getEntries";
import { immutableNestedUpdate } from "./immutableNestedUpdate";
import { FirstNode, LastNode, LinkList } from "./LinkList";

type NodeWalkState = {
    path: string;
    first: boolean;
    object: any;
    start: LinkList<NodeData>;
    end: LinkList<NodeData>;
    is_expand: boolean;
    expand_depth: number;
    expand_ref?: any
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

    const stateGetter = createMemorizeMap((...path) => ({
        first: true,
        object: undefined,
        path: path.join("."),
        expand_depth: 0,
        is_expand: true,
        // ref_expand: undefined,
    }) as NodeWalkState)

    let currentExpandMap: Record<PropertyKey, any> = {}

    const visiting = new WeakSet();

    const walkingInternal = (
        object: any,
        expand_depth: number,
        enumerable: boolean,
        paths: PropertyKey[],
        expandMap: Record<PropertyKey, any> | undefined,
    ): [LinkList<NodeData> | undefined, LinkList<NodeData> | undefined] => {

        if (expand_depth < 0) {
            throw new Error("expand_depth must be non-negative");
        }

        const isRefObject = isRef(object)
        const isCircular = isRefObject && visiting.has(object);
        const shouldTrackCircular = isRefObject && !isCircular;

        const isDefaultExpand = isRefObject && !isCircular && expand_depth > paths.length

        const is_expand = !isCircular && !!(expandMap ?? isDefaultExpand)

        const expand_ref = is_expand && expandMap

        const state = stateGetter(...paths)

        if (
            state.first
            || state.object !== object
            || state.is_expand !== is_expand
            || state.expand_depth !== expand_depth
            || state.expand_ref !== expand_ref
        ) {

            try {
                state.first = false;
                state.object = object;
                state.is_expand = is_expand;
                state.expand_depth = expand_depth;
                state.expand_ref = expand_ref

                shouldTrackCircular && visiting.add(object);

                state.start = state.end = new LinkList<NodeData>(
                    new NodeData(
                        object,
                        enumerable,
                        paths,
                        isCircular,
                        state,
                    )
                );

                let currentLink = state.start;

                const { mark, clean } = stateGetter.checkUnusedKeyAndDeletes(...paths)

                if (!isCircular && is_expand && isRef(object)) {

                    for (let { key, value, enumerable } of getEntries(object)) {

                        mark(key);


                        const [start, end] = walkingInternal(
                            value, expand_depth, enumerable,
                            [...paths, key],
                            expandMap?.[key],
                        );

                        if (!start || !end) {
                            throw new Error("!start || !end")
                        }

                        currentLink.next = start;
                        start.prev = currentLink;

                        currentLink = end;
                    }
                }

                clean()

                state.end = currentLink;

                state.end.next = new LastNode(undefined as any, state.end, undefined);

                state.start.prev = new FirstNode(undefined as any, undefined, state.start);


            } finally {
                shouldTrackCircular && visiting.delete(object);
            }


            return [state.start, state.end];
        } else if (state.start && state.end) {
            return [state.start, state.end];
        } else {
            throw new Error("Invalid Walk Into");
        }
    };

    const walking = (object: any, expand_depth: number) => walkingInternal(
        object,
        expand_depth,
        true,
        [],
        currentExpandMap,
    )

    const walkingSwap = (
        paths: PropertyKey[] = [],
    ) => {

        const allVisited = paths
            .reduce(
                (visiteds, path) => [...visiteds, visiteds.at(-1)?.[path]],
                [stateGetter().object]
            )
            .slice(0, -1)
            .filter(isRef)


        const expandMap = paths
            .reduce(
                (map, path) => map?.[path],
                currentExpandMap
            )


        const state = stateGetter(...paths)

        if (!state.start || !state.end) {
            throw new Error("Invalid state: missing start or end nodes");
        }



        allVisited
            .forEach((object) => visiting.add(object))

        try {

            const head = state.start.prev;
            const tail = state.end.next;

            const [startAfter, endAfter] = walkingInternal(
                state.object,
                state.expand_depth,
                true,
                paths,
                expandMap,
            )

            if (startAfter === endAfter) {
                state.start = state.end = startAfter!;
                head!.next = startAfter;
                tail!.prev = startAfter;
                startAfter!.prev = head
                startAfter!.next = tail
            } else {
                state.start = startAfter!;
                state.end = endAfter!;

                head!.next = startAfter;
                startAfter!.prev = head!;

                tail!.prev = endAfter
                endAfter!.next = tail
            }


        } finally {
            allVisited
                .forEach((object) => visiting.delete(object))
        }



    };

    const toggleExpand = (
        ...paths: PropertyKey[]
    ) => {

        currentExpandMap = immutableNestedUpdate(
            currentExpandMap,
            expand => !(expand ?? stateGetter(...paths).is_expand),
            paths,
        )

        walkingSwap(paths);

    }

    return {
        walking,
        toggleExpand,
    };
};


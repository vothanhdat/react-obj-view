import { createMemorizeMap } from "../utils/createMemorizeMap";
import { isRef } from "../utils/isRef";
import { getEntries } from "./getEntries";
import { FirstNode, LastNode, LinkList } from "./LinkList";

type NodeWalkState = {
    path: string;
    first: boolean;
    object: any;
    start: LinkList<NodeData>;
    end: LinkList<NodeData>;
    is_expand: boolean;
    expand_depth: number;
    ref_expand: any
};



export class NodeData {
    constructor(
        public name: PropertyKey,
        public value: any,
        public path: string,
        public depth: number,
        public enumerable: boolean,
        public paths: PropertyKey[],
        public walkState: NodeWalkState,
        public isCircular: boolean,
    ) { }

    get hasChild() {
        return isRef(this.value)
    }
}

export const expandSymbol: unique symbol = Symbol("expand")
export const expandRefSymbol: unique symbol = Symbol("expandRef")

export const walkingFactory = () => {

    const stateGetter = createMemorizeMap((...path) => ({
        first: true,
        object: undefined,
        path: path.join("."),
        expand_depth: 0,
        is_expand: true,
        ref_expand: undefined,
    }) as NodeWalkState)

    const currentExpandMap = new Map()

    const visiting = new WeakSet();

    const walkingInternal = (
        object: any,
        expand_depth: number,
        enumerable: boolean = true,
        paths: any[] = [],
        expandMap = currentExpandMap,
    ): [LinkList<NodeData> | undefined, LinkList<NodeData> | undefined] => {

        if (expand_depth < 0) {
            throw new Error("expand_depth must be non-negative");
        }

        const isCircular = isRef(object) && visiting.has(object);

        const isDefaultExpand = !isCircular && expand_depth > paths.length

        const is_expand = !isCircular && ((expandMap?.get(expandSymbol) as boolean) ?? isDefaultExpand)

        const ref_expand = is_expand && (expandMap?.get(expandRefSymbol) as any)

        const state = stateGetter(...paths)

        const shouldTrackCircular = isRef(object) && !isCircular;

        if (
            state.first
            || state.object !== object
            || state.is_expand !== is_expand
            || state.expand_depth !== expand_depth
            || state.ref_expand !== ref_expand
        ) {

            try {
                shouldTrackCircular && visiting.add(object);


                state.first = false;
                state.object = object;
                state.is_expand = is_expand;
                state.expand_depth = expand_depth;
                state.ref_expand = ref_expand;

                state.start = state.end = new LinkList<NodeData>(
                    new NodeData(
                        paths.at(-1),
                        object,
                        paths.join("/"),
                        paths.length,
                        enumerable,
                        [...paths],
                        state,
                        isCircular,
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
                            expandMap?.get(key),
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
                (map, path) => map instanceof Map && map?.get(path),
                currentExpandMap as any
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

        let current = currentExpandMap

        for (let path of paths) {

            if (!current.has(path)) {
                current.set(path, new Map());
            }
            current.set(expandRefSymbol, Math.random());

            current = current!.get(path)
        }

        const nextExpand = !(
            current?.get(expandSymbol)
            ?? stateGetter(...paths).is_expand
        );

        current?.set(expandSymbol, nextExpand);

        walkingSwap(paths);
    }


    return {
        walking,
        toggleExpand,
    };
};


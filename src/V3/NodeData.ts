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

export const expandSymbol = Symbol("expand")
export const expandRefSymbol = Symbol("expandRef")
export type ExpandMap = Map<
    PropertyKey | typeof expandSymbol | typeof expandRefSymbol,
    ExpandMap | boolean
> | undefined

export const walkAsLinkList = (

) => {

    const stateGetter = createMemorizeMap((...path) => ({
        first: true,
        object: undefined,
        path: path.join("."),
        expand_depth: 0,
        is_expand: true,
        ref_expand: undefined,
    }) as NodeWalkState)

    const visiting = new WeakSet();

    const walking = (
        object: any,
        enumerable: boolean = true,
        expand_depth: number,
        paths: any[] = [],
        expandMap: ExpandMap,
    ): [LinkList<NodeData> | undefined, LinkList<NodeData> | undefined] => {

        if (expand_depth < 0) {
            throw new Error("expand_depth must be non-negative");
        }

        const isCircular = isRef(object) && visiting.has(object);

        const isDefaultExpand = !isCircular && expand_depth > paths.length

        const is_expand = !isCircular && ((expandMap?.get(expandSymbol) as boolean) ?? isDefaultExpand)

        const ref_expand = is_expand && (expandMap?.get(expandRefSymbol) as any)

        const state = stateGetter(...paths)

        if (state.is_expand && !is_expand) {
            stateGetter.clearAllChild(...paths);
        }

        if (
            state.first
            || state.object !== object
            || is_expand !== state.is_expand
            || expand_depth !== state.expand_depth
            || ref_expand !== state.ref_expand
        ) {
            isRef(object) && !isCircular && visiting.add(object);

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

            if (!isCircular && is_expand && isRef(object)) {

                for (let { key, value, enumerable } of getEntries(object)) {

                    paths.push(key);

                    const [start, end] = walking(
                        value, enumerable, expand_depth, paths,
                        expandMap?.get(key) as ExpandMap,
                    );

                    paths.pop();

                    if (!start || !end) {
                        throw new Error("!start || !end")
                    }

                    currentLink.next = start;
                    start.prev = currentLink;

                    currentLink = end;
                }
            }

            state.end = currentLink;

            state.end.next = new LastNode(undefined as any, state.end, undefined);

            state.start.prev = new FirstNode(undefined as any, undefined, state.start);

            isRef(object) && !isCircular && visiting.delete(object);

            return [state.start, state.end];
        } else if (state.start && state.end) {
            return [state.start, state.end];
        } else {
            throw new Error("Invalid Walk Into");
        }
    };

    const walkingSwap = (
        object: any,
        enumerable: boolean = true,
        expand_depth: number,
        paths: PropertyKey[] = [],
        expandMap: ExpandMap,
    ) => {

        const allVisited = paths
            .reduce(
                (visiteds, path) => [...visiteds, visiteds.at(-1)?.[path]],
                [stateGetter().object]
            )
            .slice(0, -1)


        const state = stateGetter(...paths)

        if (state.start && state.end) {
            allVisited
                .filter(isRef)
                .forEach((object) => visiting.add(object))

            const head = state.start.prev;
            const tail = state.end.next;

            const [startAfter, endAfter] = walking(
                object,
                enumerable,
                expand_depth,
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


            allVisited
                .filter(isRef)
                .forEach((object) => visiting.delete(object))

        }

    };

    return { walking, walkingSwap, stateGetter };
};


const logNext = (e: LinkList<NodeData>, tag: string, max = 50) => {
    let list = []
    let c: any = e
    while (c && list.length < max) {
        c.obj && list.push([c.idx, c.obj.paths.join(">")]);
        c = c.next;
    }
    console.log(tag, list)
    return list
}
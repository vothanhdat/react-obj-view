import { createMemorizeMap } from "../utils/createMemorizeMap";
import { isRef } from "../utils/isRef";
import { getEntries } from "./getEntries";
import { LinkList } from "./LinkList";

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

        const is_expand = (expandMap?.get(expandSymbol) as boolean) ?? (expand_depth > paths.length)

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
                )
            );

            let currentLink = state.start;

            if (is_expand && isRef(object)) {

                for (let { key, value, enumerable } of getEntries(object)) {

                    paths.push(key);

                    const [start, end] = walking(
                        value, enumerable, expand_depth, paths,
                        expandMap?.get(key) as ExpandMap,
                    );

                    paths.pop();

                    if (!start || !end) {
                        continue;
                    }

                    currentLink.next = start;
                    currentLink = end;
                }
            }

            currentLink.next = undefined;

            state.end = currentLink;


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
        paths: any[] = [],
        expandMap: ExpandMap,
    ) => {

        // console.log(stateGetter([]))
        // console.log(paths)
        // logNext(stateGetter().start, "ROOT BEFORE")

        const state = stateGetter(...paths)

        if (state.start && state.end) {
            // logNext(state.start, "BEFORE")
            const prevStart = state.start
            const prevNext = state.end?.next;

            const [postStart, postEnd] = walking(
                object,
                enumerable,
                expand_depth,
                paths,
                expandMap,
            )

            // prevStart.obj = postStart!.obj;
            // prevStart.next = postStart!.next;

            state.end = postEnd!;
            state.start = prevStart!;
            state.end.next = prevNext;
            state.start.obj = postStart!.obj;
            state.start.next = postStart!.next;

            // logNext(state.start, "PREV")


        }

        // logNext(stateGetter().start, "ROOT AFTER")

        // console.log(stateGetter.rootMap)



    };

    return { walking, walkingSwap, stateGetter };
};


const logNext = (e: LinkList<NodeData>, tag: string, max = 50) => {
    let list = []
    let c: any = e
    while (c && list.length < max) {
        list.push([c.idx, c.obj.paths.join(">")]);
        c = c.next;
    }
    console.log(tag, list)
    return list
}
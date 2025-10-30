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
    ) { }

    get hasChild() {
        return isRef(this.value)
    }
}

export const expandSymbol = Symbol("expand")
export const expandRefSymbol = Symbol("expandRef")

export const walkAsLinkList = (
    stateGetter = createMemorizeMap((...path) => ({
        first: true,
        object: undefined,
        path: path.join("."),
        expand_depth: 0,
        is_expand: true,
        ref_expand: undefined,
    }) as NodeWalkState)
) => {

    const walking = (
        object: any,
        enumerable: boolean = true,
        expand_depth: number,
        paths: any[] = [],
        expandMap: Map<any, any> | undefined,
    ): [LinkList<NodeData> | undefined, LinkList<NodeData> | undefined] => {

        if (expand_depth < 0) {
            throw new Error("expand_depth must be non-negative");
        }


        const is_expand = expandMap?.get(expandSymbol) ?? (expand_depth > paths.length)

        const ref_expand = is_expand && expandMap?.get(expandRefSymbol)

        const state = stateGetter(...paths)

        if (state.is_expand && !is_expand) {
            stateGetter.clearAllChild(...paths);
        }

        if (
            state.first
            || state.object !== object
            || is_expand != state.is_expand
            || expand_depth !== state.expand_depth
            || ref_expand != state.ref_expand
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
                )
            );

            let currentLink = state.start;

            if (is_expand && isRef(object)) {

                for (let { key, value, enumerable } of getEntries(object)) {

                    paths.push(key);

                    const [start, end] = walking(
                        value, enumerable, expand_depth, paths,
                        expandMap?.get(key),
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

    return { walking };
};

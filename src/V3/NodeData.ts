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
    expand_depth: number;
};



export class NodeData {
    constructor(
        public name: PropertyKey,
        public value: any,
        public path: string,
        public depth: number,
        public enumerable: boolean,
    ) { }
}

export const walkAsLinkList = (
    stateGetter = createMemorizeMap((...path) => ({
        first: true,
        object: undefined,
        path: path.join("."),
        expand_depth: 0,
    }) as NodeWalkState)
) => {

    const walking = (
        object: any,
        enumerable: boolean = true,
        expand_depth: number,
        paths: any[] = [],
    ): [LinkList<NodeData> | undefined, LinkList<NodeData> | undefined] => {

        if (expand_depth < 0) {
            throw new Error("expand_depth must be non-negative");
        }

        const is_expand = expand_depth >= paths.length

        if (!is_expand) {
            stateGetter.clear(...paths);
            return [undefined, undefined]
        }

        const state = stateGetter(...paths)

        if (state.first || state.object !== object || expand_depth !== state.expand_depth) {

            state.first = false;
            state.object = object;
            state.expand_depth = expand_depth;

            state.start = state.end = new LinkList<NodeData>(
                new NodeData(
                    paths.at(-1),
                    object,
                    paths.join("/"),
                    paths.length,
                    enumerable,
                )
            );

            let currentLink = state.start;

            if (isRef(object)) {
                for (let { key, value, enumerable } of getEntries(object)) {

                    paths.push(key);

                    const [start, end] = walking(value, enumerable, expand_depth, paths);

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

    return walking;
};

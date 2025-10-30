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
        is_expand: true,
        expand_depth: 0
    }) as NodeWalkState)
) => {
    
    // Add JSDoc for clarity
    /**
     * @param expand_depth - Maximum depth to expand (inclusive). 
     *                       0 = only root, 1 = root + children, etc.
     */
    const walking = (
        object: any,
        enumerable: boolean = true,
        expand_depth: number,
        paths: any[] = [],
    ): [LinkList<NodeData>, LinkList<NodeData>] => {

        const state = stateGetter(...paths)

        const is_expand = paths.length <= expand_depth

        if (state.first || state.object !== object || is_expand !== state.is_expand || expand_depth !== state.expand_depth) {

            state.first = false;
            state.object = object;
            state.is_expand = is_expand;
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

            if (state.is_expand && isRef(object)) {
                for (let { key, value, enumerable } of getEntries(object)) {
                    paths.push(key);

                    const [start, end] = walking(value, enumerable, expand_depth, paths);

                    if (!start || !end) {
                        console.log({ value, start, end });
                        throw new Error("Invalid Walking");
                    }

                    paths.pop();
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

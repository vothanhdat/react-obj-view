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
};



export class NodeData {
    constructor(
        public name: any,
        public value: any,
        public path: any,
        public depth: number,
        public enumrable: boolean,
    ) { }
}

export const walkAsLinkList = (
    stateGetter = createMemorizeMap((...path) => ({
        first: true,
        object: undefined,
        path: path.join("."),
    }) as NodeWalkState)
) => {

    const walking = (
        object: any,
        enumrable: boolean = true,
        paths: any[] = ["root"],
        state = stateGetter(...paths)
    ): [LinkList<NodeData>, LinkList<NodeData>] => {

        if (state.first || state.object !== object) {
            state.first = false;
            state.object = object;
            state.start = state.end = new LinkList<NodeData>(
                new NodeData(
                    paths.at(-1),
                    object,
                    paths.join("/"),
                    paths.length,
                    enumrable,
                )
            );

            let currentLink = state.start;

            if (isRef(object)) {
                for (let { key, value, enumrable } of getEntries(object)) {
                    paths.push(key);

                    const [start, end] = walking(value, enumrable, paths);

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
        } else if (state.start, state.end) {
            return [state.start, state.end];
        } else {
            throw new Error("Invalid Walk Into");
        }
    };

    return walking;
};

import { createMemorizeMap } from "../utils/createMemorizeMap";
import { getEntriesOrignal } from "./getEntries";



export interface LinkedNode<T> {
    obj: T | undefined,
    idx: number,
    prev: LinkedNode<T> | undefined,
    next: LinkedNode<T> | undefined,
}

let counter = 0;

export class LinkingNode<T> implements LinkedNode<T> {
    public obj: T | undefined = undefined;
    public idx = counter++;
    constructor(
        public prev: LinkedNode<T> | undefined = undefined,
        public next: LinkedNode<T> | undefined = undefined,
    ) { }

}


export class LinkedDataNode<T> implements LinkedNode<T> {
    public idx = counter++;
    constructor(
        public obj: T | undefined = undefined,
        public prev: LinkedNode<T> | undefined = undefined,
        public next: LinkedNode<T> | undefined = undefined,
    ) { }
}

const insertNodeBefore = <T>(
    cursor: LinkedNode<T>,
    newNode: LinkedNode<T>,
) => {

    cursor.prev!.next = newNode
    newNode.prev = cursor.prev

    newNode.next = cursor
    cursor.prev = newNode
}


const insertListsBefore = <T>(
    cursor: LinkedNode<T>,
    start: LinkedNode<T>,
    end: LinkedNode<T>,
) => {

    cursor.prev!.next = start
    start.prev = cursor.prev

    end.next = cursor
    cursor.prev = end
}

export const linkListToArray = <T>([start, end]: [LinkedNode<T> | undefined, LinkedNode<T> | undefined]): T[] => {
    let result: T[] = [];
    let current: LinkedNode<T> | undefined = start?.prev ?? start;
    while (current) {
        current.obj && result.push(current.obj);
        current = current.next;
    }
    return result;
};


class NodeData {

    constructor(
        public readonly paths: PropertyKey[],
        public readonly value: any,
        public readonly enumerable: boolean,
        public readonly isCircular: boolean,
    ) { }

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


type WalkingState = {
    inited: boolean,
    value: unknown;
    start?: LinkedNode<NodeData>;
    end?: LinkedNode<NodeData>;
}


type DataEntry = {
    name: PropertyKey,
    value: unknown
}

type StackProcess<T> = {
    data: T,
    depth: number,
    paths: PropertyKey[],
    iterator: Iterator<T, void, unknown>,
    stage: Stage,
    cursor: LinkedNode<NodeData>,
    state?: WalkingState | undefined
}

enum Stage { INIT, ITERATE, FINAL }

type StateGetter = ReturnType<typeof createMemorizeMap<(...paths: PropertyKey[]) => WalkingState>>

export const walkingFactoryV4 = () => {

    const stateGetter: StateGetter = createMemorizeMap((...paths): WalkingState => ({
        inited: false,
        value: undefined,
    }));


    const getIterator = (value: any, config: any) => getEntriesOrignal(value, config)
        .map(({ key: name, value }) => ({ name, value }))


    const walking = (
        value: unknown,
        config: any,
    ) => {
        let rootName = ""
        let count = 0;
        
        const stack: StackProcess<DataEntry>[] = []

        const startLink = new LinkingNode<NodeData>()
        const endLink = new LinkingNode<NodeData>()

        startLink.next = endLink;
        endLink.prev = startLink;

        const rootPaths = [rootName]

        stack.push({
            data: { value, name: rootName, },
            iterator: getIterator(value, config),
            paths: rootPaths,
            depth: 0,
            stage: Stage.INIT,
            cursor: endLink,
        })

        while (stack.length) {

            const current = stack.at(-1)!;

            switch (current.stage) {

                case Stage.INIT: {
                    initializeNode(current, stateGetter);
                    break;
                }
                case Stage.ITERATE: {
                    const newStacks = iterateThroughNode(current, getIterator, config);
                    stack.push(...newStacks)
                    break;
                }
                case Stage.FINAL: {
                    finnalizeNode(current);
                    stack.pop();
                    break;
                }
            }

            count++;
        }

        console.log({ count })

        return [startLink, endLink,]
    }

    return {
        walking
    }
}

const debugLink = (link: LinkedNode<any>) => {
    let current: LinkedNode<any> | undefined = link
    let max = 20;
    let ids: any[] = []
    while (current && max-- > 0) {
        ids.push(current.obj ? `(${current.idx})` : current.idx);
        current = current.next
    }
    return ids.join(" > ")
}



function initializeNode(
    current: StackProcess<DataEntry>,
    stateGetter: StateGetter,
) {
    const { data, paths, cursor } = current;

    const state = stateGetter(...paths);

    current.state = state

    if (!state.inited || state.value !== data.value) {

        state.inited = true;
        state.value = data.value;

        const newLink = new LinkedDataNode(
            new NodeData(
                paths,
                data.value,
                true,
                false
            )
        );

        const newLinker = new LinkingNode<NodeData>();

        insertNodeBefore(cursor, newLink);
        insertNodeBefore(cursor, newLinker);

        state.start = newLink;
        state.end = newLinker;

        current.stage = Stage.ITERATE;
    } else {
        if (!(state.end && state.start)) {
            throw new Error("Invalid State");
        }
        insertListsBefore(cursor, state.start!, state.end!);

        current.stage = Stage.FINAL;
    }
}


function iterateThroughNode(
    current: StackProcess<DataEntry>,
    getIterator: (value: any, config: any) => IteratorObject<{ name: string | number; value: any; }, undefined, unknown>,
    config: any
): StackProcess<DataEntry>[] {
    const newStacks: StackProcess<DataEntry>[] = [];
    const { iterator, paths, depth, state } = current;

    let { value: nextChild, done } = iterator.next();

    if (nextChild) {

        newStacks.push({
            data: nextChild,
            iterator: getIterator(nextChild.value, config),
            paths: [...paths, nextChild.name],
            depth: depth + 1,
            stage: Stage.INIT,
            cursor: state!.end!,
            state: undefined,
        });

    }

    if (done) {
        current.stage = Stage.FINAL;
    }

    return newStacks;
}


function finnalizeNode(current: StackProcess<DataEntry>) {
    const { iterator, data, paths, stage, depth, cursor, state } = current;

}


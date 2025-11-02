import { createMemorizeMap } from "../utils/createMemorizeMap";
import { WalkingConfig } from "../V3/NodeData";
import { CircularChecking } from "./CircularChecking";
import { LinkedNode } from "./LinkedNode";
import { NodeData } from "./NodeData";

export type WalkingState = {
    inited: boolean;
    value: unknown;
    start?: LinkedNode<NodeData>;
    end?: LinkedNode<NodeData>;

    expanded: boolean;
    expandedDepth: number;
    childStats?: ChildStats | undefined
}

export type DataEntry = {
    name: PropertyKey;
    value: unknown;
};

export type ChildStats = {
    childMaxDepth: number,
    childCanExpand: boolean,
}

export type StateCleanUp = { mark: (e: PropertyKey) => void, clean: () => void }


export type ProcessStack<T> = {
    data: T;
    depth: number;
    paths: PropertyKey[];
    iterator: Iterator<T, void, unknown>;
    // stage: Stage;
    cursor: LinkedNode<NodeData>;
    parentContext: ChildStats;
    context: SharingContext;
} & ({
    stage: Stage.INIT
    state?: WalkingState;
    hasChild?: boolean
    changed?: boolean
    stateCleanUp?: StateCleanUp
} | {
    stage: Stage.ITERATE,
    state: WalkingState;
    hasChild: boolean
    changed: boolean
    stateCleanUp: StateCleanUp
} | {
    stage: Stage.FINAL,
    state?: WalkingState;
    hasChild?: boolean
    changed?: boolean
    stateCleanUp?: StateCleanUp
} | {
    stage: Stage,
    changed: true
    state: WalkingState;
    hasChild: boolean
    stateCleanUp: StateCleanUp
})

export type SharingContext = {
    getIterator: (value: any, config: any) => IteratorObject<DataEntry, undefined, unknown>;
    config: WalkingConfig;
    cirular: CircularChecking,
    walkCounter: number,
}


export enum Stage {
    INIT, ITERATE, FINAL
}

export type StateGetter = ReturnType<typeof createMemorizeMap<(...paths: PropertyKey[]) => WalkingState>>;

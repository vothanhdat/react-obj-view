import { createMemorizeMap } from "../utils/createMemorizeMap";
import { memorizeMapWithWithClean } from "../utils/memorizeMapWithWithClean";
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
    state: WalkingState;

} & ({
    stage: Stage.INIT
    hasChild?: boolean
    changed?: boolean,
    stateGet?: (key: any) => WalkingState,
    stateClean?: () => void,
} | {
    stage: Stage.ITERATE,
    hasChild: boolean
    changed: boolean
    stateGet: (key: any) => WalkingState,
    stateClean: () => void,
} | {
    stage: Stage.FINAL,
    hasChild?: boolean
    changed?: boolean
    stateGet?: (key: any) => WalkingState,
    stateClean?: () => void,
} | {
    stage: Stage,
    changed: true
    hasChild: boolean
    stateGet: (key: any) => WalkingState,
    stateClean: () => void,
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
export type StateGetterV2 = ReturnType<typeof memorizeMapWithWithClean<(...paths: PropertyKey[]) => WalkingState>>;

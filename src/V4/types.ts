import { createMemorizeMap } from "../utils/createMemorizeMap";
import { memorizeMapWithWithClean } from "../utils/memorizeMapWithWithClean";
import { WalkingConfig } from "../V3/NodeData";
import { GetStateFn } from "../V5/StateFactory";
import { CircularChecking } from "./CircularChecking";
import { LinkedNode, LinkingNode } from "./LinkedNode";
import { NodeData } from "./NodeData";

export type WalkingState = {
    inited: boolean;
    data?: DataEntry;
    start?: LinkedNode<NodeData>;
    end?: LinkedNode<NodeData>;

    expanded: boolean;
    userExpanded?: boolean;
    expandedDepth: number;
    childStats?: ChildStats | undefined;
    updateToken?: any
}

export type DataEntry = {
    name: PropertyKey;
    value: unknown;
    enumerable: boolean;
};

export type ChildStats = {
    childMaxDepth: number,
    childCanExpand: boolean,
}

type BaseProcessStack<T> = {
    data: T;
    depth: number;
    paths: PropertyKey[];
    // iterator: Iterator<T, void, unknown>;
    // cursorStart: LinkedNode<NodeData>;
    cursor: LinkedNode<NodeData>;
    parentContext: ChildStats;
    context: SharingContext;
    state: WalkingState;
    isCircular?: boolean
}

type StateHelpers = {
    getChild: (key: any) => ReturnType<GetStateFn<WalkingState>>;
    cleanChild: () => void;
}

type InitStage = {
    stage: Stage.INIT;
    hasChild?: boolean;
    changed?: boolean;
} & Partial<StateHelpers>;

type IterateStage = {
    stage: Stage.ITERATE;
    hasChild: boolean;
    changed: boolean;
} & StateHelpers;

type FinalStage = {
    stage: Stage.FINAL;
    hasChild?: boolean;
    changed?: boolean;
} & Partial<StateHelpers>;

type ChangedStage = {
    stage: Stage;
    changed: true;
    hasChild: boolean;
} & StateHelpers;

export type ProcessStack<T> = BaseProcessStack<T> & (InitStage | IterateStage | FinalStage | ChangedStage);

export type SharingContext = {
    // getIterator: (value: any, config: any, cb: (k: PropertyKey, value: any, enumerable: boolean) => boolean) => void;
    config: WalkingConfig;
    cirular: CircularChecking,
    walkCounter: number,
    updateToken: any
}


export enum Stage { INIT, ITERATE, FINAL }

export type StateGetter = ReturnType<typeof createMemorizeMap<(...paths: PropertyKey[]) => WalkingState>>;
export type StateGetterV2 = ReturnType<typeof memorizeMapWithWithClean<(...paths: PropertyKey[]) => WalkingState>>; export type LinkedList<T> = Record<'start' | 'end', LinkingNode<T>>;


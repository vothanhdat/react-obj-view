import { createMemorizeMap } from "../utils/createMemorizeMap";
import { WalkingConfig } from "../V3/NodeData";
import { LinkedNode } from "./LinkedNode";
import { NodeData } from "./NodeData";

export type WalkingState = {
    inited: boolean;
    value: unknown;
    start?: LinkedNode<NodeData>;
    end?: LinkedNode<NodeData>;
};

export type DataEntry = {
    name: PropertyKey;
    value: unknown;
};

export type ProcessStack<T> = {
    data: T;
    depth: number;
    paths: PropertyKey[];
    iterator: Iterator<T, void, unknown>;
    stage: Stage;
    cursor: LinkedNode<NodeData>;
    state?: WalkingState | undefined;
    context: SharingContext
};

export type SharingContext = {
    getIterator: (value: any, config: any) => IteratorObject<DataEntry, undefined, unknown>;
    config: WalkingConfig;
}


export enum Stage {
    INIT, ITERATE, FINAL
}

export type StateGetter = ReturnType<typeof createMemorizeMap<(...paths: PropertyKey[]) => WalkingState>>;

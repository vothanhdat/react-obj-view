import React from "react";



export type Constructor<T = {}> = new (...args: any[]) => T;

export type ResolverFn = (e: any, entries: Generator<Entry>, isPreview: boolean) => Generator<Entry>

export type JSONViewCtx = {
    expandLevel: number;
    expandRef: React.RefObject<Record<string, boolean>>;
    preview: boolean;
    nonEnumerable: boolean;
    resolver: Map<any, ResolverFn>;
    arrayGroupSize: number
    objectGroupSize: number
    highlightUpdate: boolean
};


export type ObjectRenderProps = {
    name: string;
    isNonenumerable: boolean;
    value: any;
    path: string;
    level: number;
    context: JSONViewCtx;
    renderName?: boolean;
    traces: any[],
};

export type ObjectViewProps = {
    value: any;
    name?: string;
    style?: any;
    expandLevel?: number | boolean;
    objectGroupSize?: number;
    arrayGroupSize?: number;
    resolver?: Map<any, ResolverFn>
    highlightUpdate?: boolean
    preview?: boolean,
    nonEnumerable?: boolean,
};


export type Entry = {
    key: PropertyKey
    value: unknown,
    enumerable: boolean
};


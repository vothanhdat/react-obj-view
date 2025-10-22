import React from "react";

export type JSONViewProps = {
    value: any;
    path?: string[];
    trace?: any[];
    name?: string;
    expandLevel: number | boolean;
    currentType?: any;
    isGrouped?: boolean;
    displayName?: boolean;
    seperator?: string;
    context: JSONViewCtx;
};

export type Constructor<T = {}> = new (...args: any[]) => T;

export type JSONViewCtx = {
    expandRootRef: React.RefObject<Record<string, boolean>>;
    customView: CustomViewMap
    objectGrouped: number;
    arrayGrouped: number;
    highlightUpdate: boolean;
};

export type CustomViewMap = Map<Constructor, React.FC<JSONViewProps>>

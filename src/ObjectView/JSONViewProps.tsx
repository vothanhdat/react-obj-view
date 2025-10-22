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

export type JSONViewCtx = {
    expandRootRef: React.RefObject<Record<string, boolean>>;
    objectGrouped: number;
    arrayGrouped: number;
};

import { RefObject } from "react";
import type { FlattenNodeData, ReactTreeRowRenderProps } from "../libs/react-tree-view";
import { type ResolverFn, type ObjectWalkingAdater, type ObjectWalkingMetaParser } from "../object-tree";
import { ThemeColor } from "../react-obj-view-themes";


export type RenderOptions = {
    enablePreview: boolean;
    highlightUpdate: boolean;
    resolver: Map<any, ResolverFn>;
    showLineNumbers: boolean;
    includeSymbols: boolean;
    nonEnumerable: boolean;
    onMouseEnter: (index: number) => void;
    onMouseLeave: (index: number) => void;
    actionRenders?: React.FC<ObjectViewRenderRowProps>;
    search?: { markTerm?: string | RegExp, filterFn?: (value: any, key: any, paths: any[]) => boolean };
    enableMark?: boolean;
};

export type ObjectViewRenderRowProps = ReactTreeRowRenderProps<
    ObjectWalkingAdater,
    ObjectWalkingMetaParser,
    RenderOptions
>


export type ObjectViewProps = {
    valueGetter: () => unknown;
    name?: string;

    expandLevel?: number | boolean;
    objectGroupSize?: number; // >= 2 or no grouping. Groups are collapsed by default.
    arrayGroupSize?: number; // >= 2 or no grouping. Groups are collapsed by default.
    resolver?: Map<any, ResolverFn>;
    highlightUpdate?: boolean;
    stickyPathHeaders?: boolean;
    preview?: boolean;
    nonEnumerable?: boolean;
    showLineNumbers?: boolean;
    includeSymbols?: boolean;

    style?: React.CSSProperties | ThemeColor;
    lineHeight?: number;
    className?: string;
    actionRenders?: React.FC<ObjectViewRenderRowProps>,
    iterateSize?: number;
    ref?: RefObject<ObjectViewHandle | undefined>
};

export interface SearchOptionBase {
    iterateSize?: number;
    maxDepth?: number;
    fullSearch?: boolean;
    maxResult?: number;
}

export interface SearchOptions extends SearchOptionBase {
    normalizeSymbol?: (e: string) => string;
}

export interface ObjectViewHandle {
    search: (
        filterFn: ((value: unknown, key: PropertyKey, paths: PropertyKey[]) => boolean) | undefined,
        markTerm: string | RegExp | undefined,
        onResult: (results: PropertyKey[][]) => void,
        options?: SearchOptionBase
    ) => Promise<void>;
    scrollToPaths: (paths: PropertyKey[], options?: ScrollOptions, offsetTop?: number, offsetBottom?: number) => Promise<void>;
}


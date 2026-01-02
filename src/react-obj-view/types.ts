import { RefObject } from "react";
import type { ReactTreeRowRenderProps } from "../libs/react-tree-view";
import { type ResolverFn, type ObjectWalkingAdapter, type ObjectWalkingMetaParser } from "../object-tree";
import { ThemeColor } from "../react-obj-view-themes";
import { CustomAction } from "./actions/types";




export type RenderOptions = {
    enablePreview: boolean;
    highlightUpdate: boolean;
    resolver: Map<any, ResolverFn>;
    showLineNumbers: boolean;
    includeSymbols: boolean;
    nonEnumerable: boolean;
    onMouseEnter: (index: number) => void;
    onMouseLeave: (index: number) => void;
    
    /**
     * @deprecated Use `customActions` instead. 
     */
    actionRenders?: React.FC<ObjectViewRenderRowProps>;
    customActions?: CustomAction[]
    search?: { markTerm?: string | RegExp, filterFn?: (value: any, key: any, paths: any[]) => boolean };
    enableMark?: boolean;
};

export type ObjectViewRenderRowProps = ReactTreeRowRenderProps<
    ObjectWalkingAdapter,
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
    overscan?:number;
    className?: string;

    /**
     * @deprecated Use `customAction` instead. 
     */
    actionRenders?: React.FC<ObjectViewRenderRowProps>,

    customActions?: CustomAction<any>[]

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
    search(
        filterFn: ((value: unknown, key: PropertyKey, paths: PropertyKey[]) => boolean) | undefined,
        markTerm: string | RegExp | undefined,
        onResult: (results: PropertyKey[][]) => void,
        options?: SearchOptionBase
    ): Promise<void>;
    search(): Promise<void>;
    scrollToPaths: (paths: PropertyKey[], options?: ScrollOptions, offsetTop?: number, offsetBottom?: number) => Promise<void>;
}


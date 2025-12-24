import { RefObject } from "react";
import type { FlattenNodeData, ReactTreeRowRenderProps } from "../libs/react-tree-view";
import { type ResolverFn, type ObjectWalkingAdater, type ObjectWalkingMetaParser, parseWalkingMeta } from "../object-tree";
import { ThemeColor } from "../react-obj-view-themes";
import { WalkingMeta } from "../object-tree/types";




export type CustomAction<T = {}> = {

    name: string,
    /**
     * 
     * @param nodeData 
     * @returns <T> null/false/undefined incase action not available and row will skip render this action
     */
    prepareAction(
        nodeData: FlattenNodeData<ObjectWalkingAdater, typeof parseWalkingMeta>
    ): T | null | false | undefined,

    dependency?(
        nodeData: FlattenNodeData<ObjectWalkingAdater, typeof parseWalkingMeta>
    ): any[],

    performAction(
        preparedAction: T,
        nodeData: FlattenNodeData<ObjectWalkingAdater, typeof parseWalkingMeta>,
    ): Promise<void>

    actionRender: React.ReactNode | React.FC<T>,
    actionRunRender: React.ReactNode | React.FC<T>,
    actionErrorRender?: React.ReactNode | React.FC<T & { error: any }>,
    actionSuccessRender?: React.ReactNode | React.FC<T>,
    resetTimeout?: number
}


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

    /**
     * @deprecated Use `customAction` instead. 
     */
    actionRenders?: React.FC<ObjectViewRenderRowProps>,

    customActions?: CustomAction[]

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
    search: ((
        filterFn: ((value: unknown, key: PropertyKey, paths: PropertyKey[]) => boolean) | undefined,
        markTerm: string | RegExp | undefined,
        onResult: (results: PropertyKey[][]) => void,
        options?: SearchOptionBase
    ) => Promise<void>) | (() => Promise<void>);
    scrollToPaths: (paths: PropertyKey[], options?: ScrollOptions, offsetTop?: number, offsetBottom?: number) => Promise<void>;
}


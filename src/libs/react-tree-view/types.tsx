import React from "react";
import type { useReactTree } from "./useReactTree";
import type { WalkingAdaperBase, InferWalkingInstance, InferWalkingType } from "../tree-core";
import type { VirtualScrollerRenderProps } from "../virtual-scroller/types";
import type { MetaParserBase, FlattenNodeData } from "./FlattenNodeWrapper";



export type ReactTreeHookParams<
    T extends WalkingAdaperBase,
    MetaParser extends MetaParserBase<T>
> = {
    factory: () => InferWalkingInstance<T>;
    config: InferWalkingType<T>['Config'];
    expandDepth: number;
    value: InferWalkingType<T>['Value'];
    name: InferWalkingType<T>['Key'];
    metaParser: MetaParser;
    iterateSize?: number;
};

export type ReactTreeRowRenderProps<
    T extends WalkingAdaperBase,
    MetaParser extends MetaParserBase<T>,
    RenderOptions = {}
> = {
    renderIndex: number;
    nodeDataWrapper: () => FlattenNodeData<T, MetaParser>;
    valueWrapper: () => InferWalkingType<T>['Value'];
    options: RenderOptions;
    actions: {
        refreshPath: () => void;
        toggleChildExpand: () => void;
    };
};

export type ReactTreeViewProps<
    T extends WalkingAdaperBase,
    MetaParser extends MetaParserBase<T>,
    RenderOptions
> = ReturnType<typeof useReactTree<T, MetaParser>> & {
    lineHeight: number;
    options: RenderOptions;
    RowRenderer: React.FC<ReactTreeRowRenderProps<T, MetaParser, RenderOptions>>;
    containerDivProps?: React.HTMLAttributes<HTMLDivElement>;
    rowDivProps?: React.HTMLAttributes<HTMLDivElement>;
    stickyPathHeaders?: boolean,
    showLineNumbers?: boolean,
};

export type ReactTreeViewVitualRenderProps<
    T extends WalkingAdaperBase,
    MetaParser extends MetaParserBase<T>,
    RenderOptions
> = VirtualScrollerRenderProps<Omit<
    ReactTreeViewProps<T, MetaParser, RenderOptions>, 'containerDivProps'
>>;

import React, { ReactNode, useMemo } from "react";
import { useWrapper } from "./useWrapper";
import type { WalkingAdaperBase } from "../libs/tree-core";
import type { MetaParserBase, FlattenNodeWrapper, FlattenNodeData } from "./FlattenNodeWrapper";
import type { ReactTreeRowRenderProps } from "./types";



export const VirtualScrollRowRender: <
    T extends WalkingAdaperBase,
    MetaParser extends MetaParserBase<T>,
    RenderOptions
>(props: {
    index: number;
    size: number;
    getNodeByIndex: (index: number) => FlattenNodeWrapper<T, MetaParser>;
    toggleChildExpand: ({ paths }: FlattenNodeData<T, MetaParser>) => void;
    refreshPath: ({ paths }: FlattenNodeData<T, MetaParser>) => void;
    options: RenderOptions;
    RowRender: React.FC<ReactTreeRowRenderProps<T, MetaParser, RenderOptions>>;
}) => ReactNode = ({
    RowRender,
    index,
    options,
    size,
    getNodeByIndex,
    toggleChildExpand,
    refreshPath
}) => {

        const flattenNodeWrapper = useMemo(
            () => index < size ? getNodeByIndex(index) : undefined,
            [index < size, index, getNodeByIndex]
        );

        const flattenNodeData = useMemo(
            () => (flattenNodeWrapper?.getData())!,
            [flattenNodeWrapper?.state?.updateStamp]
        );

        const nodeDataWrapper = useWrapper(flattenNodeData!);

        const valueWrapper = useWrapper(flattenNodeData?.value);

        const actions = useMemo(
            () => ({
                refreshPath: toggleChildExpand.bind(undefined, flattenNodeData),
                toggleChildExpand: refreshPath.bind(undefined, flattenNodeData),
            }),
            [
                flattenNodeData,
                toggleChildExpand,
                refreshPath,
            ]
        );

        return flattenNodeData && <RowRender
            nodeDataWrapper={nodeDataWrapper}
            valueWrapper={valueWrapper}
            options={options}
            renderIndex={index}
            actions={actions} />;
    };

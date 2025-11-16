import React, { ReactNode, useMemo } from "react";
import { useWrapper } from "../hooks/useWrapper";
import { WalkingAdaperBase, InferWalkingType } from "../tree-core";
import { MetaParserBase, FlattenNodeWrapper } from "./FlattenNodeWrapper";
import { ReactTreeRowRenderProps } from "./types";



export const VirtualScrollRowRender: <
    T extends WalkingAdaperBase,
    MetaParser extends MetaParserBase<T>,
    RenderOptions
>(props: {
    index: number;
    size: number;
    getNodeByIndex: (index: number) => FlattenNodeWrapper<T, MetaParser>;
    toggleChildExpand: ({ paths }: { paths: InferWalkingType<T>['Key'][]; }) => void;
    refreshPath: ({ paths }: { paths: InferWalkingType<T>['Key'][]; }) => void;
    options: RenderOptions;
    RowRender: React.FC<ReactTreeRowRenderProps<T, MetaParser, RenderOptions>>;
}) => ReactNode = ({
    RowRender, index, options, size, getNodeByIndex, toggleChildExpand, refreshPath
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
                refreshPath: toggleChildExpand.bind(undefined, { paths: flattenNodeData?.paths }),
                toggleChildExpand: refreshPath.bind(undefined, { paths: flattenNodeData?.paths }),
            }),
            [
                flattenNodeData?.paths,
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

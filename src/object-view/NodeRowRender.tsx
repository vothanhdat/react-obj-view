import React, { useMemo } from "react";
import { useWrapper } from "../hooks/useWrapper";
import { RenderOptions, RenderNode } from "./components/RenderNode";
import { NodeResult } from "./walkingToIndexFactory";

export type NodeRenderProps = {
    index: number;
    size: number;
    getNodeByIndex: (index: number) => NodeResult;
    options: RenderOptions;
};
export const NodeRowRender: React.FC<NodeRenderProps> = ({ index, getNodeByIndex, options, size }) => {

    const nodeResult = index < size
        ? getNodeByIndex?.(index)
        : undefined;

    const nodeData = useMemo(
        () => nodeResult?.getData?.(),
        [nodeResult?.state?.updateStamp]
    );

    const nodeDataWrapper = useWrapper(nodeData!);

    const valueWrapper = useWrapper(nodeData?.value);

    return nodeData && <RenderNode
        {...{ nodeDataWrapper, valueWrapper, options, }}
        key={nodeData.path} />;
};

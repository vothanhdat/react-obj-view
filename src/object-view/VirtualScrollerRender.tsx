import React from "react";
import { NodeRenderProps, NodeRowRender } from "./NodeRowRender";

export type StickyInfo = {
    index: number;
    isStick: false;
    position?: number;
    isLastStick?: boolean;
} | {
    index: number;
    isStick: true;
    position: number;
    isLastStick?: boolean;
};


export const VirtualScrollerRender: React.FC<{
    start: number; end: number; offset: number;
    lineHeight: number;
    showLineNumbers: boolean;
    computeItemKey: (index: number) => string;
    computeActualRederKey: (index: number, startIndex: number) => StickyInfo;
} & NodeRenderProps> = ({
    start, end, offset, size, lineHeight, computeItemKey, showLineNumbers, getNodeByIndex, options, computeActualRederKey
}) => {
        let startIndexRaw = start / lineHeight;
        let startIndex = Math.floor(start / lineHeight);
        let endIndex = Math.min(size, Math.ceil(end / lineHeight));
        let renderSize = Math.min(Math.max(0, endIndex - startIndex), 500);

        let lineNumberSize = String(endIndex).length;

        return <>
            {new Array(renderSize)
                .fill(0)
                .map((_, i) => i + startIndex)
                .filter(index => index < size && index >= 0)
                .map(index => computeActualRederKey(index, startIndexRaw))
                .map((info, index, arr) => ({
                    ...info,
                    isLastStick: info.isStick && arr[index - 1] && !arr[index + 1].isStick
                } as StickyInfo))
                .map(({ isStick, index, isLastStick, position }) => <div
                    key={computeItemKey(index)}
                    className="row"
                    style={isStick ? {
                        position: "sticky",
                        top: `${position * lineHeight - offset}px`,
                        height: `${lineHeight}px`,
                        backgroundColor: "var(--bg-color)",
                        zIndex: Math.floor(100 - position),
                        borderBottom: isLastStick ? "solid 1px color-mix(in srgb, var(--color) 30%, transparent)" : ""
                    } : {
                        position: "absolute",
                        top: `${index * lineHeight}px`,
                        height: `${lineHeight}px`,
                    }}
                >
                    {showLineNumbers && <span className="line-number">
                        {String(index).padStart(lineNumberSize, " ")}:{" "}
                    </span>}
                    <NodeRowRender {...{ index: index, getNodeByIndex, options, size }} />
                </div>)}
        </>;
    };

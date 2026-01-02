import { useCallback, useMemo } from "react";
import { FlattenNodeWrapper } from "./FlattenNodeWrapper";

export type StickyInfo = {
    index: number;
    isStick: false;
    position?: number;
    isLastStick?: boolean;
    originalIndex: number;
} | {
    index: number;
    isStick: true;
    position: number;
    isLastStick?: boolean;
    originalIndex: number;
};


export const useRenderIndexesWithSticky = ({
    start, end, overscan = 100, childCount, lineHeight, getNodeByIndex, stickyHeader
}: {
    start: number; end: number;
    overscan?: number;
    childCount: number;
    lineHeight: number;
    stickyHeader: boolean;
    getNodeByIndex: (index: number) => FlattenNodeWrapper<any, any> | undefined;
}) => {

    let startIndexRaw = start / lineHeight;
    // let startIndex = Math.floor(start / lineHeight);
    let startIndex = Math.floor(Math.max(0, start - overscan) / lineHeight);
    let endIndex = Math.min(childCount, Math.ceil(Math.min(lineHeight * childCount, end + overscan) / lineHeight));
    let renderSize = Math.min(Math.max(0, endIndex - startIndex), 500);

    const computeStickyInfo = useCallback(
        (index: number, startIndexRaw: number): StickyInfo => {
            if (!stickyHeader)
                return { isStick: false, index: index, originalIndex: index };

            let starIndex = Math.floor(startIndexRaw);
            let delta = Math.floor(index - starIndex);

            let currentNode = index < childCount ? getNodeByIndex(index) : (undefined as never);
            let rIndex = (currentNode?.parentIndex?.[delta])!;

            if (rIndex >= 0 && (currentNode?.parentIndex?.length)! > delta) {
                let parentNode = getNodeByIndex(rIndex)!;
                let minPos = rIndex + parentNode.childCount - startIndexRaw - 1;
                let pos = Math.min(delta, minPos);
                if (parentNode.childCount > 1 && startIndexRaw > 0)
                    return { isStick: true, index: rIndex, position: pos, originalIndex: index };
            }
            return { isStick: false, index: index, originalIndex: index };
        },
        [getNodeByIndex, stickyHeader, childCount]
    );



    return useMemo(
        () => new Array(renderSize)
            .fill(0)
            .map((_, i) => i + startIndex)
            .filter(index => index < childCount && index >= 0)
            .map(index => computeStickyInfo(index, startIndexRaw))
            .map((info, index, arr) => ({
                ...info,
                isLastStick: info.isStick && arr[index + 1] && !arr[index + 1].isStick
            } as StickyInfo))
            .map(e => e.isStick ? [
                e,
                { ...e, isStick: false, index: e.originalIndex, isLastStick: false }
            ] : [e])
            .flat(),
        [renderSize, startIndex, childCount, Math.round(startIndexRaw * 10), computeStickyInfo]
    );
};


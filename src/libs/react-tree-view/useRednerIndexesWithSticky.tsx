import { useCallback, useMemo } from "react";
import { FlattenNodeWrapper } from "./FlattenNodeWrapper";

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


export const useRednerIndexesWithSticky = ({
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
    let startIndex = Math.floor(Math.max(0, start - overscan) / lineHeight);
    let endIndex = Math.min(childCount, Math.ceil( Math.min(lineHeight * childCount, end + overscan) / lineHeight));
    let renderSize = Math.min(Math.max(0, endIndex - startIndex), 500);

    const computeStickyInfo = useCallback(
        (index: number, startIndexRaw: number): StickyInfo => {
            if (!stickyHeader)
                return { isStick: false, index: index };

            let starIndex = Math.floor(startIndexRaw);
            let delta = Math.floor(index - starIndex);

            let currentNode = index < childCount ? getNodeByIndex(index) : (undefined as never);
            let rIndex = (currentNode?.parentIndex?.[delta])!;

            if (rIndex >= 0 && (currentNode?.parentIndex?.length)! > delta) {
                let parentNode = getNodeByIndex(rIndex)!;
                let minPos = rIndex + parentNode.childCount - startIndexRaw - 1;
                let pos = Math.min(delta, minPos);
                if (parentNode.childCount > 1 && startIndexRaw > 0)
                    return { isStick: true, index: rIndex, position: pos };
            }
            return { isStick: false, index: index };
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
            } as StickyInfo)),
        [renderSize, startIndex, childCount, Math.round(startIndexRaw * 10), computeStickyInfo]
    );
};


import { useCallback, useMemo } from "react";
import { StickyInfo } from ".";



export const useRednerIndexesWithSticky = ({
    start, end, childCount, lineHeight, getNodeByIndex, stickyHeader
}: {
    start: number; end: number;
    childCount: number;
    lineHeight: number;
    getNodeByIndex: (index: number) => ({
        parentIndex: number[];
        childCount: number;
    } | undefined);
    stickyHeader: boolean;
}) => {

    let startIndexRaw = start / lineHeight;
    let startIndex = Math.floor(start / lineHeight);
    let endIndex = Math.min(childCount, Math.ceil(end / lineHeight));
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
                isLastStick: info.isStick && arr[index - 1] && !arr[index + 1].isStick
            } as StickyInfo)),
        [renderSize, startIndex, childCount, Math.round(startIndexRaw * 10), computeStickyInfo]
    );
};

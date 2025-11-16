import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useRednerIndexesWithSticky } from "./useRednerIndexesWithSticky";
import type { FlattenNodeWrapper } from "./FlattenNodeWrapper";

const createNode = (childCount: number, parentIndex: number[]): FlattenNodeWrapper<any, any> => ({
    childCount,
    parentIndex,
} as unknown as FlattenNodeWrapper<any, any>);

describe("useRednerIndexesWithSticky", () => {
    it("returns contiguous indexes when sticky headers are disabled", () => {
        const { result } = renderHook(() => useRednerIndexesWithSticky({
            start: 0,
            end: 60,
            childCount: 4,
            lineHeight: 20,
            stickyHeader: false,
            getNodeByIndex: () => createNode(0, []),
        }));

        expect(result.current).toEqual([
            { index: 0, isStick: false, isLastStick: false },
            { index: 1, isStick: false, isLastStick: false },
            { index: 2, isStick: false, isLastStick: false },
        ]);
    });

    it("identifies parent rows that should stick to the top when scrolling", () => {
        const nodes = new Map<number, FlattenNodeWrapper<any, any>>([
            [0, createNode(4, [])],
            [1, createNode(1, [0])],
            [2, createNode(1, [1, 0])],
            [3, createNode(1, [2, 0])],
            [4, createNode(1, [])],
        ]);

        const { result } = renderHook(() => useRednerIndexesWithSticky({
            start: 20,
            end: 50,
            childCount: 5,
            lineHeight: 10,
            stickyHeader: true,
            getNodeByIndex: (index: number) => nodes.get(index) ?? createNode(0, []),
        }));

        expect(result.current).toEqual([
            { index: 2, isStick: false, isLastStick: false },
            { index: 0, isStick: true, position: 1, isLastStick: true },
            { index: 4, isStick: false, isLastStick: false },
        ]);
    });
});

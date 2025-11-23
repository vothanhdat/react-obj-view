import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useReactTree } from "./useReactTree";

const createNodeState = (index: number) => ({
    state: {
        childCount: 0,
        childCanExpand: false,
        childDepth: 0,
        expandedDepth: 0,
        expanded: false,
        value: `value-${index}`,
        key: index,
        childKeys: [],
        childOffsets: [],
        iterateFinish: true,
        earlyReturn: false,
        selfStamp: 0,
        updateToken: 0,
        updateStamp: index,
        meta: { label: `node-${index}` },
    },
    depth: index,
    paths: ["root", index],
    parentIndex: [index - 1],
});

const createWalkingInstance = () => {
    const nodes = new Map<number, ReturnType<typeof createNodeState>>();
    const getNode = vi.fn((index: number) => {
        if (!nodes.has(index)) {
            nodes.set(index, createNodeState(index));
        }
        return nodes.get(index)!;
    });

    const mockResult = {
        childCount: 3,
        childCanExpand: false,
        childDepth: 1,
        expandedDepth: 0,
        expanded: true,
        value: undefined,
        key: undefined,
        childKeys: [],
        childOffsets: [],
        iterateFinish: true,
        earlyReturn: false,
        selfStamp: 0,
        updateToken: 0,
        updateStamp: 0,
        meta: undefined
    };

    return {
        walking: vi.fn(() => mockResult),
        walkingAsync: vi.fn(function* () { yield mockResult }),
        refreshPath: vi.fn(),
        toggleExpand: vi.fn(),
        getNode,
    };
};

describe("useReactTree", () => {
    it("initializes the walking instance and exposes flattened nodes", async () => {
        const instance = createWalkingInstance();
        const factory = vi.fn(() => instance);
        const metaParser = vi.fn((meta: { label: string }) => ({ label: meta.label.toUpperCase() }));

        const { result } = renderHook(() => useReactTree({
            factory,
            config: {} as any,
            expandDepth: 1,
            metaParser: metaParser as any,
            value: { foo: "bar" } as any,
            name: "root" as any,
        }));

        expect(factory).toHaveBeenCalledTimes(1);
        
        await waitFor(() => {
             expect(instance.walkingAsync).toHaveBeenCalledWith({ foo: "bar" }, "root", {}, 1);
             expect(result.current.childCount).toBe(3);
        });

        const node = result.current.getNodeByIndex(0);
        expect(instance.getNode).toHaveBeenCalledTimes(1);
        const nodeData = node.getData();
        expect(metaParser).toHaveBeenCalledWith({ label: "node-0" });
        expect(nodeData).toMatchObject({
            label: "NODE-0",
            depth: 0,
            path: "root/0",
            paths: ["root", 0],
        });

        expect(result.current.computeItemKey(0)).toBe("root/0");
        expect(result.current.computeItemKey(5)).toBe("");
    });

    it("caches node wrappers per render and proxies instance actions", () => {
        const instance = createWalkingInstance();
        const factory = vi.fn(() => instance);

        const { result } = renderHook(() => useReactTree({
            factory,
            config: {} as any,
            expandDepth: 0,
            metaParser: ((meta: { label: string }) => ({ label: meta.label })) as any,
            value: {} as any,
            name: "root" as any,
        }));

        const first = result.current.getNodeByIndex(1);
        const second = result.current.getNodeByIndex(1);
        expect(first).toBe(second);
        expect(instance.getNode).toHaveBeenCalledTimes(1);

        act(() => result.current.refreshPath({ paths: ["root"] as any }));
        expect(instance.refreshPath).toHaveBeenCalledWith(["root"]);

        act(() => result.current.toggleChildExpand({ paths: ["root", 1] as any }));
        expect(instance.toggleExpand).toHaveBeenCalledWith(["root", 1]);
    });

    it("recreates the walking instance when the factory reference changes", () => {
        const instanceA = createWalkingInstance();
        const instanceB = createWalkingInstance();
        const factoryA = vi.fn(() => instanceA);
        const factoryB = vi.fn(() => instanceB);

        const sharedProps = {
            config: {} as any,
            expandDepth: 1,
            metaParser: ((meta: { label: string }) => ({ label: meta.label })) as any,
            value: {} as any,
            name: "root" as any,
        };

        const { result, rerender } = renderHook((props: any) => useReactTree(props), {
            initialProps: { ...sharedProps, factory: factoryA },
        });

        expect(factoryA).toHaveBeenCalledTimes(1);
        result.current.getNodeByIndex(0);
        expect(instanceA.getNode).toHaveBeenCalled();

        rerender({ ...sharedProps, factory: factoryB });
        result.current.getNodeByIndex(0);

        expect(factoryB).toHaveBeenCalledTimes(1);
        expect(instanceB.getNode).toHaveBeenCalled();
    });
});

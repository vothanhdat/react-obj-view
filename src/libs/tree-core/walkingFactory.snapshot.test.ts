import { describe, expect, it, vi } from "vitest"
import { walkingFactory } from "./walkingFactory"
import type { WalkingAdapter, WalkingContext, NodeResult } from "./types"

// --- Setup Types & Adapter ---

type TestNode = {
    id: string
    children?: TestNode[]
    data?: string
}

type TestMeta = { id: string }
type TestConfig = { token: number; expandAll?: boolean }
type TestContext = WalkingContext<TestConfig>

type TestAdapter = WalkingAdapter<TestNode, string, TestMeta, TestConfig, TestContext>

const createTestAdapter = () => {
    const onVisit = vi.fn();

    const adapter: TestAdapter = {
        valueHasChild: (value) => Boolean(value.children?.length),
        iterateChilds: (value, _ctx, _stable, cb) => {
            onVisit(value.id);
            value.children?.forEach((child) => {
                cb(child, child.id, { id: child.id })
                return false
            })
        },
        defaultMeta: (_value, key) => ({ id: key }),
        defaultContext: (ctx) => ({ ...ctx }),
        getConfigTokenId: (config) => config.token,
        valueDefaultExpaned: (_meta, ctx) => !!ctx.config.expandAll,
    }

    return { adapter, onVisit }
}

// --- Helper to get Snapshot ---

const getSnapshot = (
    factory: ReturnType<typeof walkingFactory<TestNode, string, TestMeta, TestConfig, TestContext>>,
    rootState: any
) => {
    const snapshot: { id: string, depth: number, expanded: boolean, value: TestNode }[] = [];
    for (let i = 0; i < rootState.childCount; i++) {
        const node = factory.getNode(i);
        // We access the internal state of the node to check expanded status and value
        snapshot.push({
            id: node.state.key || 'root', // root key is undefined usually
            depth: node.depth,
            expanded: node.state.expanded,
            value: node.state.value!
        });
    }
    return snapshot;
}

// --- Tests ---

describe("walkingFactory - Snapshot & Incremental Updates", () => {

    const initialData: TestNode = {
        id: "root",
        children: [
            {
                id: "A",
                children: [
                    { id: "A1" },
                    { id: "A2" }
                ]
            },
            {
                id: "B",
                children: [
                    { id: "B1" }
                ]
            }
        ]
    };

    it("should generate correct snapshot on initial walk (expandDepth=0)", () => {
        const { adapter } = createTestAdapter();
        const factory = walkingFactory(adapter);

        // Walk with depth 0, so only root is visible initially? 
        // Actually walkingFactory usually starts with root. 
        // If expandDepth is 0, children of root are not expanded.
        const rootState = factory.walking(initialData, "root", { token: 1 }, 0);

        const snapshot = getSnapshot(factory, rootState);

        // Root is always there. 
        // If expandDepth=0, root is NOT expanded by default logic unless userExpand is set or valueDefaultExpaned returns true.
        // In our adapter valueDefaultExpaned returns ctx.config.expandAll.

        expect(snapshot).toHaveLength(1);
        expect(snapshot[0].id).toBe("root");
        expect(snapshot[0].expanded).toBe(false);
    });

    it("should generate correct snapshot with expandAll", () => {
        const { adapter } = createTestAdapter();
        const factory = walkingFactory(adapter);

        // expandDepth 100, expandAll true
        const rootState = factory.walking(initialData, "root", { token: 1, expandAll: true }, 100);
        const snapshot = getSnapshot(factory, rootState);

        // Order: Root -> A -> A1 -> A2 -> B -> B1
        const ids = snapshot.map(n => n.id);
        expect(ids).toEqual(["root", "A", "A1", "A2", "B", "B1"]);

        // Check depths
        // Root: 1
        // A: 2, A1: 3, A2: 3
        // B: 2, B1: 3
        const depths = snapshot.map(n => n.depth);
        expect(depths).toEqual([1, 2, 3, 3, 2, 3]);
    });

    it("should handle collapse and expand correctly", () => {
        const { adapter } = createTestAdapter();
        const factory = walkingFactory(adapter);

        // Initial: Fully expanded
        let rootState = factory.walking(initialData, "root", { token: 1, expandAll: true }, 100);
        let snapshot = getSnapshot(factory, rootState);
        expect(snapshot.map(n => n.id)).toEqual(["root", "A", "A1", "A2", "B", "B1"]);

        // Collapse A
        // Path to A is ['A'] (since root is implicit/top level, children keys are A, B)
        // Wait, walkingFactory keys: root is passed as key "root".
        // The children of root are A and B.
        // The path to A is ["A"].

        factory.setExpand(["A"]);

        // Must re-walk to apply changes? 
        // The walkingFactory state is mutable/internal, but `walking` function triggers the update process.
        // Usually we call walking again with same params to get updated state.
        rootState = factory.walking(initialData, "root", { token: 1, expandAll: true }, 100);
        snapshot = getSnapshot(factory, rootState);

        // A should be collapsed. A1, A2 should be gone.
        expect(snapshot.map(n => n.id)).toEqual(["root", "A", "B", "B1"]);
        expect(snapshot.find(n => n.id === "A")?.expanded).toBe(false);

        // Expand A again
        factory.setExpand(["A"]);
        rootState = factory.walking(initialData, "root", { token: 1, expandAll: true }, 100);
        snapshot = getSnapshot(factory, rootState);
        expect(snapshot.map(n => n.id)).toEqual(["root", "A", "A1", "A2", "B", "B1"]);
    });

    it("should handle incremental updates when config changes (expandDepth)", () => {
        const { adapter, onVisit } = createTestAdapter();
        const factory = walkingFactory(adapter);

        // 1. Walk with depth 1 (Only Root expanded, children A and B visible but collapsed)
        // Root (depth 1) -> expanded (if depth < expandDepth? No, limitByDepth = currentDepth <= ctx.expandDepth)
        // If expandDepth is 1. Root is depth 1. 1 <= 1 is True.
        // So Root is expanded.
        // Children A (depth 2). 2 <= 1 is False. A is collapsed.

        let rootState = factory.walking(initialData, "root", { token: 1, expandAll: true }, 1);
        let snapshot = getSnapshot(factory, rootState);

        // Root expanded. A and B visible.
        expect(snapshot.map(n => n.id)).toEqual(["root", "A", "B"]);
        expect(snapshot.find(n => n.id === "root")?.expanded).toBe(true);
        expect(snapshot.find(n => n.id === "A")?.expanded).toBe(false);

        onVisit.mockClear();

        // 2. Increase depth to 2. A and B should expand.
        // We use same token? If token is same, config is same? 
        // getConfigTokenId returns config.token.
        // If we want to force update due to config change, we should change token.

        rootState = factory.walking(initialData, "root", { token: 2, expandAll: true }, 2);
        snapshot = getSnapshot(factory, rootState);

        expect(snapshot.map(n => n.id)).toEqual(["root", "A", "A1", "A2", "B", "B1"]);

        // Verify we visited nodes to expand them
        expect(onVisit).toHaveBeenCalled();
    });

    it("should not update nodes that haven't changed when re-walking", () => {
        const { adapter } = createTestAdapter();
        const factory = walkingFactory(adapter);

        // Initial walk
        let rootState = factory.walking(initialData, "root", { token: 1, expandAll: true }, 100);
        const nodeA_First = factory.getNode(1); // Node A
        const stampA_First = nodeA_First.state.updateStamp;

        // Re-walk with SAME data and SAME config
        rootState = factory.walking(initialData, "root", { token: 1, expandAll: true }, 100);
        const nodeA_Second = factory.getNode(1);

        // Should be identical state object or at least same updateStamp if optimized
        expect(nodeA_Second.state).toBe(nodeA_First.state);
        expect(nodeA_Second.state.updateStamp).toBe(stampA_First);
    });

    it("should update specific nodes when data changes", () => {
        const { adapter } = createTestAdapter();
        const factory = walkingFactory(adapter);

        // Initial walk
        let rootState = factory.walking(initialData, "root", { token: 1, expandAll: true }, 100);
        const nodeB_First = factory.getNode(4); // Node B (root, A, A1, A2, B) -> index 4
        expect(nodeB_First.state.key).toBe("B");
        const stampB_First = nodeB_First.state.updateStamp;

        // Create new data with modified B
        const newData = {
            ...initialData,
            children: [
                initialData.children![0], // A unchanged
                {
                    id: "B",
                    children: [
                        { id: "B1" },
                        { id: "B2_New" } // Added child to B
                    ]
                }
            ]
        };

        // Re-walk with NEW data
        rootState = factory.walking(newData, "root", { token: 1, expandAll: true }, 100);

        const snapshot = getSnapshot(factory, rootState);
        // Expected: root, A, A1, A2, B, B1, B2_New
        expect(snapshot.map(n => n.id)).toEqual(["root", "A", "A1", "A2", "B", "B1", "B2_New"]);

        // Check A - should be untouched (same object reference for state if possible, or at least not re-processed deeply if identity check passes)
        // In our adapter, we don't have isValueChange, so it uses reference equality (state.value !== value).
        // A's value object is same reference in newData.

        const nodeA = factory.getNode(1);
        // A should not have updated?
        // The walkingFactory checks:
        // const isChange = isValueChange ? isValueChange(state.value, value) : state.value !== value
        // Since A object is same, isChange is false.
        // state.expanded == isExpand (true == true)
        // state.updateToken == ctx.updateToken (1 == 1)
        // So shouldUpdate is false.

        // However, updateStamp in context increments on every walk?
        // getContextDefault: updateStamp: updateStamp++
        // But state.updateStamp is only updated if shouldUpdate is true.

        // So A's updateStamp should be OLD.
        // Wait, if we pass same token, updateToken is same.

        expect(nodeA.state.updateStamp).toBeLessThan(rootState.updateStamp);

        // Check B - value changed (new object), so it should update
        const nodeB = factory.getNode(4);
        expect(nodeB.state.key).toBe("B");
        expect(nodeB.state.updateStamp).toBe(rootState.updateStamp); // Should be current
        expect(nodeB.state.childCount).toBe(3); // B1, B2_New + B itself? No, childCount is children count.
        // Wait, childCount in state is "total visible descendants + 1 (self)?" or just descendants?
        // In walkingFactory: childCount = 1 (self) + sum(children.childCount).
        // So B (expanded) with 2 leaves (B1, B2_New) -> 1 + 1 + 1 = 3.
    });

    it("should force update all nodes when config token changes", () => {
        const { adapter } = createTestAdapter();
        const factory = walkingFactory(adapter);

        // Initial walk
        let rootState = factory.walking(initialData, "root", { token: 1, expandAll: true }, 100);
        const nodeA_First = factory.getNode(1);
        const stampA_First = nodeA_First.state.updateStamp;

        // Re-walk with NEW token, same data/depth
        rootState = factory.walking(initialData, "root", { token: 2, expandAll: true }, 100);
        const nodeA_Second = factory.getNode(1);

        // Should have updated because token changed
        expect(nodeA_Second.state.updateStamp).toBeGreaterThan(stampA_First);
        expect(nodeA_Second.state.updateToken).toBe(2);
    });
});

import { describe, it, expect, beforeEach } from "vitest";
import { walkingToIndexFactory } from "./walkingToIndexFactory";
import type { TreeWalkerAdapter, WalkingConfig } from "./types";

type MockNode = {
    key: string;
    value?: number;
    children?: MockNode[];
    meta?: Record<string, unknown>;
};

const createAdapter = (): TreeWalkerAdapter<MockNode, string, Record<string, unknown>> => ({
    canHaveChildren: (node) => Array.isArray(node.children) && node.children.length > 0,
    getChildren: (node) =>
        node.children?.map((child) => ({
            key: child.key,
            value: child,
            meta: { ...child.meta },
        })),
    stringifyPath: (path) => path.join("."),
});

describe("walkingToIndexFactory", () => {
    let config: WalkingConfig;
    let adapter: TreeWalkerAdapter<MockNode, string, Record<string, unknown>>;
    let factory: ReturnType<typeof walkingToIndexFactory>;

    const buildTree = (): MockNode => ({
        key: "root",
        children: [
            {
                key: "a",
                value: 1,
                meta: { label: "A" },
            },
            {
                key: "b",
                meta: { label: "B" },
                children: [
                    { key: "b1", value: 2 },
                    {
                        key: "b2",
                        children: [{ key: "b2-1", value: 3 }],
                    },
                ],
            },
        ],
    });

    beforeEach(() => {
        config = {
            expandDepth: 2,
        };
        adapter = createAdapter();
        factory = walkingToIndexFactory(adapter);
    });

    it("walks a tree and flattens nodes", () => {
        const tree = buildTree();
        const result = factory.walking(tree, config, tree.key);

        expect(result.count).toBeGreaterThan(1);
        expect(result.expanded).toBe(true);
        expect(result.maxDepth).toBeGreaterThan(1);

        const firstNode = factory.getNode(0, config).getData();
        expect(firstNode.path).toBe("");
        expect(firstNode.meta).toBeUndefined();

        const secondNode = factory.getNode(1, config).getData();
        expect(secondNode.path).toBe("a");
        expect(secondNode.meta?.label).toBe("A");
    });

    it("respects expand depth", () => {
        const tree = buildTree();
        const shallowConfig = { ...config, expandDepth: 1 };
        const result = factory.walking(tree, shallowConfig, tree.key);

        expect(result.expanded).toBe(true);
        expect(result.childCanExpand).toBe(true);

        const child = factory.getNode(1, shallowConfig).getData();
        expect(child.childCanExpand).toBe(false);
    });

    it("toggles expansion", () => {
        const tree = buildTree();
        factory.walking(tree, config, tree.key);

        const childB = factory.getNode(2, config).getData();
        expect(childB.path).toBe("b");

        factory.toggleExpand([childB.name], config);
        factory.walking(tree, config, tree.key);
        const collapsed = factory.getNode(2, config).getData();

        expect(collapsed.expanded).toBe(false);
    });

    it("refreshes a path when forced", () => {
        const tree = buildTree();
        tree.children![0].meta = { label: "initial" };

        factory.walking(tree, config, tree.key);
        const node = factory.getNode(1, config).getData();
        expect(node.meta?.label).toBe("initial");

        tree.children![0].meta = { label: "updated" };
        factory.refreshPath([tree.children![0].key]);
        factory.walking(tree, config, tree.key);

        const refreshed = factory.getNode(1, config).getData();
        expect(refreshed.meta?.label).toBe("updated");
    });

    it("uses version token to invalidate caches", () => {
        const tree = buildTree();
        factory.walking(tree, { ...config, versionToken: 1 }, tree.key);
        const first = factory.getNode(1, config).getData();

        factory.walking(tree, { ...config, versionToken: 2 }, tree.key);
        const second = factory.getNode(1, config).getData();

        expect(first.updateToken).not.toBe(second.updateToken);
    });
});

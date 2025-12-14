import { describe, expect, it } from "vitest"
import { walkingFactory } from "./walkingFactory"
import type { WalkingAdaper, WalkingContext } from "./types"

type TreeNode = {
    id: string
    children?: TreeNode[]
}

type TreeMeta = { id: string }
type TreeConfig = { token: number }
type TreeContext = WalkingContext<TreeConfig>

type TreeAdapter = WalkingAdaper<TreeNode, string, TreeMeta, TreeConfig, TreeContext>

type ComplexNode = {
    label: string
    hidden?: boolean
    entries?: Record<string, ComplexNode>
}

type ComplexMeta = { key: string; hidden: boolean }
type ComplexConfig = { version: number; log?: string[]; expandAll?: boolean }
type ComplexContext = WalkingContext<ComplexConfig> & { log: string[] }
type ComplexAdapter = WalkingAdaper<ComplexNode, string, ComplexMeta, ComplexConfig, ComplexContext>

const createTree = (): TreeNode => ({
    id: "root",
    children: [
        {
            id: "left",
            children: [
                { id: "leaf" },
            ],
        },
        { id: "right" },
    ],
})

const createAdapter = () => {
    const iterations: Record<string, number> = {}

    const adapter: TreeAdapter = {
        valueHasChild: (value) => Boolean(value.children?.length),
        iterateChilds: (value, _ctx, _stable, cb) => {
            iterations[value.id] = (iterations[value.id] ?? 0) + 1
            value.children?.forEach((child) => {
                cb(child, child.id, { id: child.id })
                return false
            })
        },
        defaultMeta: (_value, key) => ({ id: key }),
        defaultContext: (ctx) => ({ ...ctx }),
        getConfigTokenId: (config) => config.token,
    }

    return { adapter, iterations }
}

const createComplexTree = (): ComplexNode => ({
    label: "root",
    entries: {
        gamma: {
            label: "gamma",
            hidden: true,
            entries: {
                epsilon: { label: "epsilon" },
            },
        },
        beta: {
            label: "beta",
            entries: {
                zeta: { label: "zeta" },
                eta: { label: "eta" },
            },
        },
        alpha: { label: "alpha" },
    },
})

const createComplexAdapter = () => {
    const iterations: string[] = []
    const transforms: string[] = []

    const adapter: ComplexAdapter = {
        valueHasChild: (value) => Boolean(Object.keys(value.entries ?? {}).length),
        iterateChilds: (value, ctx, _stable, cb) => {
            Object.entries(value.entries ?? {}).forEach(([key, child]) => {
                const meta: ComplexMeta = { key, hidden: Boolean(child.hidden) }
                iterations.push(`${ctx.updateStamp}:${key}`)
                cb(child, key, meta)
                return false
            })
        },
        defaultMeta: (_value, key) => ({ key, hidden: false }),
        defaultContext: (ctx) => ({ ...ctx, log: ctx.config.log ?? [] }),
        getConfigTokenId: (config) => config.version,
        valueDefaultExpaned: (meta, ctx) => ctx.config.expandAll || !meta.hidden,
        transformValue: (value) => {
            transforms.push(value.label)
            if (!value.entries) {
                return value
            }
            const sortedEntries = Object.fromEntries(
                Object.entries(value.entries).sort(([a], [b]) => a.localeCompare(b)),
            )
            return { ...value, entries: sortedEntries }
        },
        isValueChange: (prev, next) => prev?.label !== next?.label,
    }

    return { adapter, iterations, transforms }
}

describe("walkingFactory", () => {
    it("flattens the tree and exposes each node by index", () => {
        const { adapter } = createAdapter()
        const walker = walkingFactory(adapter)
        const tree = createTree()

        const state = walker.walking(tree, tree.id, { token: 1 }, 10)

        expect(state.childKeys).toEqual(["left", "right"])
        expect(state.childCount).toBe(4)

        const rootNode = walker.getNode(0)
        expect(rootNode.state.key).toBe("root")
        expect(rootNode.paths).toEqual([])

        const leftNode = walker.getNode(1)
        expect(leftNode.paths).toEqual(["left"])
        expect(leftNode.state.childCount).toBe(2)

        const leafNode = walker.getNode(2)
        expect(leafNode.paths).toEqual(["left", "leaf"])
        expect(leafNode.depth).toBe(3)
    })

    it("refreshPath forces a branch to be recalculated", () => {
        const { adapter, iterations } = createAdapter()
        const walker = walkingFactory(adapter)
        const tree = createTree()

        walker.walking(tree, tree.id, { token: 1 }, 10)
        expect(iterations.root).toBe(1)
        expect(iterations.left).toBe(1)

        walker.walking(tree, tree.id, { token: 1 }, 10)
        expect(iterations.root).toBe(1)
        expect(iterations.left).toBe(1)

        walker.refreshPath(["left"])
        walker.walking(tree, tree.id, { token: 1 }, 10)

        expect(iterations.root).toBe(2)
        expect(iterations.left).toBe(2)
    })

    it("toggleExpand collapses a node and updates the flattened order", () => {
        const { adapter } = createAdapter()
        const walker = walkingFactory(adapter)
        const tree = createTree()

        walker.walking(tree, tree.id, { token: 1 }, 10)
        walker.setExpand(["left"])
        walker.walking(tree, tree.id, { token: 1 }, 10)

        const leftNode = walker.getNode(1)
        expect(leftNode.state.expanded).toBe(false)
        expect(leftNode.state.childCount).toBe(1)

        const rightNode = walker.getNode(2)
        expect(rightNode.paths).toEqual(["right"])
    })

    it("allows adapters to transform values, customize defaults, and skip redundant updates", () => {
        const { adapter, iterations, transforms } = createComplexAdapter()
        const walker = walkingFactory(adapter)
        const tree = createComplexTree()

        const config = { version: 1, log: [], expandAll: false }
        const collectNodes = () => {
            const nodes = [] as ReturnType<typeof walker.getNode>[]
            const rootNode = walker.getNode(0)
            nodes.push(rootNode)
            for (let i = 1; i < rootNode.state.childCount; i++) {
                nodes.push(walker.getNode(i))
            }
            return nodes
        }

        walker.walking(tree, "root", config, 10)

        expect(transforms).toEqual([
            "root",
            "alpha",
            "beta",
            "eta",
            "zeta",
            "gamma",
        ])

        const initialNodes = collectNodes()
        const secondNode = initialNodes[2]
        expect(secondNode.paths).toEqual(["beta"])

        const collapsedHidden = initialNodes.find((node) => node.paths.join("/") === "gamma")
        expect(collapsedHidden).toBeDefined()
        if (!collapsedHidden) {
            throw new Error("gamma node missing")
        }
        expect(collapsedHidden.paths).toEqual(["gamma"])
        expect(collapsedHidden.state.expanded).toBe(false)
        expect(collapsedHidden.state.childCount).toBe(1)

        const clone = JSON.parse(JSON.stringify(tree)) as ComplexNode
        walker.walking(clone, "root", { ...config }, 10)

        expect(iterations.length).toBe(5)
        expect(transforms.length).toBe(7)
        expect(transforms.at(-1)).toBe("root")

        walker.walking(clone, "root", { ...config, version: 2, expandAll: true }, 10)
        expect(iterations.length).toBeGreaterThan(7)
        expect(transforms.slice(-7)).toEqual([
            "root",
            "alpha",
            "beta",
            "eta",
            "zeta",
            "gamma",
            "epsilon",
        ])

        const expandedNodes = collectNodes()
        const expandedHidden = expandedNodes.find((node) => node.paths.join("/") === "gamma")
        expect(expandedHidden).toBeDefined()
        if (!expandedHidden) {
            throw new Error("gamma node missing")
        }
        expect(expandedHidden.state.expanded).toBe(true)
        expect(expandedHidden.state.childCount).toBe(2)
    })
    it("supports expandPath and getIndexForPath for jump-to functionality", () => {
        const { adapter } = createComplexAdapter()
        const walker = walkingFactory(adapter)
        const tree = createComplexTree()
        const config = { version: 1, log: [], expandAll: false }

        // Initial walk: only root and alpha/beta keys visible (children of beta hidden?)
        // createComplexTree structure:
        // root
        //  - alpha
        //  - beta
        //    - eta
        //    - zeta
        //  - gamma (hidden)
        //    - epsilon

        // Default: hidden=false => expanded? valueDefaultExpanded: !meta.hidden. 
        // So alpha and beta are default expanded? 
        // Let's verify initial state first.

        walker.walking(tree, "root", config, 10)

        // Check "beta" path
        // Path to beta: ["beta"] (since root is "user root", children keys are alpha, beta, gamma)
        // Initial state:
        // root (0)
        // alpha (1)
        // beta (2) -> children eta/zeta should be visible if beta is expanded.
        // gamma (collapsed/hidden)

        // Check index of "beta"
        const indexBeta = walker.getIndexForPath(["beta"])
        expect(indexBeta).toBeGreaterThan(0)

        // Try to get index of "zeta" (child of beta)
        // Path: ["beta", "zeta"]
        const indexZeta = walker.getIndexForPath(["beta", "zeta"])
        expect(indexZeta).toBeGreaterThan(indexBeta)

        // Try to get index of "epsilon" (child of gamma, which is hidden/collapsed)
        // Should return -1 initially because gamma is not expanded.
        const indexEpsilonBefore = walker.getIndexForPath(["gamma", "epsilon"])
        expect(indexEpsilonBefore).toBe(-1)

        // Expand path to epsilon
        walker.expandPath(["gamma", "epsilon"])

        // Must re-walk to update layout
        walker.walking(tree, "root", config, 10)

        const indexEpsilonAfter = walker.getIndexForPath(["gamma", "epsilon"])
        expect(indexEpsilonAfter).toBeGreaterThan(0)

        // Verify gamma is expanded
        const gammaNode = walker.getNode(walker.getIndexForPath(["gamma"]))
        expect(gammaNode.state.expanded).toBe(true)
    })
})

describe("walkingAsync", () => {
    it("should yield intermediate states when step limit is reached", () => {
        const tree = createTree()
        const { adapter } = createAdapter()
        const walker = walkingFactory(adapter)

        // Use a very small step limit (1) to force multiple yields
        // createTree has root -> [left, right], left -> [leaf]
        // Total nodes: root, left, leaf, right.
        const iterator = walker.walkingAsync(tree, "root", { token: 1 }, 10, 1)

        let yieldCount = 0
        let lastResult: any

        for (const result of iterator) {
            yieldCount++
            lastResult = result
        }

        // We expect multiple yields because the step limit is 1
        expect(yieldCount).toBeGreaterThan(1)
        expect(lastResult).toBeDefined()
        // root (1) + left (1) + leaf (1) + right (1) = 4
        expect(lastResult.childCount).toBe(4)
    })


    it("should eventually produce the same result as synchronous walking", () => {
        const tree = createTree()
        const { adapter } = createAdapter()
        const walker = walkingFactory(adapter)

        const syncResult = walker.walking(tree, "root", { token: 1 }, 10)

        const iterator = walker.walkingAsync(tree, "root", { token: 1 }, 10, 100) // High limit to finish in one go if possible, or just iterate all
        let asyncResult: any
        for (const res of iterator) {
            asyncResult = res
        }

        expect(asyncResult.childCount).toBe(syncResult.childCount)

        // Check children of root
        const syncRootChildren = [walker.getNode(0), walker.getNode(1)] // Assuming indices 0 and 1 are children of root? 
        // Wait, getNode uses the flattened list.
        // root (0) -> left (1) -> leaf (2) -> right (3)
        // Actually getNode(i) gets the i-th visible row.
        // createTree: root -> left (expanded?) -> leaf, right.
        // Default expanded state depends on adapter/logic. 
        // In this test setup, we need to check how expansion is handled.
        // The default adapter in createAdapter doesn't seem to have default expansion logic shown in the snippet, 
        // but usually it defaults to collapsed or we can toggle it.

        // Let's just compare the final state objects roughly
        expect(asyncResult.childKeys).toEqual(syncResult.childKeys)
    })
})

describe("traversalAndFindPaths", () => {
    it("searches only expanded nodes when fullSearch is false", () => {
        const { adapter } = createComplexAdapter()
        const walker = walkingFactory(adapter)
        const tree = createComplexTree()
        const config = { version: 1, log: [], expandAll: false }

        // Walk first to populate state. 'gamma' is hidden (collapsed).
        walker.walking(tree, "root", config, 10)

        const found: string[] = []
        const iterator = walker.traversalAndFindPaths(
            (value, key, paths) => {
                found.push(key)
            },
            config,
            1000,
            10,
            false // fullSearch = false
        )

        for (const _ of iterator) { }

        // Should find root, alpha, beta, eta, zeta.
        // Should NOT find epsilon because gamma is collapsed.
        expect(found).toContain("alpha")
        expect(found).toContain("beta")
        expect(found).toContain("eta")
        expect(found).toContain("zeta")
        expect(found).not.toContain("epsilon")
    })

    it("searches all nodes when fullSearch is true", () => {
        const { adapter } = createComplexAdapter()
        const walker = walkingFactory(adapter)
        const tree = createComplexTree()
        const config = { version: 1, log: [], expandAll: false }

        // Walk first. 'gamma' is hidden.
        walker.walking(tree, "root", config, 10)

        const found: string[] = []
        const iterator = walker.traversalAndFindPaths(
            (value, key, paths) => {
                found.push(key)
            },
            config,
            1000,
            10,
            true // fullSearch = true
        )

        for (const _ of iterator) { }

        // Should find epsilon even though gamma is collapsed in the view state.
        expect(found).toContain("epsilon")
    })

    it("yields execution to unblock thread", () => {
        const { adapter } = createComplexAdapter()
        const walker = walkingFactory(adapter)
        const tree = createComplexTree()
        const config = { version: 1, log: [], expandAll: true } // Expand all to allow many nodes logic if needed, but here structure is small.

        walker.walking(tree, "root", config, 10)

        let yieldCount = 0
        const iterator = walker.traversalAndFindPaths(
            () => { },
            config,
            1, // Yield after every 1 visit
            10,
            true
        )

        for (const _ of iterator) {
            yieldCount++
        }

        // Total nodes: root, alpha, beta, eta, zeta, gamma, epsilon = 7 nodes.
        // With iterateSize=1, expect around 7 yields.
        expect(yieldCount).toBeGreaterThanOrEqual(6)
    })

    it("provides correct paths in callback", () => {
        const { adapter } = createComplexAdapter()
        const walker = walkingFactory(adapter)
        const tree = createComplexTree()
        const config = { version: 1, log: [], expandAll: false }

        walker.walking(tree, "root", config, 10)

        let epsilonPath: string[] = []
        const iterator = walker.traversalAndFindPaths(
            (value, key, paths) => {
                if (key === "epsilon") {
                    epsilonPath = [...paths]
                }
            },
            config,
            1000,
            10,
            true
        )
        for (const _ of iterator) { }

        // Path to epsilon: gamma/epsilon
        expect(epsilonPath).toEqual(["gamma", "epsilon"])
    })
})

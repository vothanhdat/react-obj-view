/** @jsxImportSource @opentui/react */
import { describe, expect, it } from "vitest";

// OpenTUI's renderer is backed by a native (Zig/FFI) library that only loads
// under Bun or Node started with `--experimental-ffi`. Importing `@opentui/react`
// (or this component) eagerly triggers that backend, so we dynamic-import inside
// each test and skip cleanly when the backend is unavailable (e.g. plain `node`
// CI running Vitest). The test still exercises a real frame under Bun.
const sample = {
    name: "react-obj-view",
    nested: { a: 1, b: 2 },
    list: [10, 20, 30],
    flag: true,
};

type TestRenderModule = typeof import("@opentui/react/test-utils");
type ViewModule = typeof import("./TuiObjectView");

const loadRenderer = async (): Promise<
    { testRender: TestRenderModule["testRender"]; TuiObjectView: ViewModule["TuiObjectView"] } | null
> => {
    try {
        const [{ testRender }, { TuiObjectView }] = await Promise.all([
            import("@opentui/react/test-utils"),
            import("./TuiObjectView"),
        ]);
        return { testRender, TuiObjectView };
    } catch {
        return null;
    }
};

describe("TuiObjectView", () => {
    it("renders the root and top-level keys", async (ctx) => {
        const mod = await loadRenderer();
        if (!mod) return ctx.skip();
        const { testRender, TuiObjectView } = mod;

        const t = await testRender(
            <TuiObjectView valueGetter={() => sample} expandLevel={1} height={20} width={80} />,
            { width: 80, height: 20 },
        );
        await t.waitForVisualIdle();
        const frame = t.captureCharFrame();
        expect(frame).toContain("ROOT");
        expect(frame).toContain("name");
        expect(frame).toContain("nested");
        expect(frame).toContain("list");
        t.renderer.destroy();
    });

    it("renders primitive values", async (ctx) => {
        const mod = await loadRenderer();
        if (!mod) return ctx.skip();
        const { testRender, TuiObjectView } = mod;

        const t = await testRender(
            <TuiObjectView valueGetter={() => ({ x: 42, y: "hello" })} expandLevel={1} height={20} width={80} />,
            { width: 80, height: 20 },
        );
        await t.waitForVisualIdle();
        const frame = t.captureCharFrame();
        expect(frame).toContain("42");
        expect(frame).toContain('"hello"');
        t.renderer.destroy();
    });

    it("opens the search overlay when / is pressed", async (ctx) => {
        const mod = await loadRenderer();
        if (!mod) return ctx.skip();
        const { testRender, TuiObjectView } = mod;

        const t = await testRender(
            <TuiObjectView valueGetter={() => sample} expandLevel={1} height={20} width={80} />,
            { width: 80, height: 20 },
        );
        await t.waitForVisualIdle();
        t.mockInput.pressKey("/");
        await t.waitForVisualIdle();
        const frame = t.captureCharFrame();
        expect(frame).toMatch(/search/);
        t.renderer.destroy();
    });
});

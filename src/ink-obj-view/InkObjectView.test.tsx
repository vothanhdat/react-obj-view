import { describe, expect, it } from "vitest";
import React from "react";
import { render } from "ink-testing-library";
import { InkObjectView } from "./InkObjectView";

const sample = {
    name: "react-obj-view",
    nested: { a: 1, b: 2 },
    list: [10, 20, 30],
    flag: true,
};

const waitFrame = (ms = 30) => new Promise((r) => setTimeout(r, ms));
const waitForWalk = async () => {
    for (let i = 0; i < 10; i++) await waitFrame(40);
};

describe("InkObjectView", () => {
    it("renders the root and top-level keys", async () => {
        const { lastFrame, unmount } = render(
            <InkObjectView valueGetter={() => sample} expandLevel={1} height={20} />,
        );
        await waitForWalk();
        const frame = lastFrame() ?? "";
        expect(frame).toContain("ROOT");
        expect(frame).toContain("name");
        expect(frame).toContain("nested");
        expect(frame).toContain("list");
        unmount();
    });

    it("expands when enter is pressed on a parent row", async () => {
        const { lastFrame, stdin, unmount } = render(
            <InkObjectView valueGetter={() => sample} expandLevel={0} height={20} />,
        );
        await waitFrame();
        stdin.write("[B"); // down
        await waitFrame();
        stdin.write("\r"); // enter
        await waitFrame();
        const frame = lastFrame() ?? "";
        expect(frame).toMatch(/name|nested|list/);
        unmount();
    });

    it("renders primitive values", async () => {
        const { lastFrame, unmount } = render(
            <InkObjectView valueGetter={() => ({ x: 42, y: "hello" })} expandLevel={1} height={20} />,
        );
        await waitForWalk();
        const frame = lastFrame() ?? "";
        expect(frame).toContain("42");
        expect(frame).toContain('"hello"');
        unmount();
    });

    it("opens the search overlay when / is pressed", async () => {
        const { lastFrame, stdin, unmount } = render(
            <InkObjectView valueGetter={() => sample} expandLevel={1} height={20} />,
        );
        await waitFrame();
        stdin.write("/");
        await waitFrame();
        const frame = lastFrame() ?? "";
        expect(frame).toMatch(/search/);
        unmount();
    });
});

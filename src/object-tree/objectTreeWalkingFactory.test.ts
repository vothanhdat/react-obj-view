import { describe, expect, it } from "vitest";
import { objectTreeWalkingFactory, parseWalkingMeta } from "./objectWalkingAdapter";
import type { ObjectWalkingConfig } from "./types";
import { LazyValue, LazyValueError } from "./custom-class/LazyValueWrapper";

describe("objectTreeWalkingFactory", () => {
    const createWalker = (config: Partial<ObjectWalkingConfig> = {}) => {
        const walker = objectTreeWalkingFactory();
        const defaultConfig: ObjectWalkingConfig = {
            nonEnumerable: true,
            symbol: true,
            resolver: undefined,
        };

        return { walker, config: { ...defaultConfig, ...config } };
    };

    it("enumerates symbols, non-enumerable keys and prototype entries while exposing meta flags", () => {
        const { walker, config } = createWalker();
        const secret = Symbol("secret");
        const proto = { inherited: 2 };
        const value = Object.create(proto, {
            visible: { value: 1, enumerable: true },
            hidden: { value: 2, enumerable: false },
        });

        Object.defineProperty(value, secret, { value: 3, enumerable: true });

        walker.walking(value, "root", config, 3);

        const rootNode = walker.getNode(0);
        const nodes = Array.from({ length: rootNode.state.childCount }, (_, index) => walker.getNode(index));
        const findNode = (predicate: (node: typeof nodes[number]) => boolean) => nodes.find(predicate)!;

        const visibleNode = findNode((node) => node.paths[0] === "visible");
        expect(parseWalkingMeta(visibleNode.state.meta))
            .toEqual({ enumerable: true, isCircular: false, emptyChild: false });

        const hiddenNode = findNode((node) => node.paths[0] === "hidden");
        expect(parseWalkingMeta(hiddenNode.state.meta))
            .toEqual({ enumerable: false, isCircular: false, emptyChild: false });

        const symbolNode = findNode((node) => node.paths[0] === secret);
        expect(parseWalkingMeta(symbolNode.state.meta))
            .toEqual({ enumerable: true, isCircular: false, emptyChild: false });

        const prototypeNode = findNode((node) => node.paths[0] === "[[Prototype]]");
        expect(prototypeNode.state.value).toBe(proto);
        expect(parseWalkingMeta(prototypeNode.state.meta))
            .toEqual({
                enumerable: false,
                isCircular: false,
                emptyChild: false,
            });
    });

    it("marks circular references as non-expandable nodes", () => {
        const { walker, config } = createWalker({ nonEnumerable: false, symbol: false });
        const value: Record<string, unknown> = {};
        value.self = value;

        walker.walking(value, "root", config, 3);

        const circularNode = walker.getNode(1);
        expect(parseWalkingMeta(circularNode.state.meta))
            .toEqual({
                enumerable: true,
                isCircular: true,
                emptyChild: false,
            });
        expect(circularNode.state.childCount).toBe(1);
        expect(circularNode.state.childCanExpand).toBe(false);
    });

    it("updates the root name while preserving expanded children", () => {
        const { walker, config } = createWalker({ nonEnumerable: false });
        const value = { child: { answer: 42 } };
        walker.walking(value, "old", config, 1);
        walker.setExpand(["child"], () => true);
        walker.walking(value, "old", config, 1);

        walker.walking(value, "new", config, 1);

        expect(walker.getNode(0).state.key).toBe("new");
        expect(walker.getNode(1).state.expanded).toBe(true);
        expect(walker.getNode(2).state.value).toBe(42);
    });

    it.each([null, undefined, false, 0, ""])("preserves resolved getter value %s", expected => {
        const { walker, config } = createWalker();
        const value = { get result() { return expected; } };
        const lazy = LazyValue.getInstance(value, "result");
        lazy.init();

        walker.walking(lazy, "root", config, 0);

        expect(walker.getNode(0).state.value).toBe(expected);
    });

    it("preserves errors from resolved getters", () => {
        const { walker, config } = createWalker();
        const value = { get result() { throw new Error("failed"); } };
        const lazy = LazyValue.getInstance(value, "result");
        lazy.init();

        walker.walking(lazy, "root", config, 0);

        expect(walker.getNode(0).state.value).toBeInstanceOf(LazyValueError);
    });
});

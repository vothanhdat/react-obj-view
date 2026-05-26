# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Yarn 4 (via Corepack) is the package manager; Node `>=22` is required (`engines` in [package.json](package.json)). `npm` works because scripts are simple aliases, but CI uses Yarn.

- `yarn dev` — demo playground served by Vite (`vite.config.dev.ts`, entry [src/dev.tsx](src/dev.tsx)).
- `yarn build` — library bundle to `dist/` (ESM + UMD, with `.d.ts` via `vite-plugin-dts`). `ANALYZER=1 yarn build` opens the bundle analyzer.
- `yarn build:demo` — GitHub Pages demo to `demo-dist/` (base path `/react-obj-view/`).
- `yarn test` / `yarn test:watch` / `yarn test:ui` / `yarn test:coverage` — Vitest with `happy-dom`.
- Run a single test file: `npx vitest run src/libs/tree-core/walkingFactory.test.ts`. Filter by name: `npx vitest run -t "<pattern>"`.
- Benchmarks live in `bench/` and are invoked with `npx vitest bench bench/perf.bench.ts` (also `perf-generator`, `perf-search-generator`).

## Architecture

The library is a three-layer stack. Each layer is independently exported from [src/index.ts](src/index.ts) (`TreeCore`, `ReactTreeView`, `VirtualScroller`) so consumers can build non-object tree viewers on the same engine.

```
value + adapter → tree-core (walkingFactory) → react-tree-view (useReactTree) → virtual-scroller
                          ↑
                   objectWalkingAdapter + resolvers   (for the built-in object viewer)
```

### 1. `src/libs/tree-core/` — domain-agnostic walker
- [walkingFactory.ts](src/libs/tree-core/walkingFactory.ts) takes a `WalkingAdapter<Value, Key, Meta, Config, Context>` ([types.ts](src/libs/tree-core/types.ts)) and returns an instance with `walking`, `walkingAsync`, `getNode(index)`, `setExpand`, `refreshPath`, `expandPath`, `getIndexForPath`, and `traversalAndFindPaths`.
- State is cached in [StateFactory](src/libs/tree-core/utils/StateFactory.ts); only dirty subtrees recompute, keyed on `getConfigTokenId(config)` plus the per-walk `updateToken`/`updateStamp`.
- Walking can be paused: each adapter callback bumps `ctx.iterateCounter`, and when it goes negative the walk early-returns (`earlyReturn` / `iterateFinish` on `WalkingResult`). `walkingAsync` uses this to slice work into `iterateSize` chunks and yield to the event loop.
- The walker knows nothing about objects vs. arrays — that lives in the adapter.

### 2. `src/libs/react-tree-view/` — React glue
- [useReactTree](src/libs/react-tree-view/useReactTree.tsx) memoizes a walker per `(factory, config, expandDepth, value)` tuple and exposes `getNodeByIndex`, `toggleChildExpand`, `setChildExpand`, `refreshPath`, `expandAndGetIndex`, `travelAndSearch`.
- [FlattenNodeWrapper](src/libs/react-tree-view/FlattenNodeWrapper.tsx) turns raw walker nodes into UI-friendly objects via a `metaParser` (so renderers never see raw bitmasks).
- [ReactTreeView](src/libs/react-tree-view/ReactTreeView.tsx) drives the virtual scroller and optionally pins ancestor rows via [useRenderIndexesWithSticky](src/libs/react-tree-view/useRenderIndexesWithSticky.tsx).

### 3. `src/libs/virtual-scroller/` — windowed rendering
- Pixel-based virtualization. `lineHeight` × `size` defines container height; `overscan` is **in pixels**, not rows.
- Mismatched `lineHeight` vs. CSS row height causes drift/overlap — the scroll math uses the prop, not measured DOM.

### 4. `src/object-tree/` — object-specific adapter on top of tree-core
- [objectWalkingAdapter.ts](src/object-tree/objectWalkingAdapter.ts) implements `WalkingAdapter` for plain objects, arrays, Maps/Sets, typed arrays, lazy wrappers, and any resolver-supported reference. `objectTreeWalkingFactory` is `walkingFactory(objectWalkingAdapter)`.
- Meta is a bitmask; downstream code goes through `parseWalkingMeta` (`enumerable`, `isCircular`). The macro import `NON_CIRCULAR_BIT` (see [ObjectView.tsx](src/react-obj-view/ObjectView.tsx)) is inlined via `unplugin-macros` — keep the `with { type: "macro" }` syntax when editing.
- Circular refs are tracked by [CircularChecking](src/object-tree/utils/CircularChecking.ts) on the walking context.
- Resolvers (`Map<Constructor, ResolverFn>`) decide how to enumerate a value's children and previews. Built-in resolvers in [src/object-tree/resolver/](src/object-tree/resolver/). [ObjectView.tsx](src/react-obj-view/ObjectView.tsx) assembles the final map: `DEFAULT_RESOLVER` → `TYPED_ARRAY_RESOLVERS` → user resolver → `GROUP_ARRAY_RESOLVER`/`GROUP_OBJECT_RESOLVER` (only when group size > 1). Order matters — later entries override earlier ones for the same constructor.
- Grouping wraps large collections in collapsed proxy nodes ([custom-class/groupedProxy.ts](src/object-tree/custom-class/groupedProxy.ts)) to keep render work bounded. Object grouping forces full enumeration to count keys (documented trade-off in the README).

### 5. `src/react-obj-view/` — the `ObjectView` shell
- [ObjectView.tsx](src/react-obj-view/ObjectView.tsx) is the public surface. It assembles the resolver map, builds `config`, calls `useReactTree`, wires hover/highlight/search, and renders rows via [RenderNode](src/react-obj-view/components/RenderNode.tsx).
- `valueGetter` (not `value`) is the API — `value` is read once in a `useMemo([valueGetter])`. Change detection is **reference equality** on the resulting value; in-place mutation will not re-render.
- Search is streaming: `objectViewRef.current.search(filterFn, markTerm, onResult, opts)` iterates via `travelAndSearch` and yields to `requestIdleCallback` between batches. The hook [useObjectViewSearch](src/react-obj-view/search/useObjectViewSearch.tsx) (also used by `SearchComponent`) handles debouncing and prev/next navigation.
- Themes live in `src/react-obj-view-themes/` as plain CSS-variable maps; `createTheme`/`extendTheme` enforce the variable set.

## Build & tooling notes

- **React Compiler is enabled** in `vite.config.ts` and `vite.config.dev.ts` via `babel-plugin-react-compiler`. Don't fight it with manual `useCallback`/`useMemo` unless profiling shows a real need; do keep `valueGetter` stable for the consumer-facing API.
- **`unplugin-macros`** is registered in all three Vite configs and the Vitest config. Imports with `with { type: "macro" }` (e.g. bit-flag constants from `src/object-tree/meta.ts`) are inlined at build time.
- React 19 is a peer dep — externalized from the library bundle (`react`, `react-dom`, `react/jsx-runtime`).
- The test setup ([src/test/setup.ts](src/test/setup.ts)) polyfills `Promise.withResolvers` because CI runs Node 20 even though `engines` targets ≥22.
- Coverage excludes `src/exampleData/`, `src/dev.tsx`, `src/Test.tsx`, and any `src/V5/*` legacy fixtures.

## Conventions worth knowing

- Tests are co-located (`*.test.ts(x)` next to the file under test). Use `@testing-library/react` + `happy-dom`.
- Don't import from deep paths externally — round-trip through `src/index.ts` so the public surface stays explicit. The three internal libs are re-exported as namespaces (`TreeCore`, `ReactTreeView`, `VirtualScroller`) for consumers building custom tree viewers.
- Adapter authors: implement `WalkingAdapter`, write a `metaParser`, then hand the factory to `useReactTree`. See [docs/GENERIC_TREE_VIEW.md](docs/GENERIC_TREE_VIEW.md) for the file-tree walkthrough.
- Resolver authors: add to `src/object-tree/resolver/`, register in the appropriate map. See [docs/OBJECT_TREE_VIEW.md](docs/OBJECT_TREE_VIEW.md).

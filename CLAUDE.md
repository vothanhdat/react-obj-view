# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Yarn 4 (via Corepack) is the package manager; Node `>=22` is required (`engines` in [package.json](package.json)). `npm` works because scripts are simple aliases, but CI uses Yarn.

- `yarn dev` — demo playground served by Vite (`vite.config.dev.ts`, entry [src/dev.tsx](src/dev.tsx)).
- `yarn build` — runs both the web library bundle to `dist/` (ESM + UMD, with `.d.ts`) **and** the terminal bundle to `dist-tui/`. `yarn build:web` / `yarn build:tui` build just one. `yarn build:analyzer` opens the bundle analyzer.
- `yarn cli <file.json>` — run the built terminal viewer (`dist-tui/cli/react-obj-view.js`). The TUI/CLI runs under **Bun**, not Node (see the OpenTUI section under Architecture).
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

### 6. `src/tui-obj-view/` — the terminal port (OpenTUI)
- A second renderer for the **same** engine, built on [OpenTUI](https://opentui.com) (`@opentui/core` + `@opentui/react`, a React reconciler for the terminal). Everything in layers 1–4 (`tree-core`, `object-tree`, `react-tree-view`, `useObjectViewSearch`, `searchHandler`) is reused unchanged — only the rendering shell is terminal-specific.
- [TuiObjectView.tsx](src/tui-obj-view/TuiObjectView.tsx) mirrors `ObjectView`'s props (drops DOM-only ones, adds `height`/`width`/`enableMouse`/`onExit`). It owns the focused-row index, drives [TerminalScroller](src/tui-obj-view/TerminalScroller.tsx) (row-based virtual scroller reusing `useRenderIndexesWithSticky` with `lineHeight: 1`), and renders rows via [RenderNodeTui](src/tui-obj-view/RenderNodeTui.tsx).
- Rows are a single OpenTUI `<text wrapMode="none">` of inline `<span>` segments; `formatValue.ts` emits `{ text, entry }` segments and `themeEntryToTextProps` maps a theme entry to OpenTUI `fg`/`bg`/`attributes`.
- Themes live in `src/tui-obj-view-themes/` (same key set as the DOM themes, values are `{ fg, bg, bold, dim, … }`). `TextAttributes` bit flags are **inlined**, not imported from `@opentui/core`, because importing core eagerly loads its native FFI backend — keep the theme/formatter path free of `@opentui/*` runtime imports so it stays testable under plain Node/Vitest.
- Focus is tracked in a **ref** (`focusedRef`) and read by [useKeyboardNav](src/tui-obj-view/useKeyboardNav.ts), so bursts of key events (key-repeat, or several events before React commits) compose correctly instead of collapsing on a stale render closure. Relative moves use the `setFocusedIndex(prev => …)` updater form.
- Each TUI JSX file starts with `/** @jsxImportSource @opentui/react */` — that pulls OpenTUI's `<box>`/`<text>`/`<input>` intrinsic-element types **per file** without disturbing the DOM components (which use real `<div>`/`<span className>`). Components are typed `(props) => React.ReactNode`, **not** `React.FC`, because React 19's `FC` return type includes `Promise<ReactNode>` which OpenTUI's `JSX.Element` rejects.
- Built by [vite.config.tui.ts](vite.config.tui.ts) to `dist-tui/` (lib at `./tui`, CLI at `bin/react-obj-view.tsx`). **Runtime is Bun**, not Node: OpenTUI's core needs FFI and `@opentui/react` imports `react-reconciler/constants` without an extension (unresolvable under Node ESM). The CLI shebang is `#!/usr/bin/env bun`.
- Tests: pure-logic units (`formatValue`, `highlightSegments`, `clampFirstVisible`) run under Vitest. The full-render test ([TuiObjectView.test.tsx](src/tui-obj-view/TuiObjectView.test.tsx)) dynamic-imports `@opentui/react/test-utils` and **skips cleanly** when the native backend is unavailable (i.e. under plain Node CI); it exercises a real frame under Bun.

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

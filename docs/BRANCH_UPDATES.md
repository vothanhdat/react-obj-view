# Work Branch Update Report

_Comparison base_: commit `fabf432` (`Merge remote-tracking branch 'origin/master'`).

This document lists the notable code and API changes introduced on the `work` branch since it diverged from the last synchronized master commit. Use it as a guide when reviewing or porting the branch.

## 1. Tree pipeline modularization

- Added a generic tree-walking engine in `src/libs/tree-core/walkingFactory.ts`. It wraps adapter callbacks (value transforms, child enumeration, default expansion, change detection, etc.) and reuses cached node state via `StateFactory`, enabling adapters for domains beyond plain objects. 【F:src/libs/tree-core/walkingFactory.ts†L1-L200】
- Defined strongly-typed adapter/context contracts in `src/libs/tree-core/types.ts` plus lightweight helpers such as `InferWalkingInstance` so UI hooks can remain generic. 【F:src/libs/tree-core/types.ts†L1-L76】

## 2. Object-tree adapter & resolvers

- Implemented `objectWalkingAdaper` + `objectTreeWalkingFactory`, which parse metadata bits, detect circular references, and delegate entry enumeration to `getEntriesCb`. This adapter powers all object traversal in the new stack. 【F:src/object-tree/objectWalkingAdaper.ts†L1-L60】
- Promoted resolver utilities into `src/object-tree/resolver`. Defaults now cover `Promise`, `Map`, `Set`, lazy wrappers, grouped proxies, etc., and expose the grouping factories used by the public API. 【F:src/object-tree/resolver/index.ts†L1-L30】
- Public types (`ResolverFn`, `ObjectWalkingConfig`, adapters/contexts) moved into `src/object-tree/types.ts`, making it easier for external consumers to extend walkers or resolvers with proper type support. 【F:src/object-tree/types.ts†L1-L52】

## 3. React tree-view & virtualization layer

- Introduced `useReactTree` to memoize walker instances, expose `refreshPath` / `toggleChildExpand`, and lazily wrap nodes via `FlattenNodeWrapper`. 【F:src/libs/react-tree-view/useReactTree.tsx†L1-L93】
- Added `ReactTreeView` which feeds walker output into the shared `VirtualScroller`, while keeping DOM container props customizable. 【F:src/libs/react-tree-view/ReactTreeView.tsx†L1-L24】
- Extracted a reusable virtual scroller (`src/libs/virtual-scroller/VirtualScroller.tsx`) that measures viewport bounds, tracks offsets, and emits `{start,end}` windows to row renderers. 【F:src/libs/virtual-scroller/VirtualScroller.tsx†L1-L85】

## 4. ObjectView runtime & API adjustments

- `src/react-obj-view/ObjectView.tsx` now composes the generic tree stack (`useReactTree` + `ReactTreeView`), rebuilds resolver maps (including grouping helpers), and wires new options like `stickyPathHeaders`, `includeSymbols`, and `showLineNumbers` directly into the renderer. 【F:src/react-obj-view/ObjectView.tsx†L19-L113】
- The prop contract (`src/react-obj-view/types.ts`) reflects the expanded feature set, including grouped themes via `ThemeColor` and symbol enumeration toggles. 【F:src/react-obj-view/types.ts†L5-L23】

## 5. Theme system reorganization

- All presets/types live in `src/react-obj-view-themes`. `type.ts` defines canonical CSS variable keys plus `createTheme` / `extendTheme`. 【F:src/react-obj-view-themes/type.ts†L1-L39】
- Presets such as Monokai, Dracula, One Dark, etc., are centralized in `presets.ts`, providing consistent color maps for each node type. 【F:src/react-obj-view-themes/presets.ts†L1-L161】

## 6. Benchmarks & internal tooling

- Added `bench/perf.bench.ts`, a Vitest-powered benchmark that stresses the new walker with 10k to ~1M node payloads across enumerable/non-enumerable configurations. 【F:bench/perf.bench.ts†L1-L67】

Refer to this file whenever you need to reconcile the `work` branch with master or update external documentation/release notes.

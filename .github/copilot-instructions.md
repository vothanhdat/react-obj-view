## Project Snapshot
- `react-state-custom` is a hook-first state management library; entrypoint `src/index.ts` re-exports context factories and subscription hooks.
- TypeScript only; consumers are expected to be React 19 apps (see `package.json` peerDependencies).
- Library build artifacts live in `dist/`; all source utilities reside under `src/state-utils/`.

## Context Core
- `Context` (`src/state-utils/ctx.ts`) extends `EventTarget`; `data` stores the latest values and `publish` fires per-key DOM events when a loose `!=` comparison detects change.
- `getContext` memoizes by context name; `useDataContext(name)` memoizes the lookup via React `useMemo`.
- `useDataSource`/`useDataSourceMultiple` publish new values and register keys in `ctx.registry`; duplicate sources log via `useRegistryChecker`.

## Root Contexts
- `createRootCtx(name, useFn)` (`src/state-utils/createRootCtx.tsx`) wraps your hook (`useFn`) in a hidden `Root` component that pushes its result into a derived context namespace.
- Context names come from `name` plus sorted prop key/value pairs; keep props serializable and stable to avoid collisions.
- `ctxMountedCheck` blocks multiple `Root` instances for the same name; duplicates throw with the original call stack.
- Use `useCtxStateStrict` to hard-fail when the `Root` is missing, or `useCtxState` to surface a delayed console error instead.

## Auto Context Lifecycle
- `AutoRootCtx` (`src/state-utils/createAutoCtx.tsx`) maintains a global `'auto-ctx'` context exposing `subscribe(Root, params)` and reference counts for each instance.
- Mount `<AutoRootCtx Wrapper={YourErrorBoundary}>` once near the app root; it renders requested `Root` components inside the optional wrapper.
- `createAutoCtx(rootCtx, unmountTime?)` returns `useCtxState(params)` that subscribes through `'auto-ctx'` and hands back `useDataContext` for the resolved name.
- Multiple callers with identical params share a single `Root`; `unmountTime` delays teardown to absorb rapid mount/unmount cycles.

## Subscription Patterns
- `useDataSourceMultiple(ctx, ...entries)` expects stable `[key, value]` tuples; internal `useArrayHash` hashes length and reference equality only.
- Use `useDataSubscribe(ctx, key, debounceMs)` or `useDataSubscribeMultiple(ctx, ...keys)` for keyed reads; debounce variants batch updates when values bounce.
- `useDataSubscribeWithTransform` recomputes the transformed shape only on change; memoize the `transform` fn to avoid churn.
- `useQuickSubscribe(ctx)` returns a proxy over `ctx.data`; destructure needed fields immediately during render and avoid storing the proxy for later use.

## Utilities and Gotchas
- Value comparisons are shallow; mutate objects before republishing or provide new references so `publish` sees changes.
- `useArrayHash`/`useObjectHash` generate random hashes when array/object shape changes; they do not deep-compare nested content.
- The reserved `'auto-ctx'` namespace powers `AutoRootCtx`; do not manually reuse this context name.

## Build and Tooling
- `yarn build` runs Vite with `@vitejs/plugin-react`, `vite-plugin-dts`, and `vite-bundle-analyzer`; the analyzer spins up a server after builds—stop it in CI if unused.
- `yarn dev` starts the Vite dev server on port 3000; useful for manual inspection of bundle output.
- Tests are stubbed (`yarn test` exits 0 after printing "No tests specified"); add coverage before depending on test gates.
- Repo is Yarn 4 (PnP); if editors struggle with module resolution, run `./fix-vscode-yarn-pnp.sh`.

## Reference Docs
- README (`README.md`) offers narrative examples and positioning.
- API reference (`API_DOCUMENTATION.md`) documents every export; update alongside code changes.

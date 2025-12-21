# Object Tree Adapter & React Viewer

This guide focuses on the object-specific pieces that sit on top of the generic tree stack. If you want to understand the underlying walker + virtualisation flow, read [Generic Tree Stack](./GENERIC_TREE_VIEW.md) first.

## 1. Adapter & walker

- [`objectWalkingAdaper`](../src/object-tree/objectWalkingAdaper.ts) implements the `WalkingAdapter` contract for plain objects, arrays, Maps/Sets, lazy wrappers, and any other resolver-supported reference.
- [`objectTreeWalkingFactory`](../src/object-tree/objectWalkingAdaper.ts#L40) simply calls `walkingFactory(objectWalkingAdaper)` and returns a ready-to-use instance factory for the React hook.
- [`parseWalkingMeta`](../src/object-tree/objectWalkingAdaper.ts#L6-L15) decodes two bit flags injected during traversal:
  - `enumerable` – whether a property should render dimmed styles.
  - `isCircular` – whether the node reuses a previously-visited reference.

## 2. Object configs, resolvers, and grouping

`ObjectView` builds a `config` object that drives enumeration:

```ts
const config = {
  nonEnumerable,
  resolver,
  symbol: includeSymbols,
};
```

The resolver map is assembled in [`src/react-obj-view/ObjectView.tsx`](../src/react-obj-view/ObjectView.tsx):

1. Start with [`DEFAULT_RESOLVER`](../src/object-tree/resolver/index.ts) for Promises, Maps/Sets, errors, dates, lazy values, grouped proxies, etc.
2. Merge any user-provided resolver entries.
3. Append [`GROUP_ARRAY_RESOLVER`](../src/object-tree/resolver/grouped.ts) / [`GROUP_OBJECT_RESOLVER`](../src/object-tree/resolver/grouped.ts) when `arrayGroupSize` or `objectGroupSize` is greater than `1`. These resolvers create collapsed groups by default to maintain performance.

Resolvers receive the current [`WalkingConfig`](../src/object-tree/types.ts) so they can honour `nonEnumerable` and `symbol` flags while pushing entries through the callback.

## 3. React wiring

`ObjectView` composes the full stack:

1. `useReactTree` from [`src/libs/react-tree-view/useReactTree.tsx`](../src/libs/react-tree-view/useReactTree.tsx) memoises `objectTreeWalkingFactory`, the parsed config, and the requested `expandLevel`.
2. [`RenderNode`](../src/react-obj-view/components/RenderNode.tsx) interprets `FlattenNodeWrapper` data, toggles expansion, paints previews, and drives change-highlighting.
3. [`ReactTreeView`](../src/libs/react-tree-view/ReactTreeView.tsx) renders rows through the shared virtual scroller with optional sticky path headers.

The combination gives you virtualization, sticky ancestors, and deterministic expand/collapse semantics for any object graph.

## 4. Search & Navigation

`ObjectView` exposes a streaming search handle via `ref`:

```tsx
export type ObjectViewRef = {
  search: (
    filterFn: ((value: unknown, key: PropertyKey, paths: PropertyKey[]) => boolean) | undefined,
    markTerm: string | RegExp | undefined,
    onResult: (paths: Key[][]) => void,
    options?: { fullSearch?: boolean; maxDepth?: number; iterateSize?: number; maxResult?: number }
  ) => Promise<void>;
  scrollToPaths: (
    paths: Key[],
    options?: ScrollToOptions,
    offsetTop?: number,
    offsetBottom?: number,
  ) => Promise<void>;
};
```

- **`search`**: Streams batches to `onResult` between `requestIdleCallback` frames so long searches stay responsive. `filterFn` decides matches; `markTerm` powers the highlighter.
- **`scrollToPaths`**: Auto-expands necessary parents and scrolls the virtual list to the target node (respects native `ScrollToOptions`) and accepts optional `offsetTop` / `offsetBottom` padding (defaults: `200` / `100`).

## 5. Search Styling & Custom UI

The built-in `SearchComponent` is a separate export that you can use for convenience. It floats over the `ObjectView` container.

### Style overrides

Target the `.big-objview-search` class to customize the appearance:

```css
.big-objview-search {
  /* Override position */
  top: 10px;
  right: 10px;
}

.big-objview-search .search-box {
  /* Customize the input container */
  background-color: #333;
  border-radius: 8px;
}
```

### Build your own UI

If the default search bar doesn't fit your design, simply ignore `SearchComponent` and use the ref methods directly:

```tsx
const handleSearch = async () => {
  const filterFn = (value: unknown, key: PropertyKey) =>
    String(key).toLowerCase().includes('id');

  const markTerm = /id/gi;

  await objViewRef.current.search(
    filterFn,
    markTerm,
    (matches) => {
      // handle batches of matching paths
    },
    { maxResult: 2000, maxDepth: 8 }
  );
};
```

## 6. Extending the object viewer

You can customise behaviour at several layers:

| Layer | File(s) | Extension points |
| --- | --- | --- |
| Resolver map | [`src/object-tree/resolver`](../src/object-tree/resolver) | Add entries for custom classes, override previews, or reuse the grouped resolvers for bespoke batch sizes. |
| Entry enumeration | [`src/object-tree/getEntries.ts`](../src/object-tree/getEntries.ts) | Create alternate entry callbacks (e.g., hide prototype chains, filter values) and feed them into a custom resolver. |
| Rendering | [`src/react-obj-view/components`](../src/react-obj-view/components) | Swap `RenderNode` with a custom row renderer, tweak `RenderValue`, or apply new visual affordances. |
| Viewer shell | [`ObjectView`](../src/react-obj-view/ObjectView.tsx) | Wire additional props, new toolbar buttons, or bespoke virtualization options before handing control to `ReactTreeView`. |

## 7. Example: extend resolver behaviour

```tsx
import { ObjectView, type ResolverFn } from "react-obj-view";

class Endpoint {
  constructor(
    public method: string,
    public url: string,
    public latency: number,
  ) {}
}

const endpointResolver: ResolverFn<Endpoint> = (value, cb, next, isPreview) => {
  if (isPreview) {
    cb("summary", `${value.method} ${value.url}`, true);
    return;
  }

  cb("latency", `${value.latency}ms`, true);
  next(value);
};

const resolver = new Map([[Endpoint, endpointResolver]]);

<ObjectView valueGetter={() => apiSnapshot} resolver={resolver} arrayGroupSize={100} />;
```

Pair this with the generic stack guide to build entirely new adapters or to reuse the virtualised renderer for domains beyond JavaScript objects.

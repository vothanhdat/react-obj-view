# API Documentation

Comprehensive reference for the React Object View component and supporting utilities.

## Setup

### Installation

```bash
npm install react-obj-view
# or
yarn add react-obj-view
```

### Import

```tsx
import { ObjectView } from 'react-obj-view';
import 'react-obj-view/dist/react-obj-view.css';
```

> The CSS bundle is shipped separately so you can control how and when styles are loaded.

## Core Libraries

The library exports core modules for building custom tree views:

```tsx
import { TreeCore, ReactTreeView, VirtualScroller } from 'react-obj-view';
```

### TreeCore

Contains the core tree walking logic.

- `walkingFactory`: Factory function to create a tree walker.
- `types`: Type definitions for adapters and contexts.

### ReactTreeView

React hooks and components for tree visualization.

- `ReactTreeView`: Main tree view component.
- `useReactTree`: Hook to manage tree state.
- `FlattenNodeWrapper`: Wrapper for flattened tree nodes.

### VirtualScroller

Virtualization logic for efficient rendering.

- `VirtualScroller`: The virtual scroller component.

## Component Interface

```ts
type ResolverFnCb = (key: PropertyKey, value: unknown, enumerable: boolean) => boolean | void;

export type ResolverFn<T = any> = (
  value: T,
  cb: ResolverFnCb,
  next: (value: unknown, cb?: ResolverFnCb) => void,
  isPreview: boolean,
  config: WalkingConfig,
  stableRef: unknown,
) => void;

export type ObjectViewProps = {
  valueGetter: () => unknown;
  name?: string;
  expandLevel?: number | boolean;
  objectGroupSize?: number;
  arrayGroupSize?: number;
  resolver?: Map<any, ResolverFn>;
  highlightUpdate?: boolean;
  stickyPathHeaders?: boolean;
  preview?: boolean;
  nonEnumerable?: boolean;
  includeSymbols?: boolean;
  showLineNumbers?: boolean;
  style?: React.CSSProperties;
  lineHeight?: number;
  className?: string;
  actionRenders?: React.FC<ObjectViewRenderRowProps>;
  iterateSize?: number;
};
```

### Prop Details

| Prop | Default | Description |
|------|---------|-------------|
| `valueGetter` | — (required) | Function that returns the value to render. Wrap it in `useMemo`/`useCallback` so it only changes when the underlying data changes. |
| `name` | `undefined` | Optional label for the root node. |
| `expandLevel` | `false` | Initial expansion depth. `true` expands all nodes (up to depth 20), `false` collapses everything, numbers expand that many levels (0-based). |
| `objectGroupSize` | `0` | When greater than `1`, adds an object grouping resolver that batches enumerable keys into ranges. **Objects don’t expose their “length”, so the walker must enumerate every key to know whether grouping applies—keep this disabled unless you’re comfortable paying that enumeration cost.** |
| `arrayGroupSize` | `0` | When greater than `1`, adds an array grouping resolver that presents ranges like `[0…49]`. |
| `resolver` | `undefined` | Custom resolver map merged on top of the built-in resolver map. Keys are constructors; values are `ResolverFn`s. |
| `highlightUpdate` | `true` | Enables flash-highlighting when a node's value changes; set to `false` to disable. |
| `stickyPathHeaders` | `true` | Keeps the current ancestor row pinned to the top of the viewport while its children scroll; set to `false` for legacy, non-sticky behaviour. |
| `preview` | `true` | Shows inline previews (e.g. `Array(10)` or string snippets) for collapsed nodes. |
| `nonEnumerable` | `false` | Includes non-enumerable properties when traversing objects. |
| `iterateSize` | `100000` | Controls the number of steps the async walker performs before yielding to the main thread. Lower values improve responsiveness but may increase total render time. |
| `includeSymbols` | `false` | Includes symbol-keyed properties during traversal and in previews. |
| `showLineNumbers` | `false` | Renders a gutter with 0-based line numbers next to each row. |
| `style` | `undefined` | Inline styles applied to the `.big-objview-root` container. |
| `lineHeight` | `14` | Height, in pixels, of each rendered row. **Must reflect the real CSS height**—if your theme overrides fonts, padding, or `--bigobjview` variables, update this prop (or the corresponding CSS variable) so virtualization remains accurate. |
| `className` | `undefined` | Extra class names merged onto `.big-objview-root` for custom styling. |
| `actionRenders` | `DefaultActions` | Component to render custom actions (like copy, expand/collapse) for each row. Receives `ObjectViewRenderRowProps`. |

## Resolver System

Resolvers control how entries are produced for a specific constructor. Each resolver receives:

1. `value` – the concrete instance being rendered.
2. `cb` – call with `key`, `value`, and `enumerable` to push entries. Return `true` to stop iteration early.
3. `next` – continue traversal of another value (usually the original instance). Optionally pass a custom callback to post-process entries.
4. `isPreview` – `true` when the resolver is asked for a collapsed preview.
5. `config` – the `WalkingConfig` currently in use (respect flags such as `nonEnumerable`, `symbol`, grouping, etc.).
6. `stableRef` – an opaque object that stays stable for a given node/state. Use it as a cache key when you need to reuse expensive computations across renders without leaking memory.

### Built-in Resolvers

React Object View includes default resolvers for a wide range of JavaScript data types:

- **Standard Objects**: Plain objects, Arrays.
- **Collections**: `Map`, `Set`.
- **Typed Arrays**: `Int8Array`, `Uint8Array`, `Uint8ClampedArray`, `Int16Array`, `Uint16Array`, `Int32Array`, `Uint32Array`, `Float32Array`, `Float64Array`.
- **Buffers**: `ArrayBuffer`, `DataView`.
- **Others**: `Date`, `RegExp`, `Promise`, `Error`.

Typed arrays and buffers are displayed with a hex viewer-like interface, showing offsets and value previews.

### Creating Custom Resolvers

```tsx
class User {
  constructor(public name: string, public email: string, public role: string = 'user') {}
}

const resolver = new Map([
  [User, (user, cb, next, isPreview, config, stableRef) => {
    if (isPreview) {
      cb('summary', `${user.name} • ${user.email}`, true);
      return;
    }

    cb('badge', `⭐ ${user.role.toUpperCase()}`, true);
    next(user);
  }],
]);
```

Resolvers participate in both preview and expanded phases, so make sure to call `next` to keep default behaviour when you are done injecting custom entries.

## Rendering Pipeline

`ObjectView` composes the new tree stack described in [Generic Tree Stack](./docs/GENERIC_TREE_VIEW.md):

1. **Flattening** – [`useReactTree`](src/libs/react-tree-view/useReactTree.tsx) memoises `objectTreeWalkingFactory` and runs the adapter-defined traversal from [`src/object-tree/objectWalkingAdaper.ts`](src/object-tree/objectWalkingAdaper.ts). Circular references are handled via [`CircularChecking`](src/object-tree/utils/CircularChecking.ts).
2. **Virtualisation** – [`ReactTreeView`](src/libs/react-tree-view/ReactTreeView.tsx) pipes walker output into [`VirtualScroller`](src/libs/virtual-scroller/VirtualScroller.tsx). [`VirtualScrollRender`](src/libs/react-tree-view/VirtualScrollRender.tsx) renders only the visible slice of rows while keeping sticky path headers in sync.
3. **Node Rendering** – [`RenderNode`](src/react-obj-view/components/RenderNode.tsx) composes [`RenderName`](src/react-obj-view/components/RenderName.tsx) and [`RenderValue`](src/react-obj-view/components/RenderValue.tsx). It controls expand/collapse state, circular badges, previews, and click handling.
4. **Value Rendering** – [`RenderValue`](src/react-obj-view/components/RenderValue.tsx) decides between preview and raw modes before delegating to [`RenderRawValue`](src/react-obj-view/components/RenderRawValue.tsx) or [`RenderPreview`](src/react-obj-view/components/RenderPreview.tsx).
5. **Hooks & helpers** – [`useWrapper`](src/libs/react-tree-view/useWrapper.tsx) memoises getter functions, change-highlighting lives inside [`RenderName`](src/react-obj-view/components/RenderName.tsx), and resolver metadata flows through [`parseWalkingMeta`](src/object-tree/objectWalkingAdaper.ts#L6-L15).


## Styling Reference

Component styles live in [`src/react-obj-view/components/style.css`](src/react-obj-view/components/style.css). Key selectors:

- `.big-objview-root` – root container that defines fonts, colours, and CSS variables (`--bigobjview-color`, `--bigobjview-bg-color`, `--bigobjview-change-color`). The default height is `400px`; override it in your stylesheet to fit your layout.
- `.node-container` – row wrapper that indents nodes based on depth.
- `.node-default` – clickable node label and value. `data-child="true"` indicates expandable nodes; `data-nonenumrable="true"` dims non-enumerable members.
- `.expand-symbol` – caret indicator (▶/▼) rendered for expandable nodes.
- `.name` – property labels. The `.updated` modifier is applied when change highlighting is active.
- `.value` – value span with type-based modifiers such as `.type-boolean`, `.type-object-date`, `.value-preview`, etc.
- `.pointer-cursor` – added when a lazy value can be expanded by clicking.
- `.tag-circular` – badge shown for circular references.
- `.symbol` – colon separators and arrow glyphs.

Override these selectors or CSS variables to integrate the viewer with your design system.

## Theme Presets

The library ships with curated colour presets that target popular editor palettes. Import the one that best matches your application and pass the variables to your stylesheet or CSS-in-JS solution:

```tsx
import { ObjectView } from 'react-obj-view';
import { themeMonokai } from 'react-obj-view';

<ObjectView valueGetter={getter} style={themeMonokai} />;
```

Because presets are plain `CSSProperties` objects, you can spread them into your own style object:

```tsx
<ObjectView
  valueGetter={getter}
  style={{
    ...themeMonokai,
    height: 360,
  }}
/>
```

> `getter` represents the memoised `valueGetter` function you already provide to the component.

Available presets:

| Preset | Palette | Notes |
| --- | --- | --- |
| `themeMonokai` | Monokai | High-contrast syntax colours on a deep charcoal background. |
| `themeDracula` | Dracula | Cool-toned purples and teals with neon highlights. |
| `themeOneDark` | One Dark | Atom-inspired blues and oranges with a slate background. |
| `themeMaterialDarker` | Material Darker | Material palette with vivid accents on a dark canvas. |
| `themeGeneral` | Neutral | Balanced light palette with restrained accents for dashboards and data panels. |
| `themeGitHubLight` | GitHub Light | Neutral GitHub-styled greys with accessible accent colours. |
| `themeSolarizedLight` | Solarized Light | Pastel teal/orange scheme with soft beige background. |
| `themeQuietLight` | Quiet Light | VS Code's calm light theme with muted tones. |
| `themeSepia` | Sepia | Warm sepia hues suitable for reader-friendly layouts. |

Each preset exposes the same set of CSS custom properties as `themeDefault`, so you can start with a preset and selectively override individual tokens as needed.

### Creating custom themes

When presets are not enough, you can compose your own palette through helpers exported at the package root:

```ts
import {
  createTheme,
  extendTheme,
  themeDefault,
} from "react-obj-view";

const cyberpunk = createTheme({
  "--bigobjview-color": "#f2f2f2",
  "--bigobjview-bg-color": "#080215",
  "--bigobjview-change-color": "#ff00ff",
  "--bigobjview-fontsize": "12px",
  "--bigobjview-type-boolean-color": "#00ffe1",
  "--bigobjview-type-number-color": "#ff6f00",
  "--bigobjview-type-bigint-color": "#ff6f00",
  "--bigobjview-type-string-color": "#e1ff00",
  "--bigobjview-type-object-array-color": "#00d1ff",
  "--bigobjview-type-object-object-color": "#bd00ff",
  "--bigobjview-type-object-promise-color": "#ff00c8",
  "--bigobjview-type-object-map-color": "#00ffa3",
  "--bigobjview-type-object-set-color": "#ff9100",
  "--bigobjview-type-function-color": "#1de9b6",
  "--bigobjview-type-object-regexp-color": "#ff4081",
  "--bigobjview-type-object-date-color": "#7c4dff",
  "--bigobjview-type-object-error-color": "#ff1744",
  "--bigobjview-action-btn": "#444",
  "--bigobjview-action-success": "#00e676",
  "--bigobjview-action-error": "#ff5252",
});

const cyberpunkTight = extendTheme(cyberpunk, {
  "--bigobjview-fontsize": "11px",
  lineHeight: 12,
});
```

- `createTheme(valueMap, extraStyles?)` – expects all CSS variables listed in the styling reference table so the resulting object stays compatible with the component.
- `extendTheme(baseTheme, overrides)` – clone an existing theme (preset or custom) and override only specific CSS variables and/or vanilla `style` props such as `lineHeight`, `fontFamily`, etc.

These helpers ensure the generated objects remain compatible with the component’s `style` prop while still benefiting from the smaller bundle produced by the internal tuple representation.

## Interactive Features

### Hover Interactions

The viewer automatically highlights rows on hover to improve navigation through deeply nested structures. The implementation uses [`useHoverInteractions`](src/react-obj-view/hooks/useHoverInteractions.tsx) to:

- Track the currently hovered row via CSS custom properties (`--active-index` and `--active-parent`)
- Apply visual feedback through CSS styles that dim sibling rows
- Debounce mouse leave events to prevent flicker during rapid movements

No configuration is needed—hover effects are enabled by default and automatically adapt to your theme.

### Copy Actions

Each row includes action buttons powered by [`DefaultActions`](src/react-obj-view/value-renders/Actions.tsx) and the [`useCopy`](src/react-obj-view/hooks/useCopy.tsx) hook:

- **Copy** button – appears for primitives (strings, numbers, bigints) and copies the raw value to clipboard
- **Copy JSON** button – appears for plain objects, arrays, and dates; serializes the value via `JSON.stringify()` before copying
- Buttons show loading, success (✓), and error states with automatic reset after 5 seconds

The copy functionality uses the browser's Clipboard API and defers execution through `requestIdleCallback` to avoid blocking the main thread.

## Custom Action Renders

You can customize the actions rendered for each row (like the copy button) by providing the `actionRenders` prop. This component receives `ObjectViewRenderRowProps` and can render any custom UI.

```tsx
import { ObjectView, type ObjectViewRenderRowProps } from 'react-obj-view';

const MyCustomActions: React.FC<ObjectViewRenderRowProps> = (props) => {
  const { nodeDataWrapper, valueWrapper } = props;
  const nodeData = nodeDataWrapper();
  const value = valueWrapper();

  return (
    <button onClick={() => console.log('Clicked:', nodeData.key, value)}>
      Log
    </button>
  );
};

<ObjectView
  valueGetter={() => myData}
  actionRenders={MyCustomActions}
/>
```

## Search API

`ObjectView` exposes an imperative handle for streaming search and navigation. Attach a ref to the component to access it:

```ts
export interface ObjectViewHandle {
  search: (
    filterFn: ((value: unknown, key: PropertyKey, paths: PropertyKey[]) => boolean) | undefined,
    markTerm: string | RegExp | undefined,
    onResult: (results: PropertyKey[][]) => void,
    options?: {
      iterateSize?: number;
      maxDepth?: number;
      fullSearch?: boolean;
      maxResult?: number;
    }
  ) => Promise<void>;
  scrollToPaths: (
    paths: PropertyKey[],
    options?: ScrollToOptions,
    offsetTop?: number,
    offsetBottom?: number,
  ) => Promise<void>;
}
```

- `filterFn` decides whether a node matches. Results stream in batches and are yielded to `onResult` between `requestIdleCallback` frames so large searches stay responsive.
- `markTerm` is a string or regex used to highlight matches via the built-in highlighter.
- Options: `iterateSize`, `maxDepth`, and `fullSearch` mirror the walker settings; `maxResult` caps how many matches are emitted (default `99_999`).
- Call `ref.current?.search()` with no arguments to clear highlights/results without wiring an `onResult` callback.
- `scrollToPaths` expands ancestors and scrolls the virtual list to a single requested path; forwards native `ScrollToOptions` and accepts optional `offsetTop` / `offsetBottom` padding (defaults: `200` / `100`) so sticky headers or surrounding UI don't cover the target row.

### Built-in floating search UI

Use the packaged `SearchComponent` for a ready-made UI with keyboard shortcuts and a loading indicator. It builds a tokenised filter and highlight regex, supports diacritic normalisation, and debounces input for you.

```tsx
import { useMemo, useRef, useState } from "react";
import { ObjectView, ObjectViewHandle, SearchComponent } from "react-obj-view";


function DebugPanel({data}) {

  const ref = useRef<ObjectViewHandle | null>(null);

  const [isOpen, setOpen] = useState(false)

  const searchOptions = useMemo(
    () => ({
      normalizeSymbol: (c: string) => c.normalize("NFD").replace(/\p{M}/gu, ""),
      maxResult: 5000,
      maxDepth: 12,
    }),
    [],
  );

  return <div>
    <ObjectView valueGetter={() => data} ref={ref} />
    <SearchComponent
      active={isOpen}
      onClose={() => setOpen(false)}
      handleSearch={(filterFn, markTerm, onResult, opts) =>
        ref.current?.search(filterFn, markTerm, onResult, opts)
      }
      scrollToPaths={(paths, scrollOpts) =>
        ref.current?.scrollToPaths(paths, scrollOpts, 200, 120)
      }
      options={searchOptions}
    />
  <div/>

}

```


- Search options: `normalizeSymbol` (available on `SearchComponent` only), `iterateSize`, `maxDepth`, `fullSearch`, and `maxResult` (defaults mirror `ObjectViewHandle.search`). Memoize `options` (e.g., via `useMemo`) so the handlers stay stable.
- The component shows a spinner while batches stream in and automatically applies highlights via the provided `markTerm` regex.

### Rolling your own search bar

You can skip `SearchComponent` and wire a bespoke search UI straight to the handle:

```tsx
import { useCallback, useMemo, useRef, useState } from "react";
import { ObjectView, ObjectViewHandle } from "react-obj-view";

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");

export function CustomSearchViewer({ data }: { data: unknown }) {
  const ref = useRef<ObjectViewHandle | null>(null);
  const [term, setTerm] = useState("");

  const tokens = useMemo(
    () => term.toLowerCase().trim().split(/\s+/).filter(Boolean),
    [term]
  );

  const filterFn = useMemo(() => {
    if (!tokens.length) return undefined;
    return (value: unknown, key: PropertyKey) => {
      const haystack = `${String(key)} ${String(value)}`.toLowerCase();
      return tokens.every((t) => haystack.includes(t));
    };
  }, [tokens]);

  const markTerm = useMemo(
    () => (tokens.length ? new RegExp(tokens.map(escapeRegex).join("|"), "gi") : undefined),
    [tokens]
  );

  const runSearch = useCallback(async () => {
    await ref.current?.search(filterFn, markTerm, undefined, {
      maxResult: 5000,
      maxDepth: 12,
    });
  }, [filterFn, markTerm]);

  return (
    <>
      <input
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Search keys/values"
      />
      <button onClick={runSearch}>Search</button>
      <ObjectView valueGetter={() => data} ref={ref} />
    </>
  );
}
```

- Provide your own `filterFn` and `markTerm` (string or regex). Results stream through `onResult`; capture them if you want a side list of matches.
- Call `scrollToPaths(paths, scrollOpts, offsetTop?, offsetBottom?)` when the user clicks a result row to jump there and add viewport padding if needed.

## Behaviour Notes

- **Expansion state** – `useReactTree` keeps expansion toggles inside the walker state keyed by each node path. Clicking a caret invokes `toggleChildExpand`, which mutates the cached node and triggers a re-render.
- **Circular references** – [`CircularChecking`](src/object-tree/utils/CircularChecking.ts) records visited objects per traversal; repeated references are marked with the `CIRCULAR` badge and do not recurse.
- **Lazy properties** – Getters are wrapped by [`LazyValue`](src/object-tree/custom-class/LazyValueWrapper.ts). Clicking the preview evaluates the getter, caches the value (or error via `LazyValueError`), and refreshes the node.
- **Change detection** – `highlightUpdate` enables [`useChangeFlashClasses`](src/react-obj-view/hooks/useChangeFlashClasses.tsx), which compares previous values and briefly applies the `updated` class.
- **Grouping** – [`GroupedProxy`](src/object-tree/custom-class/groupedProxy.ts) instances expose `getSize`, `getKey`, and `getObject` helpers so large collections render in constant time until expanded.

## Generic Tree APIs

The library now exports low-level tree APIs that can be used to build custom tree views for non-object data structures:

### `walkingFactory`

```ts
import { walkingFactory, type WalkingAdapter } from 'react-obj-view';
```

Creates a tree walker instance from a custom adapter. The adapter defines how to:
- Determine if a value has children (`valueHasChild`)
- Iterate over child values (`iterateChilds`)
- Generate metadata for each node (`defaultMeta`)
- Transform values before rendering (`transformValue`)

See [Generic Tree Stack](./docs/GENERIC_TREE_VIEW.md) for a complete example of building a file-system tree view.

### `objectTreeWalking`

```ts
import { objectTreeWalking, parseWalkingMeta } from 'react-obj-view';
```

The pre-configured walker factory for JavaScript objects. This is what `ObjectView` uses internally. Export it if you need to:
- Build a custom object viewer with different UI components
- Integrate object traversal into an existing tree UI
- Access raw walker results for logging or analysis

### Type Utilities

```ts
import { type InferWalkingResult, type InferNodeResult } from 'react-obj-view';
```

Type helpers for extracting walker output types from adapter definitions:
- `InferWalkingResult<T>` – the complete walker result including `childCount` and `getNodeByIndex`
- `InferNodeResult<T>` – the individual node structure with `value`, `key`, `meta`, and expansion state

## Supporting Utilities

- [`src/object-tree/custom-class/groupedProxy.ts`](src/object-tree/custom-class/groupedProxy.ts) – Implements proxy objects for grouped ranges and helpers like `groupedProxyIsEqual`.
- [`src/object-tree/getEntries.ts`](src/object-tree/getEntries.ts) – Normalises property enumeration respecting `nonEnumerable`, `includeSymbols`, and resolver output.
- [`src/object-tree/utils/getObjectUniqueId.ts`](src/object-tree/utils/getObjectUniqueId.ts) – Provides stable identifiers for resolver maps used in memoisation.
- [`src/libs/tree-core/utils/StateFactory.ts`](src/libs/tree-core/utils/StateFactory.ts) – Creates persistent node state objects reused between renders.

## Troubleshooting

- Ensure `valueGetter` stays stable across renders; changing the function identity forces a full traversal.
- When grouping is enabled, use the arrow next to a range (e.g. `items[0…49]`) to expand the proxied subset.
- Change highlighting is enabled by default; set `highlightUpdate={false}` to turn it off.
- Toggle `nonEnumerable` (and `includeSymbols`) to inspect getters, symbols, and prototype members.

## Related Documentation

- [README](README.md) – Overview and examples.
- [USAGE_GUIDE](USAGE_GUIDE.md) – Practical recipes.
- [Generic Tree Stack](./docs/GENERIC_TREE_VIEW.md) – Architecture of `tree-core`, `react-tree-view`, and the virtual-scroller.
- [Object Tree Adapter & React Viewer](./docs/OBJECT_TREE_VIEW.md) – How the built-in adapter composes resolvers with the React renderer.
- [DEMO_SETUP](DEMO_SETUP.md) – Instructions for the GitHub Pages demo.

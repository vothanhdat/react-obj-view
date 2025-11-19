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
| `highlightUpdate` | `false` | Enables flash-highlighting when a node's value changes. |
| `stickyPathHeaders` | `true` | Keeps the current ancestor row pinned to the top of the viewport while its children scroll; set to `false` for legacy, non-sticky behaviour. |
| `preview` | `true` | Shows inline previews (e.g. `Array(10)` or string snippets) for collapsed nodes. |
| `nonEnumerable` | `false` | Includes non-enumerable properties when traversing objects. |
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

Located in [`src/object-tree/resolver`](src/object-tree/resolver):

- **Promises** (`Promise`, `InternalPromise`) – [`promise.ts`](src/object-tree/resolver/promise.ts) surfaces `[[status]]` and `[[result]]` entries so async state is visible while the underlying promise resolves.
- **Lazy values** (`LazyValue`) – [`lazyValueResolver.ts`](src/object-tree/resolver/lazyValueResolver.ts) defers getter execution until the node is expanded and caches either the returned value or thrown error.
- **Collections** (`Map`, `Set`, iterables) – [`collections.ts`](src/object-tree/resolver/collections.ts) exposes `[[Entries]]`, previews the first few members, and renders metadata such as `size`.
- **Errors, dates, regexes, custom wrappers** – handled via [`index.ts`](src/object-tree/resolver/index.ts), which wires every resolver into a shared `Map` ready for `ObjectView`.

Grouping helpers from [`src/object-tree/resolver/grouped.ts`](src/object-tree/resolver/grouped.ts) are attached when `arrayGroupSize`/`objectGroupSize` are provided. They emit [`GroupedProxy`](src/utils/groupedProxy.ts) instances that lazily expand ranges like `items[0…49]` only when needed.

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
import { ObjectView, ObjectViewRenderRowProps } from 'react-obj-view';

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
- If change highlighting seems absent, set `highlightUpdate={true}` explicitly.
- Toggle `nonEnumerable` (and `includeSymbols`) to inspect getters, symbols, and prototype members.

## Related Documentation

- [README](README.md) – Overview and examples.
- [USAGE_GUIDE](USAGE_GUIDE.md) – Practical recipes.
- [Generic Tree Stack](./docs/GENERIC_TREE_VIEW.md) – Architecture of `tree-core`, `react-tree-view`, and the virtual-scroller.
- [Object Tree Adapter & React Viewer](./docs/OBJECT_TREE_VIEW.md) – How the built-in adapter composes resolvers with the React renderer.
- [DEMO_SETUP](DEMO_SETUP.md) – Instructions for the GitHub Pages demo.

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
  preview?: boolean;
  nonEnumerable?: boolean;
  includeSymbols?: boolean;
  showLineNumbers?: boolean;
  style?: React.CSSProperties;
  lineHeight?: number;
  className?: string;
};
```

### Prop Details

| Prop | Default | Description |
|------|---------|-------------|
| `valueGetter` | — (required) | Function that returns the value to render. Wrap it in `useMemo`/`useCallback` so it only changes when the underlying data changes. |
| `name` | `undefined` | Optional label for the root node. |
| `expandLevel` | `false` | Initial expansion depth. `true` expands all nodes (up to depth 20), `false` collapses everything, numbers expand that many levels (0-based). |
| `objectGroupSize` | `0` | When greater than `1`, adds an object grouping resolver that batches enumerable keys into ranges. |
| `arrayGroupSize` | `0` | When greater than `1`, adds an array grouping resolver that presents ranges like `[0…49]`. |
| `resolver` | `undefined` | Custom resolver map merged on top of the built-in resolver map. Keys are constructors; values are `ResolverFn`s. |
| `highlightUpdate` | `false` | Enables flash-highlighting when a node's value changes. |
| `preview` | `true` | Shows inline previews (e.g. `Array(10)` or string snippets) for collapsed nodes. |
| `nonEnumerable` | `false` | Includes non-enumerable properties when traversing objects. |
| `includeSymbols` | `false` | Includes symbol-keyed properties during traversal and in previews. |
| `showLineNumbers` | `false` | Renders a gutter with 0-based line numbers next to each row. |
| `style` | `undefined` | Inline styles applied to the `.big-objview-root` container. |
| `lineHeight` | `14` | Height, in pixels, of each rendered row. Adjust when you override fonts/sizes. |
| `className` | `undefined` | Extra class names merged onto `.big-objview-root` for custom styling. |

## Resolver System

Resolvers control how entries are produced for a specific constructor. Each resolver receives:

1. `value` – the concrete instance being rendered.
2. `cb` – call with `key`, `value`, and `enumerable` to push entries. Return `true` to stop iteration early.
3. `next` – continue traversal of another value (usually the original instance). Optionally pass a custom callback to post-process entries.
4. `isPreview` – `true` when the resolver is asked for a collapsed preview.
5. `config` – the `WalkingConfig` currently in use (respect flags such as `nonEnumerable`, `symbol`, grouping, etc.).
6. `stableRef` – an opaque object that stays stable for a given node/state. Use it as a cache key when you need to reuse expensive computations across renders without leaking memory.

### Built-in Resolvers

Located in [`src/V5/resolvers/index.ts`](src/V5/resolvers/index.ts):

- **Promises** (`Promise`, `InternalPromise`) – surfaces `status`, resolved value, or rejection reason using the async-aware wrapper from [`PromiseWrapper.tsx`](src/Components/PromiseWrapper.tsx).
- **Lazy Values** (`LazyValue`) – ensures property getter evaluation happens on demand.
- **Custom Iterables** (`CustomIterator`) – powers `Map`/`Set` entry rendering through [`CustomEntry`](src/V5/resolvers/collections.ts).
- **Collections** (`Map`, `Set`) – preview entries inline and expose `[[Entries]]`/`size` metadata.

Grouping helpers from [`src/V5/resolvers/grouped.ts`](src/V5/resolvers/grouped.ts) are attached when `arrayGroupSize`/`objectGroupSize` are provided. They emit [`GroupedProxy`](src/utils/groupedProxy.ts) instances that lazily expand ranges like `items[0…49]` only when needed.

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

The renderer is implemented in [`src/V5/index.tsx`](src/V5/index.tsx) and combines several layers:

1. **Flattening** – [`useFlattenObjectView`](src/V5/useFlattenObjectView.tsx) builds a flat list of nodes by running [`walkingToIndexFactory`](src/V5/walkingToIndexFactory.ts). It memoises traversal state, tracks circular references via [`CircularChecking`](src/V5/CircularChecking.ts), and reacts to resolver changes.
2. **Virtualisation** – The internal [`VirtualScroller`](src/Components/VirtualScroller.tsx) measures the viewport and only renders the visible slice of nodes. `computeItemKey` uses the node path for stable identity.
3. **Node Rendering** – [`RenderNode`](src/Components/RenderNode.tsx) composes [`RenderName`](src/Components/RenderName.tsx), [`RenderValue`](src/Components/RenderValue.tsx), and change-flash logic. It controls expand/collapse state, preview detection, and circular badges.
4. **Value Rendering** – [`RenderValue`](src/Components/RenderValue.tsx) decides between preview and raw modes and delegates to [`RenderRawValue`](src/Components/RenderRawValue.tsx) or [`RenderPreview`](src/Components/RenderPreview.tsx). Promise-like values are wrapped with [`withPromiseWrapper`](src/Components/PromiseWrapper.tsx) so pending async results update automatically.
5. **Hooks** – `useWrapper` memoises getter functions, `useLazyValue` (from [`src/hooks/useLazyValue.tsx`](src/hooks/useLazyValue.tsx)) triggers lazy getters on demand, and `useChangeFlashClasses` applies the `updated` class when `highlightUpdate` is enabled.

## Styling Reference

Component styles live in [`src/Components/style.css`](src/Components/style.css). Key selectors:

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
import { themeMonokai } from 'react-obj-view/themes';

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

## Behaviour Notes

- **Expansion State** – `useFlattenObjectView` stores expansion toggles keyed by the node's path. Clicking a node toggles expansion via `toggleChildExpand`.
- **Circular References** – Each traversal records visited objects; repeated references are marked with the `CIRCULAR` badge and do not recurse.
- **Lazy Properties** – Getters are wrapped by `LazyValue`. Clicking the preview evaluates the getter, caches the value (or error via `LazyValueError`), and refreshes the node.
- **Change Detection** – `highlightUpdate` enables `useChangeFlashClasses`, which compares previous values and briefly applies the `updated` class.
- **Grouping** – `GroupedProxy` instances expose `getSize`, `getKey`, and `getObject` helpers so large collections render in constant time until expanded.

## Supporting Utilities

- [`src/utils/groupedProxy.ts`](src/utils/groupedProxy.ts) – Implements proxy objects for grouped ranges and helpers like `groupedProxyIsEqual`.
- [`src/V5/getEntries.ts`](src/V5/getEntries.ts) – Normalises property enumeration respecting `nonEnumerable` and resolver output.
- [`src/V5/getObjectUniqueId.ts`](src/V5/getObjectUniqueId.ts) – Provides stable identifiers for resolver maps used in memoisation.
- [`src/V5/StateFactory.ts`](src/V5/StateFactory.ts) – Creates persistent node state objects reused between renders.

## Troubleshooting

- Ensure `valueGetter` stays stable across renders; changing the function identity forces a full traversal.
- When grouping is enabled, use the arrow next to a range (e.g. `items[0…49]`) to expand the proxied subset.
- If change highlighting seems absent, set `highlightUpdate={true}` explicitly.
- Toggle `nonEnumerable` (and `includeSymbols`) to inspect getters, symbols, and prototype members.

## Related Documentation

- [README](README.md) – Overview and examples.
- [USAGE_GUIDE](USAGE_GUIDE.md) – Practical recipes.
- [DEMO_SETUP](DEMO_SETUP.md) – Instructions for the GitHub Pages demo.

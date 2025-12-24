# react-obj-view

> High-performance React component for inspecting deeply nested objects with virtualization, grouping, and deterministic value getters.

[![npm](https://img.shields.io/npm/v/react-obj-view.svg)](https://www.npmjs.com/package/react-obj-view)
[![bundle size](https://img.shields.io/bundlephobia/minzip/react-obj-view)](https://bundlephobia.com/package/react-obj-view)



![](/public/screen-shot.png)


React Object View targets React 19 projects (Node 22+ / Yarn 4 recommended) and ships a TypeScript-first API with ESM + UMD bundles.

---

## ✨ Features

- **Virtualized tree view** – only visible rows render, so 100k+ nodes stay smooth.
- **Async Rendering** – non-blocking tree traversal keeps the UI responsive even when processing massive datasets.
- **Resolver system** – promises, maps, sets, errors, dates, regexes, iterables, grouped proxies, typed arrays, buffers, and custom classes.
- **Sticky path headers** – pin ancestor rows while scrolling so nested contexts stay visible.
- **Grouping for huge payloads** – `arrayGroupSize` & `objectGroupSize` bucket massive collections (objects must be enumerated first—see note below). Groups are collapsed by default to ensure minimal impact on render performance.
- **TypeScript-native** – published `.d.ts` and React 19 JSX runtime support.
- **Zero dependencies** – lightweight and self-contained (besides React).
- **Styling hooks** – CSS variables + theme presets plus `className`/`style` escape hatches.
- **Generic tree APIs** – build custom tree views for non-object data structures (files, ASTs, etc.).
- **Copy to clipboard** – built-in action buttons to copy primitive values or JSON-serialized objects.
- **Change awareness** – optional flashing highlights updated values.
- **Interactive hover** – highlights the indentation guide for the current parent context.
- **Line numbers** – optional gutter with 0-based indices for debugging.
- **Search & Navigation** – streamed, debounced search with keyboard shortcuts, highlighting, and jump-to-match navigation.

---

## 📦 Install

```bash
npm install react-obj-view
# or
yarn add react-obj-view
```

---

## ⚡ Quickstart

```tsx
import { ObjectView } from "react-obj-view";
import "react-obj-view/dist/react-obj-view.css";

const user = {
  name: "Ada",
  stack: ["TypeScript", "React"],
  meta: new Map([["lastLogin", new Date()]]),
};

export function DebugPanel() {
  return (
    <ObjectView
      valueGetter={() => user}
      name="user"
      expandLevel={2}
    />
  );
}
```

Add the floating `SearchComponent` if you want Cmd/Ctrl+F to pop open a search bar with match navigation out of the box.

### Keep the getter stable

```tsx
const valueGetter = useCallback(() => user, [user]);
<ObjectView valueGetter={valueGetter} />;
```

Wrap dynamic data in `useMemo`/`useCallback` so the virtual tree only re-walks when the underlying value actually changes.

---

## ⚙️ Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `valueGetter` | `() => unknown` | **required** | Lazily supplies the data that should be rendered. |
| `name` | `string` | `undefined` | Optional root label shown before the first colon. |
| `expandLevel` | `number \| boolean` | `false` | Depth of initial expansion; `true` expands everything (up to depth 20). |
| `objectGroupSize` | `number` | `0` | Enable grouping for objects when they exceed this many keys. Groups are collapsed by default for performance. **Objects must be fully enumerated to detect size, so only enable this when you need grouped previews and can afford the enumeration cost.** |
| `arrayGroupSize` | `number` | `0` | Splits very large arrays into range buckets (`[0…999]`) for faster navigation. Groups are collapsed by default for performance. |
| `resolver` | `Map<any, ResolverFn>` | `undefined` | Merge in custom resolvers keyed by constructor. |
| `highlightUpdate` | `boolean` | `true` | Flash updated values via `useChangeFlashClasses`; set to `false` to disable. |
| `stickyPathHeaders` | `boolean` | `true` | Pins the current node's ancestor label while you scroll through its children; disable to revert to free-scrolling rows. |
| `preview` | `boolean` | `true` | Show inline previews (`Array(5)`, `'abc…'`) on collapsed rows. |
| `nonEnumerable` | `boolean` | `false` | Include non-enumerable properties during traversal. |
| `includeSymbols` | `boolean` | `false` | Include symbol keys when enumerating or previewing objects. |
| `showLineNumbers` | `boolean` | `false` | Display a gutter with zero-based line numbers. |
| `lineHeight` | `number` | `14` | Row height (in px) used by the virtual scroller. **Keep this in sync with your CSS/fonts; mismatches cause rows to drift/overlap because virtualization still uses the old size.** |
| `style` | `React.CSSProperties` | `undefined` | Inline styles applied to `.big-objview-root` (theme presets are plain objects). |
| `className` | `string` | `undefined` | Extra class hooked onto `.big-objview-root`. |
| `ref` | `RefObject<ObjectViewHandle>` | `undefined` | Exposes `search(filterFn?, markTerm?, onResult?, options)` (options: `iterateSize`, `maxDepth`, `fullSearch`, `maxResult` default `99999`) and `scrollToPaths(paths, scrollOpts, offsetTop?, offsetBottom?)` for jump-to-match navigation. Call `search()` with no arguments to clear highlights/results. `scrollToPaths` forwards `ScrollToOptions` and lets you add viewport padding to keep sticky headers or toolbars from covering the target (defaults: `offsetTop=200`, `offsetBottom=100`). Keep the ref stable and memoize search options. |
| `customActions` | `CustomAction[]` | `DefaultActions` | Array of custom action definitions. [See example](./API_DOCUMENTATION.md#custom-actions). |
| `actionRenders` | `React.FC<ObjectViewRenderRowProps>` | `undefined` | **Deprecated**. Use `customActions` instead. |
| `iterateSize` | `number` | `100000` | Controls the number of steps the async walker performs before yielding to the main thread. Lower values improve responsiveness but may increase total render time. |


👉 Need more detail? Check the [API Documentation](./API_DOCUMENTATION.md).

---

## 🎨 Styling & Themes

The package exports several ready-made palettes:

```tsx
import { ObjectView } from "react-obj-view";
import { themeMonokai } from "react-obj-view";

<ObjectView valueGetter={getter} style={themeMonokai} />;
```

Prefer CSS? Override the variables directly:

```css
.big-objview-root {
  --bigobjview-color: #e5e9f0;
  --bigobjview-bg-color: #1e1e1e;
  --bigobjview-type-string-color: #c3e88d;
  --bigobjview-type-number-color: #f78c6c;
}
```

```tsx
<ObjectView valueGetter={getter} className="object-view" />
```

Note: The built-in `themeDefault` adapts automatically to light and dark modes using CSS `light-dark()` and the user's `prefers-color-scheme`. Other presets (e.g., One Dark, Dracula, Monokai) are static and do not change automatically. The demo’s light/dark/auto toggle affects the page chrome only — `ObjectView` does not auto-switch its theme; choose a preset explicitly if you want a specific look. Additional light presets (`themeGitHubLight`, `themeSolarizedLight`, `themeQuietLight`) plus `themeGeneral` ship from the root entry alongside the dark palettes.

Want full control? Build your own palette with the exported helpers:

```ts
import {
  createTheme,
  extendTheme,
  themeDefault,
} from "react-obj-view";

// Build from scratch (every CSS variable from the table below is required)
const midnight = createTheme({
  "--bigobjview-color": "#e8eaed",
  "--bigobjview-bg-color": "#0b1116",
  "--bigobjview-change-color": "#ff8a65",
  "--bigobjview-fontsize": "12px",
  "--bigobjview-type-boolean-color": "#18ffff",
  "--bigobjview-type-number-color": "#ffab40",
  "--bigobjview-type-bigint-color": "#ff6d00",
  "--bigobjview-type-string-color": "#ffee58",
  "--bigobjview-type-object-array-color": "#40c4ff",
  "--bigobjview-type-object-object-color": "#7e57c2",
  "--bigobjview-type-object-promise-color": "#ec407a",
  "--bigobjview-type-object-map-color": "#00e5ff",
  "--bigobjview-type-object-set-color": "#26c6da",
  "--bigobjview-type-function-color": "#80cbc4",
  "--bigobjview-type-object-regexp-color": "#ef5350",
  "--bigobjview-type-object-date-color": "#8bc34a",
  "--bigobjview-type-object-error-color": "#ff7043",
  "--bigobjview-action-btn": "#444",
  "--bigobjview-action-success": "#00e676",
  "--bigobjview-action-error": "#ff5252",
});

// …or extend an existing preset
const midnightCondensed = extendTheme(midnight, {
  "--bigobjview-fontsize": "11px",
  lineHeight: 12,
});
```

Refer to the “Styling reference” table in the docs whenever you need the full list of supported CSS variables.

> **Line-height tip:** If your theme tweaks fonts or padding, expose a shared CSS variable (e.g. `--rov-row-height`) and set both `.row { height: var(--rov-row-height) }` and the `lineHeight` prop from the same value so scrolling math stays correct.

---

## 🧩 Advanced Usage

### Custom resolvers

```tsx
class ApiEndpoint {
  constructor(
    public method: string,
    public url: string,
    public status: number,
    public responseTime: number,
  ) {}
}

const resolver = new Map([
  [
    ApiEndpoint,
    (endpoint, cb, next, isPreview) => {
      if (isPreview) {
        cb('summary', `${endpoint.method} ${endpoint.url}`, true);
        cb('status', endpoint.status, true);
        return;
      }

      cb('responseTime', `${endpoint.responseTime}ms`, true);
      next(endpoint);
    },
  ],
]);

<ObjectView valueGetter={() => data} resolver={resolver} />;
```

### Grouping massive datasets

```tsx
<ObjectView
  valueGetter={() => largeObject}
  objectGroupSize={250}
  arrayGroupSize={500}
/>
```

- Arrays get chunked up immediately because their length is known.
- Objects must be enumerated to count keys. Use grouping when the trade-off (initial enumeration vs. quicker navigation) makes sense for the payload.

### Interactive features

#### Copy to Clipboard

Each row includes built-in action buttons:

```tsx
// Primitives get a "Copy" button
const config = { apiKey: "sk-abc123", timeout: 5000 };
<ObjectView valueGetter={() => config} />
// Hover over any row to see Copy / Copy JSON buttons

// Copy actions show success/error feedback
// Automatically resets after 5 seconds
```

- **Copy** button for strings, numbers, bigints – copies the raw value
- **Copy JSON** button for objects, arrays, dates – serializes via `JSON.stringify()`

#### Custom Actions

You can add your own action buttons to rows:

```tsx
const myActions = [
  {
    name: "log",
    prepareAction: (nodeData) => ({ key: nodeData.key }),
    performAction: ({ key }) => console.log("Clicked:", key),
    actionRender: "Log Key",
    actionRunRender: "Logging...",
  }
];

<ObjectView valueGetter={() => data} customActions={myActions} />
```

#### Hover Interactions

The viewer highlights the indentation guide for the current parent context on hover, making it easier to trace parent-child relationships:

```tsx
<ObjectView valueGetter={() => deeplyNested} expandLevel={3} />
// Hover over any row to see visual feedback
// CSS custom properties (--active-index, --active-parent) enable theme customization
```

No configuration needed—the feature is built-in and adapts to your theme.

#### Line Numbers

Enable a gutter with 0-based line numbers for easier debugging:

```tsx
<ObjectView
  valueGetter={() => largeData}
  showLineNumbers={true}
  lineHeight={18}
/>
```

### Search & Navigation

`ObjectView` exposes a streaming search handle via `ref`. The built-in floating `SearchComponent` wires it up and renders a loading indicator while results stream in:

```tsx
import { ObjectViewHandle, SearchComponent } from "react-obj-view";

const objViewRef = useRef<ObjectViewHandle | null>(null);
const [searchActive, setSearchActive] = useState(false);

<ObjectView valueGetter={() => data} ref={objViewRef} />

<SearchComponent
  active={searchActive}
  onClose={() => setSearchActive(false)}
  // SearchComponent builds the filter fn + highlight regex for you
  handleSearch={(filterFn, markTerm, onResult, opts) =>
    objViewRef.current?.search(filterFn, markTerm, onResult, {
      ...opts,
      maxResult: 5000,
    })
  }
  scrollToPaths={(paths, scrollOpts) =>
    objViewRef.current?.scrollToPaths(paths, scrollOpts, 200, 120)
  }
  // Optional: normalize diacritics or tweak search iteration depth
  options={{
    normalizeSymbol: (c) => c.normalize("NFD").replace(/\p{M}/gu, ""),
    maxDepth: 8,
  }}
/>;
```

- Keyboard shortcuts: press **Enter** to jump to the next match (Shift+Enter for previous), and **Escape** to clear/close.
- Programmatic clear: call `objViewRef.current?.search()` with no args to reset highlights and jump markers.
- Results stream via `requestIdleCallback` and update highlights with the `markTerm` regex. Stop typing to debounce; `maxResult`, `maxDepth`, `fullSearch`, and `iterateSize` control scope and responsiveness.

Search options supported by `ObjectViewHandle.search` and the built-in `SearchComponent`:
- `iterateSize`: override traversal batch size when searching.
- `maxDepth`: cap how deep the walker searches.
- `fullSearch`: force traversal of already-collapsed branches.
- `maxResult`: limit streamed matches (default `99999`).
- `normalizeSymbol`: SearchComponent-only hook to normalize characters (e.g., strip diacritics) before matching.

`scrollToPaths` accepts `ScrollToOptions` plus optional `offsetTop` / `offsetBottom` to keep the match visible beneath sticky UI.

### Building custom tree views

The library now exports generic tree APIs for non-object data:

```tsx
import { walkingFactory, type WalkingAdapter } from 'react-obj-view';

// Define your domain (e.g., file system, AST, org chart)
type FileNode = {
  name: string;
  type: 'folder' | 'file';
  children?: FileNode[];
};

// Implement the adapter
const fileAdapter: WalkingAdapter<...> = {
  valueHasChild: (node) => node.type === 'folder' && !!node.children?.length,
  iterateChilds: (node, ctx, ref, cb) => {
    node.children?.forEach(child => cb(child, child.name, { ... }));
  },
  // ... other methods
};

const fileTreeFactory = () => walkingFactory(fileAdapter);
```

See [Generic Tree Stack](./docs/GENERIC_TREE_VIEW.md) for a complete walkthrough with React integration.

### Virtual scrolling reminders

- Always pass the correct `lineHeight` (or follow the CSS-variable approach) when changing typography.
- The component sets its container height to `lineHeight * size`. If you clamp the container via CSS, ensure the scroll parent can actually scroll; otherwise virtualization can’t measure the viewport.

---

## 🧪 Testing & Tooling

The repository ships a large Vitest suite (utilities, walkers, resolvers, components, integration scenarios).

```bash
npm test           # run everything once
npm run test:watch # watch mode
npm run test:ui    # launch Vitest UI
npm run test:coverage
```

See [TESTING.md](./TESTING.md) for coverage numbers, structure, and tips.

---

## 🚀 Use Cases

- **Debug panels** – Inspect Redux/Context refs without spamming console logs.
- **API/LLM explorers** – Visualize nested JSON or streaming responses with circular references.
- **State machines & devtools** – Pair with hot reloaders or feature flags to watch state change in real time.
- **Data-heavy dashboards** – Embed next to chart/table widgets so analysts can drill into raw payloads.

---

## 📊 Performance Snapshot

| Library | Scenario | Mean time* | Command |
|---------|----------|------------|---------|
| **react-obj-view** | Flatten ~100k-node payload (see `bench/perf.bench.ts`) | **23.7 ms** (42.3 ops/s) | `npx vitest bench bench/perf.bench.ts` |
| **react-obj-view** | Flatten ~1M-node payload | **253 ms** (4.0 ops/s) | `npx vitest bench bench/perf.bench.ts` |
| **react-obj-view** | Flatten ~2M-node payload | **525 ms** (1.9 ops/s) | `npx vitest bench bench/perf.bench.ts` |

\*Measured on macOS (Apple M3 Max, Node 22.11, Vitest 4.0.8). Each sample instantiates a fresh `walkingToIndexFactory`, generates 10k/100k/200k user records (~100k/~1M/~2M nodes total), and walks the tree. Adjust `bench/perf.bench.ts` to mirror your datasets if you need environment-specific numbers.

> Third-party libraries aren’t benchmarked here; run their official examples under the same conditions for apples-to-apples comparisons.

---

## 📚 Resources

- [Usage Guide](./USAGE_GUIDE.md) – end-to-end patterns, resolver recipes, styling guidance.
- [API Documentation](./API_DOCUMENTATION.md) – deeper dive into props, hooks, and resolver authoring.
- [Generic Tree Stack](./docs/GENERIC_TREE_VIEW.md) – explains `tree-core`, `react-tree-view`, and the virtual-scroller for building custom viewers.
- [Object Tree Adapter & React Viewer](./docs/OBJECT_TREE_VIEW.md) – details how the built-in `ObjectView` composes the generic stack with resolvers.
- [Live demo](https://vothanhdat.github.io/react-obj-view/) – try grouping, previews, and change flashes in the browser.

---

## 🧰 Local Development

```bash
git clone https://github.com/vothanhdat/react-obj-view
cd react-obj-view
yarn install
yarn dev
```

---

## 📜 License

MIT © [Vo Thanh Dat](https://github.com/vothanhdat)

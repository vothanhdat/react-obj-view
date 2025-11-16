# react-obj-view

> High-performance React component for inspecting deeply nested objects with virtualization, grouping, and deterministic value getters.

[![npm](https://img.shields.io/npm/v/react-obj-view.svg)](https://www.npmjs.com/package/react-obj-view)
[![bundle size](https://img.shields.io/bundlephobia/minzip/react-obj-view)](https://bundlephobia.com/package/react-obj-view)

React Object View targets React 19 projects (Node 22+ / Yarn 4 recommended) and ships a TypeScript-first API with ESM + UMD bundles.

---

## 🔄 Branch status

This `work` branch diverges from commit `fabf432` on master and introduces a modular tree-walking/runtime stack. See [`docs/BRANCH_UPDATES.md`](./docs/BRANCH_UPDATES.md) for a curated summary of every change that landed after the fork (adapters, virtualization, theming, benchmarks, etc.). 【F:docs/BRANCH_UPDATES.md†L1-L34】

---

## ✨ Features

- **Virtualized tree view** – only visible rows render, so 100k+ nodes stay smooth.
- **Sticky path headers** – pin ancestor rows while scrolling so nested contexts stay visible.
- **Resolver system** – promises, maps, sets, errors, dates, regexes, iterables, grouped proxies, and custom classes.
- **Lazy `valueGetter`** – keeps data fresh without forcing heavy re-renders.
- **Grouping for huge payloads** – `arrayGroupSize` & `objectGroupSize` bucket massive collections (objects must be enumerated first—see note below).
- **Change awareness** – optional flashing highlights updated values.
- **Styling hooks** – CSS variables + theme presets plus `className`/`style` escape hatches.
- **TypeScript-native** – published `.d.ts` and React 19 JSX runtime support.

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
| `objectGroupSize` | `number` | `0` | Enable grouping for objects when they exceed this many keys. **Objects must be fully enumerated to detect size, so only enable this when you need grouped previews and can afford the enumeration cost.** |
| `arrayGroupSize` | `number` | `0` | Splits very large arrays into range buckets (`[0…999]`) for faster navigation. |
| `resolver` | `Map<any, ResolverFn>` | `undefined` | Merge in custom resolvers keyed by constructor. |
| `highlightUpdate` | `boolean` | `false` | Flash updated values via `useChangeFlashClasses`. |
| `stickyPathHeaders` | `boolean` | `true` | Pins the current node's ancestor label while you scroll through its children; disable to revert to free-scrolling rows. |
| `preview` | `boolean` | `true` | Show inline previews (`Array(5)`, `'abc…'`) on collapsed rows. |
| `nonEnumerable` | `boolean` | `false` | Include non-enumerable properties during traversal. |
| `includeSymbols` | `boolean` | `false` | Include symbol keys when enumerating or previewing objects. |
| `showLineNumbers` | `boolean` | `false` | Display a gutter with zero-based line numbers. |
| `lineHeight` | `number` | `14` | Row height (in px) used by the virtual scroller. **Keep this in sync with your CSS/fonts; mismatches cause rows to drift/overlap because virtualization still uses the old size.** |
| `style` | `React.CSSProperties` | `undefined` | Inline styles applied to `.big-objview-root` (theme presets are plain objects). |
| `className` | `string` | `undefined` | Extra class hooked onto `.big-objview-root`. |

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

# React Object View

React Object View is a TypeScript-first component for exploring deeply nested JavaScript data structures. It combines a familiar inspector UI with virtual scrolling so large payloads stay responsive.

## 🌟 Feature Highlights

- **Virtualized tree view** – Only the visible rows are rendered, so even 100k+ entries stay smooth.
- **Resolver-driven rendering** – Built-in handlers cover promises, maps, sets, errors, dates, regexes, iterables, and circular references.
- **Preview summaries** – Collapsed nodes include inline previews for quick scanning.
- **Change awareness** – Optional flashing makes updates stand out during debugging.
- **Styling hooks** – Override CSS variables or add class names to match your design system.

## 🚀 Quickstart

### 1. Install

```bash
npm install react-obj-view
# or
yarn add react-obj-view
```

### 2. Render your data

```tsx
import { ObjectView } from "react-obj-view";
import "react-obj-view/dist/react-obj-view.css";

const user = {
  name: "Ada",
  stack: ["TypeScript", "React"],
  meta: new Map([["lastLogin", new Date()]])
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

### 3. Keep getters stable

Wrap the getter in `useMemo`/`useCallback` when the underlying value changes so React Object View only re-renders when necessary.

## ⚙️ Options & Configuration

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `valueGetter` | `() => unknown` | **required** | Supplies the data lazily; keeps values current and memoizable. |
| `name` | `string` | `undefined` | Optional label for the root node. |
| `expandLevel` | `number \| boolean` | `false` | Controls initial expansion depth; `true` expands everything. |
| `objectGroupSize` | `number` | `0` | Groups large objects into virtual buckets once they exceed this many keys. |
| `arrayGroupSize` | `number` | `0` | Virtualizes arrays by chunking when they exceed this length. |
| `resolver` | `Map<any, ResolverFn>` | `undefined` | Override or extend renderers for custom classes. |
| `highlightUpdate` | `boolean` | `false` | Enables flash-highlighting when values change between renders. |
| `preview` | `boolean` | `true` | Toggles inline value previews on collapsed rows. |
| `nonEnumerable` | `boolean` | `false` | Includes non-enumerable properties during traversal. |
| `includeSymbols` | `boolean` | `false` | Includes symbol-keyed properties while enumerating objects and previews. |
| `showLineNumbers` | `boolean` | `false` | Displays a gutter with zero-based line numbers. |
| `lineHeight` | `number` | `14` | Row height in pixels, used by the virtual scroller. |
| `style` | `React.CSSProperties` | `undefined` | Inline styles applied to the `.big-objview-root` container. |

## 🎨 Theme Presets

React Object View exposes curated palettes that map directly to the component's CSS variables. Import a preset and pass it to the `style` prop to change colours without touching global styles:

```tsx
import { useMemo } from "react";
import { ObjectView } from "react-obj-view";
import { themeMonokai } from "react-obj-view/themes";

const getter = useMemo(() => () => data, [data]);

<ObjectView valueGetter={getter} style={themeMonokai} />;
```

You can also merge presets with your own overrides when you need layout tweaks:

```tsx
<ObjectView
  valueGetter={getter}
  style={{
    ...themeMonokai,
    height: 480,
  }}
/>
```

Each preset exports the same tokens as `themeDefault`, so mixing and matching is as simple as spreading the colours you need.

> `getter` refers to the memoised `valueGetter` used elsewhere in your component.

## 🤔 Why `valueGetter`?

- **Always fresh data** – The getter runs during render, so derived values, proxies, or lazy loaders stay accurate.
- **Explicit memoization** – You control when the getter identity changes, which keeps the virtual tree in sync without redundant work.

## 📊 Comparison with other object inspectors

| Library | Bundle size* | Render performance | Virtualization | Data type coverage | Customization |
| --- | --- | --- | --- | --- | --- |
| **React Object View** | ES module: 33.14 kB (10.20 kB gzip) | Virtualized list keeps frame times stable on very large collections. | ✅ Built-in virtual scroller (no external dependency). | Promises, iterables, maps, sets, errors, dates, regexes, circular refs. | CSS variables, class hooks, resolver overrides. |
| `react-json-view` | Medium (ships pre-styled UI) | Re-renders the whole tree; can stutter on very large payloads. | ❌ Renders everything. | JSON-compatible structures only. | Inline style overrides and a handful of callbacks. |
| `@devtools-ds/object-tree` | Lean core (single-digit kB gz) | Fast for small trees; relies on manual windowing for huge data. | ⚠️ None by default. | Focused on plain objects, arrays, symbols. | Theme tokens; limited renderer extension. |

\*Bundle size numbers refer to minified + gzip builds. React Object View figures are taken from the default Vite build output in this repository; third-party numbers reference published package metadata and may vary per version.

## 📚 Additional resources

- [Usage Guide](./USAGE_GUIDE.md) – End-to-end patterns, resolver recipes, and styling guidance.
- [API Documentation](./API_DOCUMENTATION.md) – Deep dive into hooks and resolver authoring.
- [Live demo](https://vothanhdat.github.io/react-obj-view/) – Interactively explore grouping, previews, and change flash states.

# React Object View

A powerful and flexible React component for visualizing JavaScript objects and data structures with an interactive, virtualized tree view. Perfect for debugging, data inspection, and building developer tools.

## 🌟 Live Demo

**[Try the Interactive Demo →](https://vothanhdat.github.io/react-obj-view/)**

Experience resolver overrides, keyword styling, grouping, previews, and change highlighting in action.

> **Note**: If the demo link shows "404", please wait a few minutes for GitHub Pages to deploy or confirm that GitHub Pages is enabled in the repository settings.

## ✨ Features

- 🌳 **Interactive Tree View**: Expand and collapse object properties with intuitive click interactions.
- ⚡ **Virtualized Rendering**: Powered by [`react-virtuoso`](https://virtuoso.dev/) to render only the visible rows—perfect for massive objects and arrays.
- 📦 **Configurable Grouping**: Opt-in resolvers group large arrays and objects into logical ranges.
- 🔄 **Circular Reference Safe**: Detects and labels circular references without infinite loops.
- 🎯 **Smart Type Rendering**: Specialized formatting for promises, maps, sets, errors, functions, dates, regexes, and more.
- 🎨 **Customizable Styling**: Override CSS variables or class selectors to match your UI.
- 🧩 **Resolver Overrides**: Extend or replace rendering for class instances with composable resolver functions.
- 💡 **Keyword Highlighting**: Dedicated styling for boolean, null, undefined, and other keyword-like values.
- 🔍 **Change Detection**: Optional flash-highlighting when values change between renders.
- 🛠️ **TypeScript Ready**: Strong typings for props, resolvers, and utility hooks.

## 🚀 Quick Start

### Installation

```bash
npm install react-obj-view
# or
yarn add react-obj-view
```

### Basic Usage

```tsx
import React, { useMemo } from 'react';
import { ObjectView } from 'react-obj-view';
import 'react-obj-view/dist/react-obj-view.css';

const data = {
  user: {
    name: 'John Doe',
    age: 30,
    preferences: {
      theme: 'dark',
      notifications: true,
    },
  },
  items: ['apple', 'banana', 'cherry'],
  metadata: {
    created: new Date(),
    tags: new Set(['react', 'typescript']),
  },
};

export const App = () => {
  const valueGetter = useMemo(() => () => data, []);

  return (
    <ObjectView
      valueGetter={valueGetter}
      name="appData"
      expandLevel={2}
    />
  );
};
```

> For mutable values (for example, component state), include the value in the dependency list: `const getter = useMemo(() => () => state, [state]);`.

## ♻️ Understanding `valueGetter`

React Object View evaluates your data through a function prop instead of reading it directly. This provides two benefits:

1. **Always Current Values** – The getter runs during rendering so nested proxies, lazy wrappers, or derived data stay up to date.
2. **Stable Identity** – You control when the getter identity changes, enabling efficient memoization. Wrap the getter in `useMemo`/`useCallback` to change it only when the underlying value changes.

### Immutability Matters

- Pass new object/array references whenever data changes so the viewer can recompute the tree.
- Avoid mutating nested data in place (e.g. `state.user.name = 'Alice'`). Instead, create a new object and update the getter dependencies.
- During development the viewer detects mutations and refreshes the affected subtree; production builds skip this check for performance.

## 📖 Examples

### Controlling Expansion

```tsx
<ObjectView valueGetter={() => data} expandLevel={true} />   // Expand everything
<ObjectView valueGetter={() => data} expandLevel={3} />      // Expand the first 3 levels
<ObjectView valueGetter={() => data} expandLevel={false} />  // Start collapsed
```

### Handling Different Data Types

```tsx
const complexData = {
  name: 'React Object View',
  version: 1.0,
  isActive: true,
  users: ['alice', 'bob', 'charlie'],
  userMap: new Map([
    ['alice', { role: 'admin' }],
    ['bob', { role: 'user' }],
  ]),
  tags: new Set(['react', 'typescript', 'visualization']),
  createdAt: new Date(),
  pattern: /[a-z]+/gi,
  callback: (x: number) => x * 2,
  asyncData: Promise.resolve('Loaded successfully'),
  config: {
    api: {
      baseUrl: 'https://api.example.com',
      timeout: 5000,
      retries: 3,
    },
    features: {
      darkMode: true,
      notifications: false,
    },
  },
};

<ObjectView
  valueGetter={() => complexData}
  name="appConfig"
  expandLevel={2}
  objectGroupSize={50}
  arrayGroupSize={20}
/>;
```

### Real-World Use Cases

#### API Response Debugging

```tsx
const apiResponse = {
  status: 200,
  data: {
    users: [
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' },
    ],
    pagination: {
      page: 1,
      totalPages: 5,
      totalItems: 87,
    },
  },
  headers: {
    'content-type': 'application/json',
    'x-request-id': 'abc-123',
  },
};

<ObjectView
  valueGetter={() => apiResponse}
  name="API Response"
  expandLevel={2}
/>;
```

#### State Management Debugging

```tsx
const [appState, setAppState] = useState({
  user: { name: 'John', preferences: { theme: 'dark', notifications: true } },
  ui: { theme: 'dark', sidebarOpen: true },
  data: { items: [], loading: false },
});

const stateGetter = useMemo(() => () => appState, [appState]);

<ObjectView
  valueGetter={stateGetter}
  name="Application State"
  expandLevel={1}
/>;
```

## 🎛️ API Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `valueGetter` | `() => any` | **required** | Function that returns the data to visualise. Memoise the function so it only changes when the value changes. |
| `name` | `string` | `undefined` | Label displayed for the root object. |
| `expandLevel` | `number \| boolean` | `false` | Initial expansion depth: `true` expands everything, `false` collapses everything, numbers expand that many levels. |
| `objectGroupSize` | `number` | `undefined` | Group objects with at least this many enumerable keys. Set to `undefined`/`1` to disable. |
| `arrayGroupSize` | `number` | `undefined` | Group arrays into virtual buckets once they exceed this size. |
| `resolver` | `Map<any, ResolverFn>` | `undefined` | Extend or replace rendering for specific constructors. |
| `highlightUpdate` | `boolean` | `false` | Enable flash-highlighting when values change. |
| `preview` | `boolean` | `true` | Show inline previews for collapsed nodes. |
| `nonEnumerable` | `boolean` | `false` | Include non-enumerable properties in traversal. |

### Supported Data Types

- ✅ **Primitives**: string, number, boolean, null, undefined, symbol, bigint
- ✅ **Objects**: Plain objects, class instances, nested structures
- ✅ **Collections**: Arrays, Maps, Sets, custom iterables
- ✅ **Functions**: Async, generator, arrow, and regular functions
- ✅ **Built-ins**: Date, RegExp, Error, Promise (with live status)
- ✅ **Special Cases**: Lazy values, grouped ranges, circular references

## 🎨 Styling

The component ships with the `.big-objview-root` namespace. Override these classes or CSS variables to match your theme:

```css
.big-objview-root {
  font-family: 'Menlo', 'Monaco', monospace;
  font-size: 12px;
  background: var(--bigobjview-bg-color);
  color: var(--bigobjview-color);
}

.big-objview-root .node-container {
  white-space: nowrap;
  text-overflow: ellipsis;
}

.big-objview-root .value.type-boolean { color: #08f; }
.big-objview-root .value.type-number { color: #d12; }
.big-objview-root .value.type-string { color: #e67e22; }
.big-objview-root .value.value-preview { opacity: 0.7; }
.big-objview-root .name.updated { background: rgb(255, 50, 0); }
```

By default the viewer renders inside a 400px-tall container. Override the height via CSS:

```css
.big-objview-root {
  height: 100%;
}
```

Wrap the component in your own container to control layout, scrolling, and height.

## 🔧 Advanced Features

### Change Detection

```tsx
const [counter, setCounter] = useState({ count: 0, lastUpdated: Date.now() });
const counterGetter = useMemo(() => () => counter, [counter]);

return (
  <>
    <button onClick={() => setCounter(prev => ({ count: prev.count + 1, lastUpdated: Date.now() }))}>
      Increment
    </button>
    <ObjectView valueGetter={counterGetter} highlightUpdate expandLevel={true} />
  </>
);
```

### Working with Large Data Sets

```tsx
const largeDataset = {
  users: Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    name: `User ${i}`,
    email: `user${i}@example.com`,
  })),
  metadata: {
    total: 1000,
    generated: new Date(),
  },
};

<ObjectView
  valueGetter={() => largeDataset}
  arrayGroupSize={50}
  objectGroupSize={100}
  expandLevel={1}
/>;
```

### Resolver Overrides

```tsx
class User {
  constructor(public name: string, public email: string, public role: string = 'user') {}
}

const resolver = new Map([
  [User, (user, cb, next, isPreview) => {
    if (isPreview) {
      cb('summary', `${user.name} • ${user.email}`, true);
      return;
    }

    cb('badge', `⭐ ${user.role.toUpperCase()}`, true);
    next(user);
  }],
]);

const valueGetter = useMemo(() => () => ({ owner: new User('Ada', 'ada@example.com', 'admin') }), []);

<ObjectView valueGetter={valueGetter} resolver={resolver} />;
```

Resolvers receive four parameters:

```ts
export type ResolverFn<T = any> = (
  value: T,
  cb: (key: PropertyKey, value: unknown, enumerable: boolean) => boolean | void,
  next: (value: unknown, cb?: ResolverFnCb) => void,
  isPreview: boolean,
) => void;
```

Call `cb` to push entries (return `true` to stop early) and `next` to continue with the default traversal.

## ✅ Testing & Tooling

- The project is built with Vite and TypeScript.
- Virtualisation relies on [`react-virtuoso`](https://virtuoso.dev/).
- Demo tooling lives under `src/Test.tsx` and `vite.config.demo.ts`.

## 📄 License

MIT © [Dat Vo](https://github.com/vothanhdat)

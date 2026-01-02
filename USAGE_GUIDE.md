# Usage Guide

Practical recipes and best practices for React Object View.

## Getting Started

### Installation & Setup

```bash
npm install react-obj-view
```

```tsx
import React, { useMemo } from 'react';
import { ObjectView } from 'react-obj-view';
import 'react-obj-view/dist/react-obj-view.css';
```

### Create a Stable Getter

Wrap your value in a getter function so React Object View can re-evaluate the latest data without forcing unnecessary traversals.

```tsx
const [state, setState] = useState({ count: 0 });
const stateGetter = useMemo(() => () => state, [state]);

<ObjectView valueGetter={stateGetter} />;
```

> Inline lambdas (`valueGetter={() => data}`) work for constant values. For reactive state, memoise the getter so its identity changes only when the underlying value does.

### Immutability & Updates

React Object View relies on React's standard change detection. This means it **cannot detect in-place mutations** of objects or arrays.

- **Reference Equality**: The component only re-renders and re-walks the data tree when the identity (reference) of the value returned by `valueGetter` changes.
- **Best Practice**: Always produce new object/array references when data changes (e.g., using the spread operator `...`).

```tsx
// ❌ Won't trigger a re-render
data.nested.value = 'new value';

// ✅ Will trigger a re-render
setData({
  ...data,
  nested: { ...data.nested, value: 'new value' }
});
```

> **Note**: While development builds might occasionally refresh subtrees during interactions, you should never rely on this for production data updates. Always treat your data as immutable.

## Common Use Cases

### 1. API Response Debugging

```tsx
const ApiDebugger = () => {
  const [apiData, setApiData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setApiData({
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        data,
        timestamp: new Date(),
      });
    } catch (error) {
      setApiData({ error: (error as Error).message, timestamp: new Date() });
    }
    setLoading(false);
  };

  const apiGetter = useMemo(() => () => apiData, [apiData]);

  return (
    <div>
      <button onClick={fetchData} disabled={loading}>
        {loading ? 'Loading…' : 'Fetch API Data'}
      </button>

      {apiData && (
        <ObjectView
          valueGetter={apiGetter}
          name="API Response"
          expandLevel={2}
          highlightUpdate
        />
      )}
    </div>
  );
};
```

### 2. State Management Visualiser

```tsx
const initialState = {
  user: { name: '', email: '', isLoggedIn: false },
  ui: { theme: 'light', sidebarOpen: false },
  data: { items: [], loading: false, error: null },
};

function reducer(state: typeof initialState, action: any) {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        user: { ...action.payload, isLoggedIn: true },
      };
    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        ui: { ...state.ui, sidebarOpen: !state.ui.sidebarOpen },
      };
    case 'SET_LOADING':
      return {
        ...state,
        data: { ...state.data, loading: action.payload },
      };
    default:
      return state;
  }
}

const StateViewer = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const getter = useMemo(() => () => state, [state]);

  return (
    <div style={{ display: 'flex', gap: '2rem' }}>
      <div>
        <button onClick={() => dispatch({
          type: 'LOGIN',
          payload: { name: 'John Doe', email: 'john@example.com' },
        })}>
          Login
        </button>
        <button onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}>
          Toggle Sidebar
        </button>
        <button onClick={() => dispatch({ type: 'SET_LOADING', payload: true })}>
          Set Loading
        </button>
      </div>

      <div style={{ flex: 1 }}>
        <ObjectView valueGetter={getter} name="appState" expandLevel={2} />
      </div>
    </div>
  );
};
```

### 3. Configuration Inspector

```tsx
const ConfigInspector = () => {
  const appConfig = {
    api: {
      baseUrl: 'https://api.example.com',
      timeout: 5000,
      retries: 3,
    },
    features: {
      darkMode: true,
      notifications: false,
    },
  };

  return (
    <ObjectView
      valueGetter={() => appConfig}
      name="config"
      expandLevel={true}
      arrayGroupSize={20}
      objectGroupSize={50}
    />
  );
};
```

> **Object grouping trade-off:** Unlike arrays, objects don’t expose their size up front. To decide whether `objectGroupSize` should apply, React Object View must enumerate every key first. Leave this at `0` unless you truly need grouped previews for massive objects and you’re okay with the extra enumeration work.

### 4. Working with Binary Data

React Object View has built-in support for `ArrayBuffer`, `DataView`, and Typed Arrays (`Uint8Array`, `Float32Array`, etc.). These are rendered with a specialized view that shows memory offsets and values, similar to a hex editor.

```tsx
const binaryData = {
  fileHeader: new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0]),
  rawData: new ArrayBuffer(1024),
  view: new DataView(new ArrayBuffer(16)),
  coordinates: new Float32Array([1.0, 0.5, -1.0])
};

<ObjectView valueGetter={() => binaryData} />
```

## Feature Highlights

### Change Detection

Enable flash-highlighting to track mutations:

```tsx
const [counter, setCounter] = useState({ count: 0, updatedAt: Date.now() });
const counterGetter = useMemo(() => () => counter, [counter]);

return (
  <>
    <button onClick={() => setCounter(prev => ({ count: prev.count + 1, updatedAt: Date.now() }))}>
      Increment
    </button>
    <ObjectView valueGetter={counterGetter} highlightUpdate expandLevel={true} />
  </>
);
```

### Sticky Path Headers

Deeply nested trees can feel disorienting because the parent context scrolls away. Leave `stickyPathHeaders` enabled (default) to pin the current ancestor row while you browse its children, or flip it off when you prefer pure free-flow scrolling:

```tsx
<ObjectView
  valueGetter={counterGetter}
  expandLevel={2}
  stickyPathHeaders={false} // opt out of the pinning behaviour
/>
```

Use this prop when embedding the viewer inside panels with their own sticky headers so you can decide which element controls the vertical stacking order.

### Line Numbers & Layout Tweaks

Control how each row is rendered and surfaced:

```tsx
const viewerGetter = useMemo(() => () => state, [state]);

return (
  <ObjectView
    valueGetter={viewerGetter}
    showLineNumbers
    lineHeight={18}
    className="state-viewer"
    style={{ height: 480 }}
  />
);
```

- `showLineNumbers` toggles a gutter so you can reference nodes quickly.
- `lineHeight` must match the actual row height for smooth virtual scrolling (bump it when you increase font sizes).
- `className` and `style` target the root `.big-objview-root`, making it easy to scope custom theming without extra wrappers.

> **Tip:** If your design system overrides fonts/padding via CSS, expose a shared variable (e.g. `--rov-row-height`) and drive both the CSS row height and the `lineHeight` prop from that value. When those drift apart the virtual canvas height stays wrong, which causes rows to overlap or leave gaps while scrolling.

### Virtualization Buffer (`overscan`)

For very large trees, fast scrolling can briefly expose blank space if rendering can't keep up. Use `overscan` to render an extra buffer **in pixels** above and below the viewport.

```tsx
<ObjectView
  valueGetter={getter}
  lineHeight={18}
  overscan={200}
/>
```

- Increase `overscan` to reduce blank gaps during fast scroll.
- Decrease `overscan` to reduce render work if rows are expensive.

### Resolver Overrides

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
  [ApiEndpoint, (endpoint: ApiEndpoint, cb, next, isPreview) => {
    if (isPreview) {
      cb('request', `${endpoint.method} ${endpoint.url}`, true);
      cb('status', endpoint.status, true);
      return;
    }

    cb('responseTimeLabel', `${endpoint.responseTime}ms`, true);
    next(endpoint);
  }],
]);

const getter = useMemo(
  () => () => ({ latest: new ApiEndpoint('GET', '/users', 200, 142) }),
  [],
);

<ObjectView valueGetter={getter} resolver={resolver} />;
```

### Grouping Large Collections

```tsx
const largeArray = Array.from({ length: 5000 }, (_, index) => ({ id: index }));

<ObjectView
  valueGetter={() => ({ items: largeArray })}
  arrayGroupSize={100}
  expandLevel={1}
/>;
```

Grouping resolvers emit [`GroupedProxy`](src/utils/groupedProxy.ts) ranges that open lazily when clicked.

### Handling Non-Enumerable Properties

Inspect getters and prototype chains by enabling `nonEnumerable`, and opt-in to symbol keys via `includeSymbols`:

```tsx
const getter = useMemo(() => () => Object.create({ hidden: 123 }, {
  visible: { value: 'ok', enumerable: true },
  secret: {
    enumerable: false,
    get() {
      return 'classified';
    },
  },
}), []);

<ObjectView valueGetter={getter} nonEnumerable includeSymbols expandLevel={1} />;
```

### Working with Promises

Promises update automatically as they resolve or reject. Wrap long-running operations inside the getter:

```tsx
const [promise, setPromise] = useState(() => Promise.resolve('ready'));
const getter = useMemo(() => () => ({ request: promise }), [promise]);

return (
  <>
    <button onClick={() => setPromise(new Promise(resolve => setTimeout(() => resolve('done'), 1500)))}>
      Start Async Task
    </button>
    <ObjectView valueGetter={getter} expandLevel={1} />
  </>
);
```

### Searching large trees

Attach a ref to `ObjectView` to access the streaming search handle. Pair it with the floating `SearchComponent` for keyboard shortcuts, highlights, and a loading indicator:

```tsx
import { ObjectView, ObjectViewHandle, SearchComponent } from 'react-obj-view';

const ref = useRef<ObjectViewHandle | null>(null);

<ObjectView valueGetter={() => data} ref={ref} />

<SearchComponent
  active={searchOpen}
  onClose={() => setSearchOpen(false)}
  handleSearch={(filterFn, markTerm, onResult, opts) =>
    ref.current?.search(filterFn, markTerm, onResult, {
      ...opts,
      maxResult: 2000,
      maxDepth: 10,
    })
  }
  scrollToPaths={(paths, scrollOpts) =>
    ref.current?.scrollToPaths(paths, scrollOpts, 200, 120)
  }
  options={{ normalizeSymbol: (c) => c.normalize('NFD').replace(/\p{M}/gu, '') }}
/>;
```

- Typing builds a tokenised filter; matches stream back in batches via `requestIdleCallback` so the UI stays responsive.
- Tune `maxResult`, `maxDepth`, `iterateSize`, or `fullSearch` to cap work for large payloads; pass `offsetTop` / `offsetBottom` to `scrollToPaths` when sticky UI could obscure the target row.

If you want to build a bespoke search bar (but keep the same behaviour as `SearchComponent`), you can use the exported `useObjectViewSearch` hook.

## Styling Tips

- Override `.big-objview-root` or child selectors to match your theme.
- Adjust height by setting `.big-objview-root { height: 100%; }` and wrapping the component in a container with your desired size.
- Modify keyword colours via `.big-objview-root .value.type-boolean`, `.type-null`, etc.

### Applying Theme Presets

The library ships with ready-to-use palettes. Import a preset and hand it to the `style` prop to swap colours instantly:

```tsx
import { useMemo } from 'react';
import { ObjectView } from 'react-obj-view';
import { themeDracula } from 'react-obj-view';

const getter = useMemo(() => () => data, [data]);

<ObjectView valueGetter={getter} style={themeDracula} />;
```

Need layout tweaks too? Spread the preset before applying your overrides:

```tsx
<ObjectView
  valueGetter={getter}
  style={{
    ...themeDracula,
    height: 420,
  }}
/>
```

Presets are just `CSSProperties`, so you can reuse the same object across multiple viewers or feed it into your design system tokens.

> `getter` is the memoised `valueGetter` used throughout your component examples.

### Rolling a custom palette

Use the exported helpers when you want a bespoke palette or to build a theme editor:

```ts
import {
  createTheme,
  extendTheme,
  themeDefault,
} from 'react-obj-view';

const slate = createTheme({
  "--bigobjview-color": "#f1f5f9",
  "--bigobjview-bg-color": "#0f172a",
  "--bigobjview-change-color": "#f43f5e",
  "--bigobjview-fontsize": "13px",
  "--bigobjview-type-boolean-color": "#22d3ee",
  "--bigobjview-type-number-color": "#f97316",
  "--bigobjview-type-bigint-color": "#fb923c",
  "--bigobjview-type-string-color": "#fde047",
  "--bigobjview-type-object-array-color": "#38bdf8",
  "--bigobjview-type-object-object-color": "#a855f7",
  "--bigobjview-type-object-promise-color": "#ec4899",
  "--bigobjview-type-object-map-color": "#2dd4bf",
  "--bigobjview-type-object-set-color": "#14b8a6",
  "--bigobjview-type-function-color": "#22d3ee",
  "--bigobjview-type-object-regexp-color": "#fb7185",
  "--bigobjview-type-object-date-color": "#bef264",
  "--bigobjview-type-object-error-color": "#f87171",
});

const slateCompact = extendTheme(slate, {
  "--bigobjview-fontsize": "11px",
  lineHeight: 12,
});
```

- `createTheme` requires every CSS variable listed in the styling reference, guaranteeing the resulting object stays compatible with `style`.
- `extendTheme` clones a preset/custom palette and overrides only the keys you pass (plus optional standard CSS properties).

## Advanced Features

### Hover Interactions

The viewer automatically highlights rows and dims siblings when hovering, making it easier to trace parent-child relationships in deeply nested structures. This feature is always enabled and adapts to your theme automatically.

The implementation uses CSS custom properties (`--active-index` and `--active-parent`) that are set via the [`useHoverInteractions`](src/react-obj-view/hooks/useHoverInteractions.tsx) hook.

### Copy to Clipboard

Each row includes built-in action buttons for copying values:

```tsx
// Primitives get a "Copy Text" button
const greeting = "Hello World";
<ObjectView valueGetter={() => greeting} />
// Click the Copy Text button to copy "Hello World"

// Objects get a "Copy JSON" button
const user = { name: "Ada", roles: ["admin"] };
<ObjectView valueGetter={() => user} />
// Click Copy JSON to copy {"name":"Ada","roles":["admin"]}
```

Copy actions show success/error feedback and automatically reset after 5 seconds. The functionality is powered by the [`DEFAULT_ACTION`](src/react-obj-view/actions/defaultAction.tsx) and the browser Clipboard API.

### Line Numbers

Enable line numbers for easier debugging and reference:

```tsx
<ObjectView
  valueGetter={() => largeData}
  showLineNumbers={true}
  lineHeight={18}  // Adjust if needed for your CSS
/>
```

Line numbers are 0-based and rendered in a dedicated gutter column.

### Building Custom Tree Views

The library now exports generic tree APIs that work with any hierarchical data:

```tsx
import { walkingFactory, type WalkingAdapter } from 'react-obj-view';

// Define your domain
type FileNode = {
  name: string;
  type: 'folder' | 'file';
  children?: FileNode[];
};

// Create an adapter
const fileAdapter: WalkingAdapter<FileNode, string, any, any, any> = {
  valueHasChild: (node) => node.type === 'folder' && !!node.children?.length,
  iterateChilds: (node, ctx, ref, cb) => {
    node.children?.forEach((child, i) => {
      cb(child, child.name, { label: child.name });
    });
  },
  // ... other adapter methods
};

const fileTreeFactory = () => walkingFactory(fileAdapter);
```

See [Generic Tree Stack](./docs/GENERIC_TREE_VIEW.md) for a complete example including React integration.

## Programmatic Search

You can control the search functionality programmatically using a ref. This allows you to build custom search UIs or integrate with existing ones.

```tsx
import { ObjectView, ObjectViewHandle } from 'react-obj-view';

const MyComponent = () => {
  const objViewRef = useRef<ObjectViewHandle>(null);

  const handleSearch = () => {
    // Search for values containing "error"
    objViewRef.current?.search(
      (value) => String(value).includes("error"),
      "error", // Term to highlight
      (results) => console.log("Found matches at:", results)
    );
  };

  const clearSearch = () => {
    // Clear search by calling with no arguments
    objViewRef.current?.search();
  };

  return (
    <>
      <button onClick={handleSearch}>Find Errors</button>
      <button onClick={clearSearch}>Clear</button>
      <ObjectView ref={objViewRef} valueGetter={...} />
    </>
  );
};
```

## Troubleshooting

- **Getter identity changes every render**: Wrap with `useMemo`/`useCallback` using the underlying value as a dependency.
- **Disable highlight effect**: Set `highlightUpdate={false}` (highlighting is on by default).
- **Large data feels slow**: Enable grouping for arrays/objects and keep getters memoised.
- **Need to inspect prototypes**: Toggle `nonEnumerable` and `includeSymbols` to include inherited and symbol keys.

## Next Steps

- Explore the [API documentation](API_DOCUMENTATION.md) for resolver internals.
- Review the [demo source](src/Test.tsx) for a comprehensive showcase.
- See [DEMO_SETUP](DEMO_SETUP.md) for GitHub Pages deployment details.

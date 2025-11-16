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

- Produce new object/array references when data changes so the viewer can diff nodes efficiently.
- Avoid mutating nested properties in place; create a new copy and update the getter dependencies.
- Development builds detect direct mutations and refresh the affected subtree automatically.

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
  themeKeys,
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

- `themeKeys` / `themeKeyIndex` expose the canonical CSS variable names. Iterate them when building forms to avoid missing new tokens.
- `createTheme` requires every CSS variable, guaranteeing the resulting object stays compatible with `style`.
- `extendTheme` clones a preset/custom palette and overrides only the keys you pass (plus optional standard CSS properties).

## Troubleshooting

- **Getter identity changes every render**: Wrap with `useMemo`/`useCallback` using the underlying value as a dependency.
- **No highlight effect**: Pass `highlightUpdate` explicitly (`false` by default).
- **Large data feels slow**: Enable grouping for arrays/objects and keep getters memoised.
- **Need to inspect prototypes**: Toggle `nonEnumerable` and `includeSymbols` to include inherited and symbol keys.

## Next Steps

- Explore the [API documentation](API_DOCUMENTATION.md) for resolver internals.
- Review the [demo source](src/Test.tsx) for a comprehensive showcase.
- See [DEMO_SETUP](DEMO_SETUP.md) for GitHub Pages deployment details.

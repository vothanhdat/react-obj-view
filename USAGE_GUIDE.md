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

Inspect getters, symbols, and prototype chains by enabling `nonEnumerable`:

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

<ObjectView valueGetter={getter} nonEnumerable expandLevel={1} />;
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

## Troubleshooting

- **Getter identity changes every render**: Wrap with `useMemo`/`useCallback` using the underlying value as a dependency.
- **No highlight effect**: Pass `highlightUpdate` explicitly (`false` by default).
- **Large data feels slow**: Enable grouping for arrays/objects and keep getters memoised.
- **Need to inspect prototypes**: Toggle `nonEnumerable` to include inherited and symbol keys.

## Next Steps

- Explore the [API documentation](API_DOCUMENTATION.md) for resolver internals.
- Review the [demo source](src/Test.tsx) for a comprehensive showcase.
- See [DEMO_SETUP](DEMO_SETUP.md) for GitHub Pages deployment details.

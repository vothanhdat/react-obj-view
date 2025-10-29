# Usage Guide

This guide provides practical examples and best practices for using React Object View in your applications.

## Getting Started

### Installation & Setup

```bash
npm install react-obj-view
```

**Important: Import both the component and CSS:**

```tsx
import React from 'react';
import { ObjectView } from 'react-obj-view';
// ⚠️ REQUIRED: Import CSS styles separately
import 'react-obj-view/dist/react-obj-view.css';
```

> **Why separate CSS import?** This gives you control over when styles are loaded and allows for better optimization in your build process.

## Common Use Cases

### 1. API Response Debugging

Perfect for inspecting API responses during development:

```tsx
import React, { useState, useEffect } from 'react';
import { ObjectView } from 'react-obj-view';

const ApiDebugger = () => {
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setApiData({
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        data: data,
        timestamp: new Date()
      });
    } catch (error) {
      setApiData({ error: error.message, timestamp: new Date() });
    }
    setLoading(false);
  };

  return (
    <div>
      <button onClick={fetchData} disabled={loading}>
        {loading ? 'Loading...' : 'Fetch API Data'}
      </button>
      
      {apiData && (
        <ObjectView 
          value={apiData} 
          name="API Response"
          expandLevel={2}
          style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #ddd' }}
        />
      )}
    </div>
  );
};
```

### 2. State Management Visualization

Monitor your application state changes:

```tsx
import React, { useReducer } from 'react';
import { ObjectView } from 'react-obj-view';

const initialState = {
  user: { name: '', email: '', isLoggedIn: false },
  ui: { theme: 'light', sidebarOpen: false },
  data: { items: [], loading: false, error: null }
};

const stateReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        user: { ...action.payload, isLoggedIn: true }
      };
    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        ui: { ...state.ui, sidebarOpen: !state.ui.sidebarOpen }
      };
    case 'SET_LOADING':
      return {
        ...state,
        data: { ...state.data, loading: action.payload }
      };
    default:
      return state;
  }
};

const StateManager = () => {
  const [state, dispatch] = useReducer(stateReducer, initialState);

  return (
    <div style={{ display: 'flex', gap: '2rem' }}>
      <div>
        <h3>Actions</h3>
        <button onClick={() => dispatch({
          type: 'LOGIN',
          payload: { name: 'John Doe', email: 'john@example.com' }
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
        <h3>Application State</h3>
        <ObjectView 
          value={state} 
          name="appState"
          expandLevel={2}
        />
      </div>
    </div>
  );
};
```

### 3. Configuration Inspector

Display and debug application configuration:

```tsx
import React from 'react';
import { ObjectView } from 'react-obj-view';

const ConfigInspector = () => {
  const appConfig = {
    api: {
      baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3000',
      timeout: 5000,
      retries: 3,
      endpoints: {
        users: '/api/users',
        posts: '/api/posts',
        auth: '/api/auth'
      }
    },
    features: {
      darkMode: true,
      notifications: false,
      analytics: process.env.NODE_ENV === 'production',
      betaFeatures: ['newDashboard', 'advancedFilters']
    },
    ui: {
      theme: {
        primary: '#007bff',
        secondary: '#6c757d',
        success: '#28a745',
        warning: '#ffc107',
        danger: '#dc3545'
      },
      layout: {
        sidebarWidth: 250,
        headerHeight: 60,
        footerHeight: 40
      }
    },
    build: {
      version: '1.2.3',
      buildTime: new Date('2024-01-15T10:30:00Z'),
      environment: process.env.NODE_ENV,
      gitCommit: 'abc123def456'
    }
  };

  return (
    <div>
      <h2>Application Configuration</h2>
      <ObjectView 
        value={appConfig} 
        name="config"
        expandLevel={1}
        objectGroupSize={50}
      />
    </div>
  );
};
```

### 4. Form Data Visualizer

Debug form state and validation:

```tsx
import React, { useState } from 'react';
import { ObjectView } from 'react-obj-view';

const FormDebugger = () => {
  const [formData, setFormData] = useState({
    personal: {
      firstName: '',
      lastName: '',
      email: '',
      age: null
    },
    preferences: {
      newsletter: false,
      theme: 'light',
      language: 'en'
    },
    metadata: {
      formTouched: false,
      lastUpdated: null,
      validationErrors: {}
    }
  });

  const updateField = (path, value) => {
    setFormData(prev => {
      const updated = { ...prev };
      const keys = path.split('.');
      let current = updated;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      updated.metadata.lastUpdated = new Date();
      updated.metadata.formTouched = true;
      
      return updated;
    });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
      <div>
        <h3>Form</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            placeholder="First Name"
            value={formData.personal.firstName}
            onChange={(e) => updateField('personal.firstName', e.target.value)}
          />
          <input
            placeholder="Last Name"
            value={formData.personal.lastName}
            onChange={(e) => updateField('personal.lastName', e.target.value)}
          />
          <input
            placeholder="Email"
            type="email"
            value={formData.personal.email}
            onChange={(e) => updateField('personal.email', e.target.value)}
          />
          <input
            placeholder="Age"
            type="number"
            value={formData.personal.age || ''}
            onChange={(e) => updateField('personal.age', parseInt(e.target.value) || null)}
          />
          <label>
            <input
              type="checkbox"
              checked={formData.preferences.newsletter}
              onChange={(e) => updateField('preferences.newsletter', e.target.checked)}
            />
            Subscribe to newsletter
          </label>
        </div>
      </div>
      
      <div>
        <h3>Form State</h3>
        <ObjectView 
          value={formData} 
          name="formData"
          expandLevel={2}
        />
      </div>
    </div>
  );
};
```

### 6. Custom Type Visualization

Use resolver overrides to tailor how your domain objects appear in the tree:

```tsx
import React, { useMemo } from 'react';
import { ObjectView } from 'react-obj-view';

class APIEndpoint {
  constructor(
    public method: string,
    public url: string,
    public status: number,
    public responseTime: number,
    public data?: any
  ) {}
}

type Entry = { name: PropertyKey; data: any; isNonenumerable: boolean };
type ResolverFn = (value: any, entries: Generator<Entry>, isPreview: boolean) => Generator<Entry>;

const createEndpointResolvers = (): Map<Function, ResolverFn> => {
  return new Map([
    [APIEndpoint, function* endpointResolver(endpoint, iterator, isPreview) {
      const entries = [...iterator];

      const pull = (key: string) => {
        const index = entries.findIndex(entry => String(entry.name) === key);
        if (index >= 0) {
          const [entry] = entries.splice(index, 1);
          return entry;
        }
        return undefined;
      };

      if (isPreview) {
        yield { name: 'request', data: `${endpoint.method} ${endpoint.url}`, isNonenumerable: false };
        yield { name: 'status', data: endpoint.status, isNonenumerable: false };
        return;
      }

      const methodEntry = pull('method');
      const urlEntry = pull('url');
      const statusEntry = pull('status');

      if (methodEntry) yield methodEntry;
      if (urlEntry) yield urlEntry;
      if (statusEntry) yield statusEntry;

      yield {
        name: 'responseTimeLabel',
        data: `${endpoint.responseTime}ms`,
        isNonenumerable: false,
      };

      const dataEntry = pull('data');
      if (dataEntry) yield dataEntry;

      yield* entries;
    }],
  ]);
};

const APIMonitor = () => {
  const resolverMap = useMemo(createEndpointResolvers, []);

  const apiCalls = {
    userAPI: new APIEndpoint('GET', '/api/users', 200, 145, {
      users: [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }],
      total: 2,
    }),
    authAPI: new APIEndpoint('POST', '/api/auth/login', 401, 89, {
      error: 'Invalid credentials',
    }),
    healthCheck: new APIEndpoint('GET', '/health', 200, 23, { status: 'ok' }),
  };

  return (
    <div>
      <h2>API Call Monitor</h2>
      <ObjectView
        value={apiCalls}
        name="apiCalls"
        resolver={resolverMap}
        expandLevel={1}
        preview
      />
    </div>
  );
};
```

```tsx
import React, { useState } from 'react';
import { ObjectView } from 'react-obj-view';

const ErrorInspector = () => {
  const [errors, setErrors] = useState([]);

  const simulateError = (type) => {
    const timestamp = new Date();
    let error;

    switch (type) {
      case 'network':
        error = {
          type: 'NetworkError',
          message: 'Failed to fetch data from server',
          status: 500,
          url: '/api/users',
          timestamp,
          stack: 'Error: Failed to fetch\n    at fetch (/api/users)\n    at async fetchUsers',
          details: {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            timeout: 5000
          }
        };
        break;
      case 'validation':
        error = {
          type: 'ValidationError',
          message: 'Form validation failed',
          timestamp,
          fields: {
            email: ['Invalid email format'],
            password: ['Password must be at least 8 characters'],
            age: ['Age must be between 18 and 120']
          },
          formData: {
            email: 'invalid-email',
            password: '123',
            age: 15
          }
        };
        break;
      case 'javascript':
        try {
          // Intentional error
          const obj = null;
          obj.property.something;
        } catch (e) {
          error = {
            type: 'JavaScript Error',
            name: e.name,
            message: e.message,
            stack: e.stack,
            timestamp,
            context: {
              component: 'ErrorInspector',
              action: 'simulateError',
              userAgent: navigator.userAgent
            }
          };
        }
        break;
    }

    setErrors(prev => [error, ...prev.slice(0, 4)]); // Keep last 5 errors
  };

  return (
    <div>
      <h2>Error Inspector</h2>
      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => simulateError('network')}>Network Error</button>
        <button onClick={() => simulateError('validation')}>Validation Error</button>
        <button onClick={() => simulateError('javascript')}>JavaScript Error</button>
        <button onClick={() => setErrors([])}>Clear All</button>
      </div>
      
      {errors.length === 0 ? (
        <p>No errors captured. Click buttons above to simulate errors.</p>
      ) : (
        <div>
          {errors.map((error, index) => (
            <div key={index} style={{ 
              marginBottom: '1rem', 
              padding: '1rem', 
              border: '1px solid #dc3545',
              borderRadius: '4px',
              backgroundColor: '#f8d7da'
            }}>
              <h4>Error #{index + 1}</h4>
              <ObjectView 
                value={error} 
                name={`error_${index}`}
                expandLevel={1}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

## Performance Tips

### 1. Large Datasets

```tsx
// For large datasets, use appropriate grouping
const LargeDataViewer = ({ data }) => {
  return (
    <ObjectView 
      value={data}
      expandLevel={1}        // Don't expand everything
      arrayGroupSize={25}    // Group large arrays
      objectGroupSize={50}   // Group large objects
    />
  );
};
```

### 2. Dynamic Data with Controlled Highlighting

```tsx
// For frequently changing data, disable highlighting for better performance
const RealTimeDataViewer = ({ streamData }) => {
  return (
    <ObjectView 
      value={streamData}
      expandLevel={false}    // Start collapsed
      highlightUpdate={false} // Disable change highlighting
      name="liveData"
    />
  );
};

// For important state changes, keep highlighting enabled
const StateViewer = ({ appState }) => {
  return (
    <ObjectView 
      value={appState}
      expandLevel={1}
      highlightUpdate={true}  // Enable highlighting (default)
      name="applicationState"
    />
  );
};
```

### 3. Custom Panels for Performance

```tsx
// Compose ObjectView inside your own UI to keep large collections manageable
import React, { useState } from 'react';
import { ObjectView } from 'react-obj-view';

class LargeDataSet {
  constructor(public items: any[], public metadata: any) {}
}

const LargeDataSetPanel = ({ dataset }: { dataset: LargeDataSet }) => {
  const [showItems, setShowItems] = useState(false);

  return (
    <div>
      <div className="dataset-summary">
        <span>📊 Dataset ({dataset.items.length} items)</span>
        <button onClick={() => setShowItems(!showItems)}>
          {showItems ? 'Hide' : 'Show'} Items
        </button>
      </div>

      {showItems && (
        <ObjectView
          value={dataset.items.slice(0, 100)} // Only show first 100 items
          name="items (first 100)"
          expandLevel={false}
          arrayGroupSize={25}
          highlightUpdate={false}
        />
      )}

      <ObjectView
        value={dataset.metadata}
        name="metadata"
        expandLevel={1}
      />
    </div>
  );
};
```

## Styling Examples

### Custom Theme

```css
/* Dark theme example */
.jv-root.dark-theme {
  background-color: #1e1e1e;
  color: #d4d4d4;
  padding: 1rem;
  border-radius: 8px;
}

.dark-theme .jv-name {
  color: #9cdcfe;
}

.dark-theme .jv-field-string .jv-value {
  color: #ce9178;
}

.dark-theme .jv-field-number .jv-value {
  color: #b5cea8;
}

.dark-theme .jv-field-boolean .jv-value {
  color: #569cd6;
}

.dark-theme .jv-cursor:hover {
  background-color: #2d2d30;
}
```

```tsx
// Apply custom theme
<ObjectView 
  value={data}
  style={{ className: 'dark-theme' }}
/>
```

### Compact View

```css
.jv-root.compact {
  font-size: 11px;
  line-height: 1.2;
}

.compact .jv-field {
  margin: 2px 0;
}
```

### Keyword Styling Customization

The new keyword badges (for `null`, `undefined`, `true`, `false`) can be customized:

```css
/* Customize keyword badges */
.jv-keyword {
  font-size: 0.8em;
  padding: 0.2em 0.5em;
  border-radius: 0.3em;
  text-transform: uppercase;
  font-weight: bold;
  margin: 0 0.2em;
}

/* Different colors for different keywords */
.jv-field-boolean .jv-keyword {
  background-color: #e3f2fd;
  color: #1976d2;
}

.jv-field-undefined .jv-keyword,
.jv-field-null .jv-keyword {
  background-color: #fce4ec;
  color: #c2185b;
}

/* Dark theme keywords */
.dark-theme .jv-keyword {
  background-color: rgba(255, 255, 255, 0.1);
  color: inherit;
}
```

## Integration Examples

### With React DevTools

```tsx
// Create a custom hook for debugging
const useObjectViewDebug = (value, name) => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${name}] Updated:`, value);
    }
  }, [value, name]);

  if (process.env.NODE_ENV === 'development') {
    return <ObjectView value={value} name={name} expandLevel={1} />;
  }
  
  return null;
};

// Use in components
const MyComponent = () => {
  const [state, setState] = useState(initialState);
  
  return (
    <div>
      <div>Your regular component content</div>
      {useObjectViewDebug(state, 'MyComponent.state')}
    </div>
  );
};
```

### With Error Boundaries

```tsx
class ErrorBoundaryWithInspector extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h2>Something went wrong.</h2>
          <ObjectView 
            value={{
              error: this.state.error,
              errorInfo: this.state.errorInfo,
              timestamp: new Date()
            }}
            name="errorDetails"
            expandLevel={2}
          />
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Best Practices

1. **Start Small**: Begin with `expandLevel={1}` for large objects
2. **Use Grouping**: Adjust grouping thresholds based on your data size
3. **Performance**: Be cautious with `expandLevel={true}` on large datasets
4. **Development Only**: Consider hiding in production builds
5. **Naming**: Use descriptive names for better debugging experience
6. **Styling**: Customize CSS to match your application's theme
7. **Resolver Overrides**: Use resolvers when you need custom ordering or derived fields for class instances
8. **Change Highlighting**: Disable `highlightUpdate` for frequently changing data
9. **Memory Management**: Keep resolver logic and custom panels free of stale references to prevent leaks
10. **Accessibility**: Ensure any wrappers or custom panels maintain keyboard navigation and screen reader support
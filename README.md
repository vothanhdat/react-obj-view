# React Object View

A powerful and flexible React component for visualizing JavaScript objects and data structures with an interactive, expandable tree view. Perfect for debugging, data inspection, and creating developer tools.

## 🌟 Live Demo

**[Try the Interactive Demo →](https://vothanhdat.github.io/react-obj-view/)**

Experience all features hands-on including resolver overrides, keyword styling, and configurable highlighting!

> **Note**: If the demo link shows "404", please wait a few minutes for GitHub Pages to deploy, or check that GitHub Pages is enabled in repository settings.

## ✨ Features

- 🌳 **Interactive Tree View**: Expand and collapse object properties with intuitive click interactions
- 🎯 **Smart Type Rendering**: Intelligent display for all JavaScript types (objects, arrays, functions, promises, maps, sets, etc.)
- 📦 **Automatic Grouping**: Groups large arrays and objects for optimal performance and readability
- 🔄 **Circular Reference Safe**: Safely handles circular references without infinite loops
- ⚡ **Performance Optimized**: Efficient rendering with lazy loading and change detection
- 🎨 **Customizable Styling**: Built-in CSS with full customization support
- 🧩 **Resolver Overrides**: Extend or replace rendering for class instances with generator-based resolvers
- 💡 **Keyword Highlighting**: Special styling for boolean values, null, undefined with keyword badges
- � **TypeScript Ready**: Complete TypeScript support with proper type definitions
- 🔍 **Developer Friendly**: Perfect for debugging, logging, and data inspection
- ⚙️ **Configurable Highlighting**: Control change detection and flash highlighting behavior

## 🚀 Quick Start

### Installation

```bash
npm install react-obj-view
# or
yarn add react-obj-view
```

### Basic Usage

```tsx
import React from 'react';
import { ObjectView } from 'react-obj-view';
// Import the CSS styles
import 'react-obj-view/dist/react-obj-view.css';

const App = () => {
  const data = {
    user: {
      name: "John Doe",
      age: 30,
      preferences: {
        theme: "dark",
        notifications: true
      }
    },
    items: ["apple", "banana", "cherry"],
    metadata: {
      created: new Date(),
      tags: new Set(["react", "typescript"])
    }
  };

  return (
    <div>
      <h1>Data Inspector</h1>
      <ObjectView 
        value={data} 
        name="appData" 
        expandLevel={2} 
      />
    </div>
  );
};
```

## 📖 Examples

### Controlling Expansion

```tsx
// Expand all levels (use carefully with large objects)
<ObjectView value={data} expandLevel={true} />

// Expand first 3 levels
<ObjectView value={data} expandLevel={3} />

// Start collapsed
<ObjectView value={data} expandLevel={false} />
```

### Handling Different Data Types

```tsx
const complexData = {
  // Primitives
  name: "React Object View",
  version: 1.0,
  isActive: true,
  
  // Collections
  users: ["alice", "bob", "charlie"],
  userMap: new Map([
    ["alice", { role: "admin" }],
    ["bob", { role: "user" }]
  ]),
  tags: new Set(["react", "typescript", "visualization"]),
  
  // Advanced types
  createdAt: new Date(),
  pattern: /[a-z]+/gi,
  callback: (x) => x * 2,
  asyncData: Promise.resolve("Loaded successfully"),
  
  // Nested structures
  config: {
    api: {
      baseUrl: "https://api.example.com",
      timeout: 5000,
      retries: 3
    },
    features: {
      darkMode: true,
      notifications: false
    }
  }
};

<ObjectView 
  value={complexData} 
  name="appConfig"
  expandLevel={2}
  objectGroupSize={50}  // Group objects with 50+ properties
  arrayGroupSize={20}   // Group arrays with 20+ items
/>
```

### Real-World Use Cases

#### API Response Debugging
```tsx
const apiResponse = {
  status: 200,
  data: {
    users: [
      { id: 1, name: "Alice", email: "alice@example.com" },
      { id: 2, name: "Bob", email: "bob@example.com" }
    ],
    pagination: {
      page: 1,
      totalPages: 5,
      totalItems: 87
    }
  },
  headers: {
    "content-type": "application/json",
    "x-request-id": "abc-123"
  }
};

<ObjectView value={apiResponse} name="API Response" expandLevel={2} />
```

#### State Management Debugging
```tsx
const [appState, setAppState] = useState({
  user: { name: "John", preferences: {...} },
  ui: { theme: "dark", sidebarOpen: true },
  data: { items: [...], loading: false }
});

// Visualize state changes
<ObjectView 
  value={appState} 
  name="Application State" 
  expandLevel={1} 
/>
```

## 🎛️ API Reference

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `any` | **required** | The data to visualize |
| `name` | `string` | `undefined` | Display name for the root object |
| `style` | `CSSProperties` | `undefined` | Custom styles for the container |
| `expandLevel` | `number \| boolean` | `false` | Initial expansion: `true` (all), `false` (none), or depth number |
| `objectGroupSize` | `number` | `100` | Group objects with more than N properties |
| `arrayGroupSize` | `number` | `10` | Group arrays with more than N elements |
| `resolver` | `Map<Constructor, ResolverFn>` | `undefined` | Override or extend rendering for constructors |
| `highlightUpdate` | `boolean` | `true` | Enable/disable change detection highlighting |
| `preview` | `boolean` | `true` | Render preview badges when collapsed |
| `nonEnumerable` | `boolean` | `true` | Include non-enumerable properties |

### Supported Data Types

- ✅ **Primitives**: `string`, `number`, `boolean`, `null`, `undefined`, `symbol`, `bigint`
- ✅ **Objects**: Plain objects, class instances, nested structures
- ✅ **Arrays**: Regular arrays, typed arrays, sparse arrays
- ✅ **Functions**: Arrow functions, regular functions, methods
- ✅ **Built-ins**: `Date`, `RegExp`, `Error`, `Map`, `Set`, `Promise`
- ✅ **Special Cases**: Circular references, long strings, large collections

## 🎨 Styling

The component comes with sensible defaults but is fully customizable:

```css
/* Container */
.jv-root { 
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
}

/* Property names */
.jv-name { 
  color: #881391; 
  font-weight: bold;
}

/* Values by type */
.jv-field-string .jv-value { color: #c41a16; }
.jv-field-number .jv-value { color: #1c00cf; }
.jv-field-boolean .jv-value { color: #aa0d91; }

/* Keyword badges (null, undefined, true, false) */
.jv-keyword {
  font-size: 0.85em;
  padding-inline: 0.6em;
  margin-inline: 0.3em;
  padding-block: 0.05em;
  border-radius: 0.2em;
  text-transform: uppercase;
  font-weight: bold;
  background-color: color-mix(in srgb, currentColor 20%, var(--jv-bg-color));
}

/* Interactive elements */
.jv-cursor { cursor: pointer; }
.jv-cursor:hover { background-color: #f0f0f0; }

/* Change highlighting */
.change-flash {
  background-color: #fff3cd;
  transition: background-color 0.5s ease;
}
```

## 🔧 Advanced Features

### Change Detection
Values that change between renders are automatically highlighted:

```tsx
const [counter, setCounter] = useState({ count: 0, lastUpdated: Date.now() });

const increment = () => {
  setCounter(prev => ({
    count: prev.count + 1,
    lastUpdated: Date.now()
  }));
};

return (
  <div>
    <button onClick={increment}>Increment</button>
    <ObjectView value={counter} expandLevel={true} />
  </div>
);
```

### Performance with Large Data
```tsx
// Efficiently handles large datasets
const largeDataset = {
  users: new Array(1000).fill(null).map((_, i) => ({
    id: i,
    name: `User ${i}`,
    email: `user${i}@example.com`
  })),
  metadata: {
    total: 1000,
    generated: new Date()
  }
};

<ObjectView 
  value={largeDataset}
  arrayGroupSize={50}    // Show 50 items before grouping
  objectGroupSize={100}  // Show 100 properties before grouping
  expandLevel={1}      // Only expand first level initially
/>
```

### Resolver Overrides

Fine-tune how specific constructors render by supplying resolver overrides. A resolver is a generator that receives the current value, the default entry iterator, and a `isPreview` flag. You can yield custom entries, reorder fields, or add derived data before falling back to the defaults.

```tsx
import React, { useMemo } from 'react';
import { ObjectView } from 'react-obj-view';

class User {
  constructor(public name: string, public email: string, public role: string = 'user') {}
}

class APIEndpoint {
  constructor(
    public method: string,
    public url: string,
    public status: number,
    public responseTime: number,
  ) {}
}

type Entry = { name: PropertyKey; data: any; isNonenumerable: boolean };
type ResolverFn = (value: any, entries: Generator<Entry>, isPreview: boolean) => Generator<Entry>;

const createResolvers = (): Map<Function, ResolverFn> => {
  const resolvers = new Map<Function, ResolverFn>();

  resolvers.set(User, function* (user, iterator, isPreview) {
    const entries = [...iterator];

    if (isPreview) {
      yield { name: 'summary', data: `${user.name} • ${user.email}`, isNonenumerable: false };
      if (user.role !== 'user') {
        yield { name: 'role', data: user.role, isNonenumerable: false };
      }
      return;
    }

    const important = ['name', 'email', 'role'];
    for (const key of important) {
      const index = entries.findIndex(entry => String(entry.name) === key);
      if (index >= 0) {
        const [entry] = entries.splice(index, 1);
        yield entry;
      }
    }

    if (user.role !== 'user') {
      yield { name: 'badge', data: `⭐ ${user.role.toUpperCase()}`, isNonenumerable: false };
    }

    yield* entries;
  });

  resolvers.set(APIEndpoint, function* (endpoint, iterator, isPreview) {
    const entries = [...iterator];

    if (isPreview) {
      yield { name: 'request', data: `${endpoint.method} ${endpoint.url}`, isNonenumerable: false };
      yield { name: 'status', data: endpoint.status, isNonenumerable: false };
      return;
    }

    const ordered = ['method', 'url', 'status'];
    for (const key of ordered) {
      const index = entries.findIndex(entry => String(entry.name) === key);
      if (index >= 0) {
        const [entry] = entries.splice(index, 1);
        yield entry;
      }
    }

    yield {
      name: 'responseTimeLabel',
      data: `${endpoint.responseTime}ms`,
      isNonenumerable: false,
    };

    yield* entries;
  });

  return resolvers;
};

const data = {
  customUser: new User('Ada Lovelace', 'ada@example.com', 'admin'),
  login: new APIEndpoint('POST', '/api/auth/login', 401, 92),
};

const Demo = () => {
  const resolverMap = useMemo(createResolvers, []);

  return (
    <ObjectView
      value={data}
      resolver={resolverMap}
      expandLevel={2}
      preview
    />
  );
};
```

### Controlling Change Highlighting

```tsx
// Disable change highlighting for performance
<ObjectView 
  value={frequentlyChangingData}
  highlightUpdate={false}
  expandLevel={1}
/>

// Enable highlighting (default behavior)
<ObjectView 
  value={data}
  highlightUpdate={true}
  expandLevel={1}
/>
```

## 💡 Tips & Best Practices

1. **Performance**: Use appropriate `expandLevel` values for large objects
2. **Grouping**: Adjust `arrayGroupSize` and `objectGroupSize` based on your data size
3. **Debugging**: Perfect for inspecting API responses, state changes, and complex data structures
4. **Development**: Great for creating admin panels, debug tools, and data browsers

## 🌐 Browser Support

- ✅ Chrome/Edge 88+
- ✅ Firefox 85+
- ✅ Safari 14+
- ✅ React 19+
- ✅ TypeScript 5.0+

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## 🔗 Links

- [GitHub Repository](https://github.com/vothanhdat/react-obj-view)
- [Issue Tracker](https://github.com/vothanhdat/react-obj-view/issues)
- [NPM Package](https://www.npmjs.com/package/react-obj-view)
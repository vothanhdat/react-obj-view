# React Object View

A powerful and flexible React component for visualizing JavaScript objects and data structures with an interactive, expandable tree view. Perfect for debugging, data inspection, and creating developer tools.

## ✨ Features

- 🌳 **Interactive Tree View**: Expand and collapse object properties with intuitive click interactions
- 🎯 **Smart Type Rendering**: Intelligent display for all JavaScript types (objects, arrays, functions, promises, maps, sets, etc.)
- 📦 **Automatic Grouping**: Groups large arrays and objects for optimal performance and readability
- 🔄 **Circular Reference Safe**: Safely handles circular references without infinite loops
- ⚡ **Performance Optimized**: Efficient rendering with lazy loading and change detection
- 🎨 **Customizable Styling**: Built-in CSS with full customization support
- 📱 **TypeScript Ready**: Complete TypeScript support with proper type definitions
- 🔍 **Developer Friendly**: Perfect for debugging, logging, and data inspection

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
  objectGrouped={50}  // Group objects with 50+ properties
  arrayGrouped={20}   // Group arrays with 20+ items
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
| `objectGrouped` | `number` | `25` | Group objects with more than N properties |
| `arrayGrouped` | `number` | `10` | Group arrays with more than N elements |

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
  arrayGrouped={50}    // Show 50 items before grouping
  objectGrouped={100}  // Show 100 properties before grouping
  expandLevel={1}      // Only expand first level initially
/>
```

## 💡 Tips & Best Practices

1. **Performance**: Use appropriate `expandLevel` values for large objects
2. **Grouping**: Adjust `arrayGrouped` and `objectGrouped` based on your data size
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
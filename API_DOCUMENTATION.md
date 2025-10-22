# API Documentation

## Setup

### Installation

```bash
npm install react-obj-view
# or
yarn add react-obj-view
```

### Import

```tsx
import { ObjectView } from 'react-obj-view';
// ⚠️ IMPORTANT: Import CSS styles separately
import 'react-obj-view/dist/react-obj-view.css';
```

> **Note**: The CSS file must be imported separately as it's not bundled with the JavaScript. This gives you control over when and how the styles are loaded.

## Components

### ObjectView

The main component for rendering JavaScript objects and values in a tree-like structure.

#### Interface

```tsx
interface ObjectViewProps {
  value: any;
  name?: string;
  style?: React.CSSProperties;
  expandLevel?: number | boolean;
  objectGrouped?: number;
  arrayGrouped?: number;
  customRender?: Map<Constructor, React.FC<JSONViewProps>>;
  highlightUpdate?: boolean;
}

type Constructor<T = {}> = new (...args: any[]) => T;
```

#### Props Detail

##### `value: any` (required)
The JavaScript value to be displayed. Can be any valid JavaScript type including:
- Primitives: `string`, `number`, `boolean`, `null`, `undefined`, `symbol`, `bigint`
- Objects: Plain objects, arrays, functions, classes, instances
- Built-ins: `Date`, `RegExp`, `Error`, `Map`, `Set`, `Promise`
- Special cases: Circular references, proxies, typed arrays

##### `name?: string`
Optional display name for the root value. If provided, it will be shown as a property name at the root level.

**Example:**
```tsx
<ObjectView value={user} name="currentUser" />
// Renders: currentUser: { ... }
```

##### `style?: React.CSSProperties`
Custom CSS styles applied to the root container element.

**Example:**
```tsx
<ObjectView 
  value={data} 
  style={{ 
    backgroundColor: '#f5f5f5', 
    padding: '1rem',
    borderRadius: '4px' 
  }} 
/>
```

##### `expandLevel?: number | boolean`
Controls the initial expansion state of the object tree:

- `false` (default): All nodes start collapsed
- `true`: All nodes start expanded (use carefully with large objects)
- `number`: Expand up to the specified depth level (0-based)

**Examples:**
```tsx
// Collapse everything
<ObjectView value={data} expandLevel={false} />

// Expand everything
<ObjectView value={data} expandLevel={true} />

// Expand first 2 levels only
<ObjectView value={data} expandLevel={2} />
```

**Performance Note:** Using `expandLevel={true}` with very large or deeply nested objects may cause performance issues.

##### `objectGrouped?: number`
Threshold for grouping object properties. When an object has more properties than this number, they will be grouped into ranges for better performance and readability.

**Default:** `25`

**Example:**
```tsx
// Group objects with more than 50 properties
<ObjectView value={largeObject} objectGrouped={50} />
```

##### `arrayGrouped?: number`
Threshold for grouping array elements. When an array has more elements than this number, they will be grouped into ranges.

**Default:** `10`

**Example:**
```tsx
// Group arrays with more than 20 elements  
<ObjectView value={largeArray} arrayGrouped={20} />
```

##### `customRender?: Map<Constructor, React.FC<JSONViewProps>>`
Map of custom renderer components for specific constructor functions. Allows you to provide custom visualization for specific data types or class instances.

**Default:** `undefined` (uses built-in renderers)

**Example:**
```tsx
class User {
  constructor(public name: string, public email: string) {}
}

const UserRenderer = ({ value, name, displayName, separator }) => (
  <div>
    {displayName && <span>{name}: </span>}
    <span>👤 {value.name} ({value.email})</span>
  </div>
);

const customRenderers = new Map([[User, UserRenderer]]);

<ObjectView 
  value={new User("John", "john@example.com")} 
  customRender={customRenderers}
/>
```

##### `highlightUpdate?: boolean`
Controls whether change detection and highlighting is enabled. When `true`, values that change between renders will be briefly highlighted.

**Default:** `true`

**Example:**
```tsx
// Disable change highlighting for better performance
<ObjectView value={frequentData} highlightUpdate={false} />

// Enable change highlighting (default)
<ObjectView value={data} highlightUpdate={true} />
```

## Internal Components

The ObjectView component now uses a modular architecture with specialized components:

### Core Components

#### ObjectRouter
Central routing component that determines which specialized renderer to use based on the value type and constructor.

#### ObjectDetailView  
Handles rendering of object-like structures (objects, arrays, Maps, Sets) with grouping and expansion logic.

#### PrimitiveView
Renders primitive values and simple built-in types with appropriate styling.

### Specialized Renderers (Addons)

#### StringViewObj
Handles string values with support for long string truncation and expansion.

#### FunctionViewObj
Renders function values with source code preview and truncation.

#### KeywordValueView
NEW: Specialized renderer for keyword values (`null`, `undefined`, `true`, `false`) with badge styling.

#### MapView
Specialized renderer for JavaScript Map objects, displaying key-value pairs with " => " separators.

#### SetView  
Specialized renderer for JavaScript Set objects, displaying unique values as an array.

#### PromiseView
Handles Promise objects by resolving them and displaying their state (pending, resolved, rejected).

#### InstanceView
Renders instances of custom classes and constructor functions.

### Hooks

#### useExpandState
Manages expansion state for individual nodes in the object tree.

#### defaultValue
Provides default values and utilities for the component system.

## Type Definitions

### JSONViewCtx
Internal context interface used for managing expansion state and configuration:

```tsx
interface JSONViewCtx {
  expandRootRef: React.RefObject<Record<string, boolean>>;
  customView: CustomViewMap;
  objectGrouped: number;
  arrayGrouped: number;
  highlightUpdate: boolean;
}

type CustomViewMap = Map<Constructor, React.FC<JSONViewProps>>;
type Constructor<T = {}> = new (...args: any[]) => T;
```

### JSONViewProps  
Internal props interface used by sub-components:

```tsx
interface JSONViewProps {
  value: any;
  path?: string[];
  trace?: any[];
  name?: string;
  expandLevel: number | boolean;
  currentType?: any;
  isGrouped?: boolean;
  displayName?: boolean;
  seperator?: string;
  context: JSONViewCtx;
}
```

## Custom Renderer System

The ObjectView component now supports a powerful custom renderer system that allows you to register specialized components for specific data types.

### How It Works

1. **Constructor Mapping**: Custom renderers are mapped to constructor functions using a `Map<Constructor, React.FC<JSONViewProps>>`
2. **Automatic Detection**: The ObjectRouter automatically detects the constructor of each value and looks up custom renderers
3. **Fallback Behavior**: If no custom renderer is found, the default rendering logic is used
4. **Built-in Renderers**: The component comes with built-in custom renderers for `Map`, `Set`, and `Promise`

### Creating Custom Renderers

Custom renderers must implement the `JSONViewProps` interface:

```tsx
interface JSONViewProps {
  value: any;
  path?: string[];
  trace?: any[];
  name?: string;
  expandLevel: number | boolean;
  currentType?: any;
  isGrouped?: boolean;
  displayName?: boolean;
  seperator?: string;
  context: JSONViewCtx;
}
```

### Example: Custom User Class Renderer

```tsx
import React from 'react';
import { ObjectView, JSONViewProps } from 'react-obj-view';

class User {
  constructor(
    public name: string, 
    public email: string, 
    public role: string = 'user'
  ) {}
}

const UserRenderer: React.FC<JSONViewProps> = ({ 
  value, 
  name, 
  displayName, 
  seperator = ":",
  context 
}) => {
  return (
    <div className="custom-user-renderer">
      {displayName && <span className="jv-name">{name}</span>}
      {displayName && <span>{seperator}</span>}
      <span className="user-badge" data-role={value.role}>
        👤 {value.name}
      </span>
      <span className="user-email">({value.email})</span>
      {value.role !== 'user' && (
        <span className="user-role-badge">{value.role.toUpperCase()}</span>
      )}
    </div>
  );
};

// Register the custom renderer
const customRenderers = new Map([
  [User, UserRenderer]
]);

// Use with ObjectView
const userData = {
  admin: new User("Admin User", "admin@example.com", "admin"),
  moderator: new User("Mod User", "mod@example.com", "moderator"),
  regular: new User("Regular User", "user@example.com")
};

<ObjectView 
  value={userData}
  customRender={customRenderers}
  expandLevel={2}
/>
```

### Advanced Custom Renderer with Nested Objects

```tsx
class Product {
  constructor(
    public id: string,
    public name: string,
    public price: number,
    public metadata: Record<string, any> = {}
  ) {}
}

const ProductRenderer: React.FC<JSONViewProps> = ({ 
  value, 
  name, 
  displayName, 
  seperator = ":",
  context,
  expandLevel,
  path = [],
  trace = []
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="product-renderer">
      {displayName && <span className="jv-name">{name}</span>}
      {displayName && <span>{seperator}</span>}
      
      <div className="product-summary" onClick={() => setShowDetails(!showDetails)}>
        <span className="product-id">#{value.id}</span>
        <span className="product-name">{value.name}</span>
        <span className="product-price">${value.price}</span>
        <span className="expand-indicator">{showDetails ? '[-]' : '[+]'}</span>
      </div>
      
      {showDetails && (
        <div className="product-details">
          <ObjectView 
            value={value.metadata}
            name="metadata"
            expandLevel={typeof expandLevel === 'number' ? expandLevel - 1 : expandLevel}
            objectGrouped={context.objectGrouped}
            arrayGrouped={context.arrayGrouped}
            highlightUpdate={context.highlightUpdate}
          />
        </div>
      )}
    </div>
  );
};
```

### Best Practices for Custom Renderers

1. **Respect Context**: Always use the context values for consistency
2. **Handle Expansion**: Implement expansion logic if your renderer contains nested data
3. **Follow Styling Conventions**: Use the established CSS classes when possible
4. **Performance**: Be mindful of rendering performance for frequently updated data
5. **Accessibility**: Ensure your custom renderers are accessible

### Built-in Custom Renderers

The component comes with these built-in custom renderers:

```tsx
const DEFAULT_CUSTOM_VIEW = new Map([
  [Map, MapView],
  [Set, SetView], 
  [Promise, PromiseView]
]);
```

These can be overridden by providing your own renderers for these constructors.

## Utility Classes

### GroupedObject
Internal utility class for handling object grouping:

```tsx
class GroupedObject {
  constructor(obj: any);
  getSize(): number;
  getKey(): string;
  getObject(): any;
}
```

### ChangeFlashWrapper
Internal component that provides visual feedback when values change, highlighting modified elements briefly. The highlighting behavior can be controlled via the `highlightUpdate` prop.

## CSS Classes

The component uses a comprehensive set of CSS classes for styling:

### Container Classes
- `.jv-root`: Root container element
- `.jv-field`: Generic field container
- `.jv-value`: Container for field values

### Type-Specific Classes
- `.jv-field-object`: Object field containers
- `.jv-field-string`: String field containers  
- `.jv-field-number`: Number field containers
- `.jv-field-boolean`: Boolean field containers
- `.jv-field-function`: Function field containers
- `.jv-field-undefined`: Undefined value containers
- `.jv-field-null`: Null value containers

### Element Classes
- `.jv-name`: Property/field names
- `.jv-type`: Type indicators
- `.jv-value`: Value containers
- `.jv-keyword`: NEW: Keyword value badges (null, undefined, true, false)
- `.jv-meta`: Metadata information (size, length, etc.)
- `.jv-tag`: Special tags (e.g., "circular")
- `.jv-preview`: Preview text for collapsed content
- `.jv-cursor`: Interactive/clickable elements

### State Classes
- `.change-flash`: Applied to elements when values change

## Behavior Details

### Expansion State Management
The component maintains expansion state internally using React state. Each expandable node has a unique path-based key that determines its expanded/collapsed state. The expansion state persists across re-renders.

### Circular Reference Detection
The component tracks object references in a trace array as it traverses the object tree. When the same object reference is encountered again in the current path, it's marked as circular and rendered safely without infinite recursion.

### Change Detection
The `ChangeFlashWrapper` component detects when values change between renders and briefly applies a visual highlight effect to draw attention to the modification.

### Performance Optimizations
1. **Grouping**: Large collections are automatically grouped into ranges
2. **Lazy Rendering**: Content is only rendered when expanded  
3. **Memoization**: Expensive computations are memoized
4. **Efficient Comparison**: Uses reference equality and shallow comparison for change detection

### Special Type Handling

#### Promises
Promises are resolved asynchronously and their state is displayed:
- Pending promises show "status: pending"
- Resolved promises show "status: resolved" with the result
- Rejected promises show "status: rejected" with the error

#### Maps and Sets  
- Maps are converted to object notation with " => " separators between keys and values
- Sets are displayed as arrays without property names

#### Functions
Functions display their source code with truncation for long function bodies.

#### Long Strings
Strings longer than 50 characters are truncated with expand/collapse functionality.

## Error Handling

The component gracefully handles various error conditions:

- **Circular References**: Detected and labeled as "[circular]"
- **Non-Serializable Values**: Displayed using `String()` conversion
- **Undefined Properties**: Clearly marked and typed
- **Prototype Chain**: Only own properties are displayed by default
- **Getters/Setters**: Property descriptors are not evaluated to avoid side effects

## Troubleshooting

### Styles Not Applied

**Problem**: Component renders but has no styling.

**Solution**: Import the CSS file separately:
```tsx
import 'react-obj-view/dist/react-obj-view.css';
```

**Alternative**: If using a CSS-in-JS solution, you can copy the styles from the CSS file.

### TypeScript Errors

**Problem**: TypeScript errors with custom renderers.

**Solution**: Ensure proper typing:
```tsx
import { JSONViewProps, Constructor } from 'react-obj-view';

const customRenderers = new Map<Constructor, React.FC<JSONViewProps>>([
  [MyClass as Constructor, MyRenderer]
]);
```

### Performance Issues

**Problem**: Slow rendering with large objects.

**Solutions**:
- Use appropriate `expandLevel` (start with `1` or `2`)
- Increase `objectGrouped` and `arrayGrouped` thresholds
- Disable `highlightUpdate` for frequently changing data
- Use custom renderers for complex objects

## Accessibility

The component includes basic accessibility features:
- Keyboard navigation support through standard HTML interactions
- Semantic HTML structure
- Clear visual hierarchy
- Screen reader friendly text content

For enhanced accessibility in your application, consider wrapping the component with additional ARIA labels and keyboard event handlers as needed.
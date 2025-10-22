# API Documentation

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
}
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

## Internal Components

The following components are used internally by ObjectView but are not exported for direct use:

### JSONViewObj
Handles rendering of object-like structures (objects, arrays, Maps, Sets).

### StringViewObj  
Specialized renderer for string values with support for long string truncation and expansion.

### FunctionViewObj
Handles function display with source code preview and truncation.

### DefaultValueView
Fallback renderer for primitive values and simple types.

### MapView
Specialized renderer for JavaScript Map objects, displaying key-value pairs.

### SetView  
Specialized renderer for JavaScript Set objects, displaying unique values.

### PromiseView
Handles Promise objects by resolving them and displaying their state (pending, resolved, rejected).

## Type Definitions

### JSONViewCtx
Internal context interface used for managing expansion state and configuration:

```tsx
interface JSONViewCtx {
  expandRoot: Record<string, boolean>;
  setExpandRoot: Dispatch<SetStateAction<Record<string, boolean>>>;
  objectGrouped: number;
  arrayGrouped: number;
}
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
Internal component that provides visual feedback when values change, highlighting modified elements briefly.

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

## Accessibility

The component includes basic accessibility features:
- Keyboard navigation support through standard HTML interactions
- Semantic HTML structure
- Clear visual hierarchy
- Screen reader friendly text content

For enhanced accessibility in your application, consider wrapping the component with additional ARIA labels and keyboard event handlers as needed.
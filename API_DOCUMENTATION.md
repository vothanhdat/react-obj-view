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
  objectGroupSize?: number;
  arrayGroupSize?: number;
  resolver?: Map<Constructor, ResolverFn>;
  highlightUpdate?: boolean;
  preview?: boolean;
  nonEnumerable?: boolean;
}

type Constructor<T = {}> = new (...args: any[]) => T;
type ResolverFn = (value: any, entries: Entry[], isPreview: boolean) => Entry[];
type Entry = { name: PropertyKey; data: any; isNonenumerable: boolean };
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

##### `objectGroupSize?: number`
Threshold for grouping object properties. When an object has more properties than this number, the viewer batches them into virtual slices for better readability and performance.

**Default:** `100`

**Example:**
```tsx
// Group objects with more than 50 properties
<ObjectView value={largeObject} objectGroupSize={50} />
```

##### `arrayGroupSize?: number`
Threshold for grouping array elements. Arrays longer than this number render as collapsible ranges.

**Default:** `10`

**Example:**
```tsx
// Group arrays with more than 20 elements  
<ObjectView value={largeArray} arrayGroupSize={20} />
```

##### `resolver?: Map<Constructor, ResolverFn>`
Override or extend rendering for specific constructors. Resolvers are functions that can reorder, rewrite, or augment the entry list for a value.

**Default:** `undefined` (uses built-in resolvers for `Promise` and `Error`)

**Example:**
```tsx
type Entry = { name: PropertyKey; data: any; isNonenumerable: boolean };
type ResolverFn = (value: any, entries: Entry[], isPreview: boolean) => Entry[];

const resolver = new Map<Function, ResolverFn>([
  [User, (user, iterator, isPreview) => {
    const entries = [...iterator];
    if (isPreview) {
      return [{ name: 'summary', data: user.name, isNonenumerable: false }];
    }
    return entries;
  }],
]);

<ObjectView value={new User('Ada', 'ada@example.com')} resolver={resolver} />;
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

##### `preview?: boolean`
Determines whether inline previews render for collapsed nodes. Set to `false` to skip preview badges entirely.

**Default:** `true`

**Example:**
```tsx
// Only show node names until expanded
<ObjectView value={data} preview={false} />
```

##### `nonEnumerable?: boolean`
Include non-enumerable properties (like `__proto__` or getters) when iterating objects.

**Default:** `true`

**Example:**
```tsx
// Ignore non-enumerable members for a cleaner view
<ObjectView value={data} nonEnumerable={false} />
```

## Internal Components

The ObjectView component now uses a modular architecture with specialized components:

### Core Components

#### ObjectRenderWrapper
Wraps each node, applying resolver overrides, promise resolution, and change-highlighting flash effects.

#### AllChilds / AllChildsPreview  
Materialize child entries for expanded nodes and inline previews. Handle grouping, resolver output, and trace tracking for circular references.

#### ValueInline
Renders inline value previews with type-aware formatting and keyword badges.

### Built-in Resolvers

- **Promise resolver**: exposes computed `status` and resolved/rejected values while preserving existing entries.
- **Error resolver**: prioritizes `name`, `message`, `stack`, and `cause` fields, suppressing duplicate `message` entries.

### Hooks & Utilities

#### useValueInfo
Derives expansion state, grouping metadata, and circular-reference checks for a node.

#### useResolver
Memoizes resolver lookups for the current value/constructor pair.

#### useQuickSubscribe
Internal helper for reading context data quickly within renders.

## Type Definitions


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

The component uses the following CSS classes for styling:

### Root Container
- `.objview-root`: Root container with base font, color, and background settings

### Node Structure
- `.node-default`: Individual node/property container with text overflow handling
- `.node-child`: Nested child container with left padding
- `.node-updated`: Applied to nodes during change detection flash
- `.non-enumrable`: Modifier for non-enumerable properties (reduces opacity)

### Node Elements
- `.name`: Property/field names
- `.value`: Value containers
- `.expand-symbol`: Expand/collapse indicator (▶/▼)
- `.tag-circular`: Badge indicating circular reference detection

### Value Type Classes
- `.type-boolean`: Boolean values
- `.type-number`, `.type-bigint`: Numeric values
- `.type-string`: String values
- `.type-symbol`: Symbol values
- `.type-undefined`: Undefined values
- `.type-null`: Null values
- `.type-function`: Function values
- `.type-object-array`: Array objects
- `.type-object-object`: Plain objects
- `.type-object-regexp`: Regular expressions
- `.type-object-date`: Date objects
- `.type-object-error`: Error objects

### Modifiers
- `.value-preview`: Applied to preview/collapsed value displays

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
```tsx
type Entry = {
  name: any;
  data: any;
  isNonenumerable: boolean;
};

type ResolverFn = (
  value: any,
  entries: Entry[],
  isPreview: boolean
) => Entry[];

interface JSONViewCtx {
  expandLevel: number;
  expandRef: React.RefObject<Record<string, boolean>>;
  preview: boolean;
  nonEnumerable: boolean;
  resolver: Map<any, ResolverFn>;
  arrayGroupSize: number;
  objectGroupSize: number;
  highlightUpdate: boolean;
}
```

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

**Problem**: TypeScript errors while authoring resolver maps.

**Solution**: Define helper types for resolver signatures and reuse them:
```tsx
type Entry = { name: PropertyKey; data: unknown; isNonenumerable: boolean };
type ResolverFn = (value: unknown, entries: Entry[], isPreview: boolean) => Entry[];

const resolvers = new Map<Function, ResolverFn>([
  [MyClass, (value, iterator) => {
    return [...iterator]; // customize as needed
  }],
]);
```

### Performance Issues

**Problem**: Slow rendering with large objects.

**Solutions**:
- Use appropriate `expandLevel` (start with `1` or `2`)
- Increase `objectGroupSize` and `arrayGroupSize` thresholds
- Disable `highlightUpdate` for frequently changing data
- Add resolver overrides to reorder or trim heavy sections

## Accessibility

The component includes basic accessibility features:
- Keyboard navigation support through standard HTML interactions
- Semantic HTML structure
- Clear visual hierarchy
- Screen reader friendly text content

For enhanced accessibility in your application, consider wrapping the component with additional ARIA labels and keyboard event handlers as needed.

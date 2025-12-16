# Improvement Suggestions for react-obj-view

This document outlines concrete, actionable improvements that could enhance the library's API, performance, and developer experience.

---

## 1. API Enhancements

### 1.1 Simplify Expand Level API

**Current Issue**: The `expandLevel` prop accepts `boolean | number` which can be confusing.

**Current Usage**:
```typescript
<ObjectView
  expandLevel={true}    // Expands all (up to depth 100)
  expandLevel={false}   // Collapses all
  expandLevel={3}       // Expands 3 levels
  valueGetter={() => data}
/>
```

**Suggested Improvement**:
```typescript
// Split into two clear props
<ObjectView
  expandLevel={3}       // Number of levels to expand (default: 0)
  expandAll={false}     // Override to expand all levels (default: false)
  valueGetter={() => data}
/>
```

**Implementation**:
```typescript
// In ObjectView.tsx
export type ObjectViewProps = {
  // ... other props
  expandLevel?: number;      // Default: 0
  expandAll?: boolean;       // Default: false
  // ... other props
}

// Usage in component
const expandDepth = expandAll 
  ? 100 
  : (expandLevel ?? 0);
```

### 1.2 Add Search Configuration

**Motivation**: Give users more control over search behavior.

**Suggested Addition**:
```typescript
export type SearchConfig = {
  caseSensitive?: boolean;     // Default: false
  useRegex?: boolean;          // Default: false
  debounceMs?: number;         // Default: 300
  maxResults?: number;         // Default: 1000
  includeKeys?: boolean;       // Default: true
  includeValues?: boolean;     // Default: true
}

export type ObjectViewProps = {
  // ... existing props
  searchConfig?: SearchConfig;
}
```

**Usage**:
```typescript
<ObjectView
  valueGetter={() => data}
  searchConfig={{
    caseSensitive: true,
    maxResults: 500,
    debounceMs: 500
  }}
/>
```

### 1.3 Expand Imperative Handle API

**Current**: Limited to search and scrollToPaths

**Suggested Expansion**:
```typescript
export interface ObjectViewHandle {
  // Existing
  search: (term: string, options?: SearchOptions) => void;
  scrollToPaths: (paths: Key[], options?: ScrollOptions) => Promise<void>;
  
  // New additions
  expandPath: (paths: Key[]) => Promise<void>;
  collapsePath: (paths: Key[]) => void;
  expandAll: () => void;
  collapseAll: () => void;
  refresh: () => void;
  getNodeAtPath: (paths: Key[]) => NodeInfo | null;
  exportToJSON: (paths?: Key[]) => any;
  getExpandedPaths: () => Key[][];
  setExpandedPaths: (paths: Key[][]) => void;
}

// Usage
const ref = useRef<ObjectViewHandle>(null);

// Later...
ref.current?.expandPath(['users', 0, 'address']);
ref.current?.collapseAll();
const node = ref.current?.getNodeAtPath(['config', 'api']);
```

### 1.4 Virtualization Configuration

**Motivation**: Allow fine-tuning of virtualization behavior.

```typescript
export type VirtualizationConfig = {
  overscan?: number;              // Default: 5
  estimatedItemHeight?: number;   // Default: from lineHeight prop
  smoothScrollThreshold?: number; // Default: 100 items
}

export type ObjectViewProps = {
  // ... existing props
  virtualization?: VirtualizationConfig;
}
```

### 1.5 Lifecycle Callbacks

**Motivation**: Allow users to react to specific events.

```typescript
export type ObjectViewCallbacks = {
  onExpand?: (path: Key[]) => void;
  onCollapse?: (path: Key[]) => void;
  onNodeClick?: (path: Key[], value: any) => void;
  onSearchComplete?: (results: SearchResult[]) => void;
  onError?: (error: Error, context: ErrorContext) => void;
}

export type ObjectViewProps = {
  // ... existing props
  callbacks?: ObjectViewCallbacks;
}

// Usage
<ObjectView
  valueGetter={() => data}
  callbacks={{
    onExpand: (path) => console.log('Expanded:', path),
    onNodeClick: (path, value) => {
      // Custom action, e.g., show in side panel
    }
  }}
/>
```

---

## 2. Performance Optimizations

### 2.1 getNodeByIndex Map Caching (Already Correct)

**Status**: ✅ Already implemented correctly

The current implementation in `useReactTree.tsx` (line 113) correctly caches nodes:

```typescript
const getNodeByIndex = useMemo(
    () => {
        let m = new Map<any, FlattenNodeWrapper<T, MetaParser>>();
        
        return (index: number) => {
            let data = m.get(index);
            if (!data) {
                // Create and cache new node
                data = new FlattenNodeWrapper(...);
                m.set(index, data);
            }
            return data;
        };
    },
    [ref.current.instance, walkingResult, reload]
);
```

**Why this works**: The map `m` is created once inside `useMemo` and persists across all calls to the returned function. It's only recreated when dependencies change (instance, walkingResult, or reload), which is the correct behavior.

**Note**: While renaming `m` to `cache` would improve readability, the current implementation is functionally correct and performs well.

### 2.2 Add Max Search Results Limit

**Location**: `SearchComponent.tsx` and `ObjectView.tsx`

```typescript
// In ObjectView.tsx search logic
const searchObj = useMemo(() => {
    return {
        async search(
            searchTerm: string,
            onResult: (paths: Key[][]) => void,
            options: {
                iterateSize?: number,
                maxDepth?: number,
                fullSearch?: boolean,
                normalizeSymbol?: (e: string) => string,
                maxResults?: number,  // NEW
            } = {}
        ) {
            const maxResults = options.maxResults ?? 1000;
            let totalResults = 0;
            let currentResults: Key[][] = []

            // ... existing code ...

            for (let _ of objectTree.travelAndSearch(...)) {
                if (totalResults >= maxResults) {
                    // Stop searching if we hit the limit
                    break;
                }
                
                onResult(currentResults);
                totalResults += currentResults.length;
                currentResults = []
                
                // ... rest of existing code ...
            }
        },
        // ... rest of methods
    }
}, [/* deps */]);
```

### 2.3 Debounce Search Input

**Location**: `SearchComponent.tsx`

```typescript
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";

export const SearchComponent: React.FC<Props> = ({ 
    handleSearch, 
    scrollToPaths, 
    active = true, 
    onClose,
    debounceMs = 300,  // NEW prop
}) => {
    const [searchTerm, setSearchTerm] = useState("")
    const [loading, setLoading] = useState(0)
    
    // Use a ref to store the debounce timer
    const debounceTimer = useRef<NodeJS.Timeout>();
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
    
    // Debounce the search term
    useEffect(() => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        
        debounceTimer.current = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, debounceMs);
        
        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, [searchTerm, debounceMs]);
    
    const deferSearchTerm = useDeferredValue(active ? debouncedSearchTerm : "")
    
    // ... rest of existing code uses deferSearchTerm ...
}
```

### 2.4 Binary Search Iteration Limit (Intentional Safety Guard)

**Location**: `walkingFactory.ts:453`

**Status**: ✅ Working as intended

**Current**:
```typescript
while (start + 1 < end && c++ < 50) {  // Safety limit
    // binary search logic
}
```

**Why the limit exists**: The `c++ < 50` condition is a **safety guard** against potential infinite loops due to bugs. Since binary search is O(log n), even for extremely large trees (2^50 nodes, which is impossible in practice), the loop would complete in 50 iterations. This prevents the application from freezing if there's a bug in the tree structure or search logic.

**Recommendation**: Keep the safety limit as-is. It provides protection against edge cases without any practical performance impact. The limit would only be reached if there's a bug in the code, at which point failing fast is better than freezing.

---

## 3. Developer Experience

### 3.1 Debug Mode

**Motivation**: Provide helpful debug information without polluting production builds.

```typescript
// src/utils/debug.ts
import { isDev } from './isDev';

export const debug = {
    log: (...args: any[]) => {
        if (isDev()) {
            console.log('[react-obj-view]', ...args);
        }
    },
    warn: (...args: any[]) => {
        if (isDev()) {
            console.warn('[react-obj-view]', ...args);
        }
    },
    error: (...args: any[]) => {
        if (isDev()) {
            console.error('[react-obj-view]', ...args);
        }
    },
    time: (label: string) => {
        if (isDev()) {
            console.time(`[react-obj-view] ${label}`);
        }
    },
    timeEnd: (label: string) => {
        if (isDev()) {
            console.timeEnd(`[react-obj-view] ${label}`);
        }
    }
};

// Usage throughout codebase
import { debug } from '../../utils/debug';

debug.log('Expanding path:', paths);
debug.time('Tree traversal');
// ... expensive operation
debug.timeEnd('Tree traversal');
```

### 3.2 Better Error Messages

**Current**: Generic error messages

**Improved**: Context-rich error messages

```typescript
// Create custom error classes
export class TreeNavigationError extends Error {
    constructor(
        public readonly path: PropertyKey[],
        public readonly index: number,
        message: string
    ) {
        super(`TreeNavigationError at path [${path.join(' > ')}] (index ${index}): ${message}`);
        this.name = 'TreeNavigationError';
    }
}

export class SearchError extends Error {
    constructor(
        public readonly searchTerm: string,
        public readonly options: any,
        message: string
    ) {
        super(`SearchError for "${searchTerm}": ${message}`);
        this.name = 'SearchError';
    }
}

// Usage
if (!state.childOffsets || !state.childKeys) {
    throw new TreeNavigationError(
        paths,
        index,
        'Invalid tree state: missing child offsets or keys'
    );
}
```

### 3.3 TypeScript Strict Mode Improvements

**Issue**: CSS custom properties cause TypeScript warnings

**Solution**: Extend React types

```typescript
// src/types/react.d.ts
import 'react';

declare module 'react' {
    interface CSSProperties {
        [key: `--${string}`]: string | number | undefined;
    }
}
```

### 3.4 Performance Monitoring

**Add optional performance monitoring**:

```typescript
export type PerformanceConfig = {
    enabled?: boolean;
    logThreshold?: number;  // ms
    onSlowOperation?: (name: string, duration: number) => void;
}

export type ObjectViewProps = {
    // ... existing props
    performance?: PerformanceConfig;
}

// Usage internally
const perfMonitor = (name: string, fn: () => any) => {
    if (!props.performance?.enabled) return fn();
    
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    
    if (duration > (props.performance.logThreshold ?? 100)) {
        props.performance.onSlowOperation?.(name, duration);
        debug.warn(`Slow operation: ${name} took ${duration.toFixed(2)}ms`);
    }
    
    return result;
};
```

---

## 4. Feature Additions

### 4.1 Export/Import State

**Motivation**: Allow users to save and restore expansion state.

```typescript
// Add to imperative handle
export interface ObjectViewHandle {
    // ... existing methods
    
    exportState: () => {
        expandedPaths: Key[][];
        scrollPosition: number;
        version: string;
    };
    
    importState: (state: {
        expandedPaths: Key[][];
        scrollPosition?: number;
    }) => void;
}

// Usage
const ref = useRef<ObjectViewHandle>(null);

// Save state to localStorage
const saveState = () => {
    const state = ref.current?.exportState();
    if (state) {
        localStorage.setItem('objview-state', JSON.stringify(state));
    }
};

// Restore state
const restoreState = () => {
    const saved = localStorage.getItem('objview-state');
    if (saved) {
        const state = JSON.parse(saved);
        ref.current?.importState(state);
    }
};
```

### 4.2 Regex Search Support

```typescript
// In search logic (ObjectView.tsx), compile regex once before iteration
const searchObj = useMemo(() => {
    return {
        async search(
            searchTerm: string,
            onResult: (paths: Key[][]) => void,
            options: {
                iterateSize?: number,
                maxDepth?: number,
                fullSearch?: boolean,
                normalizeSymbol?: (e: string) => string,
                useRegex?: boolean,
                caseSensitive?: boolean,
            } = {}
        ) {
            let searchTermNormalize = searchTerm.toLowerCase();
            
            // Compile regex once outside the filter function to avoid recreation on every iteration
            let compiledRegex: RegExp | null = null;
            if (options.useRegex) {
                try {
                    compiledRegex = new RegExp(
                        searchTerm, 
                        options.caseSensitive ? '' : 'i'
                    );
                } catch (e) {
                    // Invalid regex, fall back to normal search
                    console.warn('Invalid regex pattern, falling back to text search:', e);
                }
            }
            
            // ... rest of search setup ...
            
            const filterFunctions = (value: any, key: any, paths: any[]) => {
                try {
                    let str = String(key);
                    
                    if (typeof value === 'string' || typeof value === 'number' || /* ... */) {
                        str += " " + String(value);
                    }
                    
                    str = str.toLowerCase();
                    
                    if (options.normalizeSymbol) {
                        str = [...str].map(options.normalizeSymbol).join("")
                    }
                    
                    // Use pre-compiled regex (no recreation on each iteration)
                    if (compiledRegex) {
                        return compiledRegex.test(str);
                    }
                    
                    // Existing token-based search
                    let prevIndex = 0;
                    for (let token of tokens) {
                        prevIndex = str.indexOf(token, prevIndex)
                        if (prevIndex < 0) return false;
                    }
                    return prevIndex > -1;
                    
                } catch (error) {
                    return false
                }
            }
            
            // ... rest of search implementation ...
        }
    }
}, [/* deps */]);
```

### 4.3 Copy Value Enhancement

**Add options to copy actions**:

```typescript
export type CopyFormat = 'json' | 'javascript' | 'yaml' | 'csv';

export type ActionConfig = {
    enableCopy?: boolean;          // Default: true
    copyFormat?: CopyFormat;       // Default: 'json'
    customActions?: ActionDef[];   // User-defined actions
}

// Custom action definition
export type ActionDef = {
    icon: string | React.ReactNode;
    label: string;
    onClick: (value: any, path: Key[]) => void;
    condition?: (value: any) => boolean;  // Show only if true
}

// Usage
<ObjectView
  valueGetter={() => data}
  actionConfig={{
    copyFormat: 'javascript',
    customActions: [
      {
        icon: '📋',
        label: 'Copy path',
        onClick: (value, path) => {
          navigator.clipboard.writeText(path.join('.'));
        }
      },
      {
        icon: '🔗',
        label: 'Copy reference',
        onClick: (value, path) => {
          navigator.clipboard.writeText(`data.${path.join('.')}`);
        },
        condition: (value) => typeof value === 'object'
      }
    ]
  }}
/>
```

---

## 5. Documentation Improvements

### 5.1 Add Architecture Diagram

Create a visual representation of the library structure:

```
┌─────────────────────────────────────────┐
│         Public API (ObjectView)         │
│  - Props normalization                  │
│  - Context setup                        │
└──────────────┬──────────────────────────┘
               │
       ┌───────▼────────┐
       │  React Layer   │
       │ (useReactTree) │
       └───────┬────────┘
               │
       ┌───────▼────────┐
       │   Tree Core    │
       │ (walkingFactory)│
       └───────┬────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
┌───▼───┐  ┌──▼──┐  ┌────▼─────┐
│Object │  │Tree │  │ Virtual  │
│Walker │  │State│  │ Scroller │
└───────┘  └─────┘  └──────────┘
```

### 5.2 Add Performance Guide

Document best practices for performance:

```markdown
# Performance Guide

## Dos and Don'ts

### ✅ DO: Use valueGetter with useMemo/useCallback
```tsx
const data = useMemo(() => ({ /* large data */ }), [dependencies]);
<ObjectView valueGetter={() => data} />
```

### ❌ DON'T: Create new objects inline
```tsx
<ObjectView valueGetter={() => ({ prop: value })} />  // Creates new object every render
```

### ✅ DO: Use appropriate expand levels
```tsx
<ObjectView expandLevel={2} valueGetter={() => data} />  // Only expand 2 levels
```

### ❌ DON'T: Expand everything for large datasets
```tsx
<ObjectView expandAll valueGetter={() => largeData} />  // Will render thousands of nodes
```
```

### 5.3 Add Migration Guide

For users upgrading from older versions:

```markdown
# Migration Guide

## v1.x to v2.x (Proposed)

### API Changes

**expandLevel prop split**
```tsx
// Before
<ObjectView expandLevel={true} />
<ObjectView expandLevel={false} />
<ObjectView expandLevel={3} />

// After
<ObjectView expandAll />
<ObjectView expandLevel={0} />  // or omit (default is 0)
<ObjectView expandLevel={3} />
```

**Search configuration**
```tsx
// Before (not configurable)
// Searches were always case-insensitive with no limit

// After
<ObjectView 
  searchConfig={{
    caseSensitive: true,
    maxResults: 500
  }}
/>
```
```

---

## 6. Testing Improvements

### 6.1 Fix Async Test

**File**: `src/libs/react-tree-view/useReactTree.test.tsx:133`

```typescript
// Current (incorrect)
act(() => {
    index = result.current.expandAndGetIndex(["root", 2] as any);
});

// Fixed (correct)
await act(async () => {
    index = await result.current.expandAndGetIndex(["root", 2] as any);
});

expect(instance.expandPath).toHaveBeenCalledWith(["root", 2]);
expect(instance.getIndexForPath).toHaveBeenCalledWith(["root", 2]);
expect(index).toBe(10);
```

### 6.2 Add Performance Tests

```typescript
// bench/large-dataset.bench.ts
import { describe, bench } from 'vitest';
import { ObjectView } from '../src';

describe('Large dataset performance', () => {
    const largeData = generateLargeObject(10000); // 10k nodes
    
    bench('Initial render', async () => {
        // Measure initial render time
    });
    
    bench('Expand 5 levels', async () => {
        // Measure expansion performance
    });
    
    bench('Search 10k nodes', async () => {
        // Measure search performance
    });
});
```

---

## Implementation Priority

### High Priority (Breaking Changes - Wait for v2.0)
1. ✨ Split expandLevel prop
2. ✨ Add search configuration
3. ✨ Fix getNodeByIndex caching
4. ✨ Add max search results limit

### Medium Priority (Non-breaking - Can add in v1.x)
5. ✨ Expand imperative handle API
6. ✨ Add debug utility
7. ✨ Add lifecycle callbacks
8. ✨ Debounce search input
9. ✨ Better error messages

### Low Priority (Nice to have)
10. ✨ Export/import state
11. ✨ Regex search support
12. ✨ Performance monitoring
13. ✨ Custom action configuration
14. ✨ Documentation improvements

---

## Conclusion

These improvements would make react-obj-view even more powerful and developer-friendly while maintaining backward compatibility for most changes. The breaking changes should be reserved for a v2.0 release.

Many of these suggestions are based on common patterns from popular libraries like React DevTools, Chrome DevTools, and JSON viewers, adapted to fit the unique needs of this library.

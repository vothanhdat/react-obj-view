# Example Data

This folder contains various JavaScript objects designed to test and demonstrate the ObjectView component with different data structures and edge cases.

## Files Overview

### `primitives.ts`
Contains basic JavaScript primitive types and their variations:
- **`primitiveExamples`**: Basic primitives (string, number, boolean, null, undefined, BigInt, Symbol, Date, RegExp, functions, Error)
- **`stringVariations`**: Different string formats (empty, multiline, unicode, escaped characters, HTML, JSON, URLs)
- **`numberVariations`**: Number edge cases (zero, negative, decimal, scientific notation, infinity, NaN, limits)

### `arrays.ts`
Various array structures and array-like objects:
- **`arrayExamples`**: Different array types (empty, numbers, strings, mixed, nested, sparse, large, objects, functions, dates)
- **`arrayLikeObjects`**: Objects that behave like arrays (NodeList simulation, arguments object, typed array samples, large ArrayBuffer/DataView payloads)

The array-like export now contains a dedicated **typed array series** with increasing complexity:
- Small illustrative typed arrays: Uint8 sequences, patterned Uint16 slices, Float32 waveforms
- Stress datasets: 512 KB/1 MB Uint8 buffers, 1 MB Int32 sequences, 1 MB Float64 noise arrays
- Raw binary views: half-meg and full-meg `ArrayBuffer` instances plus `DataView` wrappers for low-level inspection

Use these samples to benchmark rendering performance or demonstrate how `ObjectView` handles binary data without needing to craft your own buffers.

### `objects.ts`
Object structures from simple to complex:
- **`objectExamples`**: Various object patterns including:
  - Simple flat objects
  - Deeply nested structures
  - Circular references
  - Objects with arrays
  - Objects with functions
  - Objects with special values
  - Objects with property descriptors

### `complex.ts`
Complex data structures for advanced testing:
- **`complexStructures`**: Includes:
  - **`deepNesting`**: 10-level deep nested object
  - **`manyProperties`**: Object with 100 properties
  - **`mixedTypes`**: Complex mix of all data types
  - **`problematicData`**: Large data that might cause rendering issues
  - **`apiResponse`**: Real-world API response simulation

### `edgeCases.ts`
JavaScript edge cases and advanced constructs:
- **`edgeCases`**: Advanced JavaScript features:
  - Prototype chain examples
  - Symbol properties
  - Proxy objects
  - WeakMap/WeakSet
  - Map/Set with various key types
  - Generators and iterators
  - Promises and async functions
  - Regular expressions with various flags
  - Built-in JavaScript objects

### `index.ts`
Main export file that combines all examples and provides convenient access:
- **`allExamples`**: Complete collection organized by category
- **`quickExamples`**: Quick access to commonly used test data (simple, moderate, complex)
- **`performanceTestData`**: Data specifically for performance testing (small, medium, large datasets)

## Usage Examples

```typescript
import { allExamples, quickExamples, performanceTestData } from './exampleData';
import { primitiveExamples } from './exampleData/primitives';
import { arrayExamples } from './exampleData/arrays';

// Use all examples
const data = allExamples.primitives.string; // "Hello World"

// Use quick examples for testing
const simpleData = quickExamples.simple;
const complexData = quickExamples.complex;

// Use specific category
const arrayData = arrayExamples.mixed;
const primitiveData = primitiveExamples.date;

// Performance testing
const smallDataset = performanceTestData.small;
const largeDataset = performanceTestData.large;
```

## Categories

### By Complexity
- **Simple**: Basic primitives and simple objects
- **Moderate**: Nested objects and arrays of objects
- **Complex**: Deep nesting, mixed types, large datasets
- **Edge Cases**: Advanced JavaScript constructs and special cases

### By Data Type
- **Primitives**: Basic JavaScript types
- **Arrays**: Various array structures
- **Objects**: Object hierarchies and patterns
- **Collections**: Map, Set, WeakMap, WeakSet
- **Functions**: Regular functions, arrow functions, generators
- **Built-ins**: Date, RegExp, Error, Promise, etc.

### By Use Case
- **Development**: Quick testing during development
- **Performance**: Testing with various data sizes
- **Edge Cases**: Testing component robustness
- **Real-world**: Simulated API responses and user data

## Notes

- All data is TypeScript-compatible
- Circular references are handled appropriately
- Large datasets are provided for performance testing
- Unicode and special characters are included for internationalization testing
- Error objects and edge cases help test component robustness

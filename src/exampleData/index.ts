// Main export file for all example data
export * from './primitives';
export * from './arrays';
export * from './objects';
export * from './complex';
export * from './edgeCases';

// Combined examples for easy access
import { primitiveExamples, stringVariations, numberVariations } from './primitives';
import { arrayExamples, arrayLikeObjects } from './arrays';
import { objectExamples } from './objects';
import { complexStructures } from './complex';
import { edgeCases } from './edgeCases';

export const allExamples = {
  primitives: {
    ...primitiveExamples,
    strings: stringVariations,
    numbers: numberVariations,
  },
  arrays: {
    ...arrayExamples,
    arrayLike: arrayLikeObjects,
  },
  objects: objectExamples,
  complex: complexStructures,
  edge: edgeCases,
};

// Quick access to commonly used test data
export const quickExamples = {
  simple: {
    string: "Hello World",
    number: 42,
    boolean: true,
    null: null,
    undefined: undefined,
    array: [1, 2, 3],
    object: { name: "John", age: 30 },
  },
  
  moderate: {
    nested: {
      user: {
        profile: {
          name: "Jane Smith",
          age: 28,
          contacts: ["email@example.com", "555-0123"],
        },
        settings: {
          theme: "dark",
          notifications: true,
        },
      },
    },
    arrayOfObjects: [
      { id: 1, name: "Alice", active: true },
      { id: 2, name: "Bob", active: false },
      { id: 3, name: "Charlie", active: true },
    ],
  },
  
  complex: {
    mixedTypes: {
      strings: ["hello", "world"],
      numbers: [1, 2.5, -3, Infinity, NaN],
      dates: [new Date(), new Date("2023-01-01")],
      functions: [
        function namedFunction() { return "named"; },
        () => "arrow",
        Math.random,
      ],
      errors: [
        new Error("Sample error"),
        new TypeError("Type error"),
      ],
      collections: new Map<string, any>([
        ["key1", "value1"],
        ["key2", { nested: "object" }],
      ]),
    },
  },
};

// Test data specifically for performance testing
export const performanceTestData = {
  small: Array.from({ length: 10 }, (_, i) => ({ id: i, value: `item-${i}` })),
  medium: Array.from({ length: 100 }, (_, i) => ({ 
    id: i, 
    value: `item-${i}`,
    metadata: {
      created: new Date(2023, 0, i + 1),
      tags: [`tag-${i % 5}`, `category-${Math.floor(i / 10)}`],
    },
  })),
  large: Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    value: `item-${i}`,
    description: `This is item number ${i} with some additional text to make it longer`,
    metadata: {
      created: new Date(2023, 0, (i % 365) + 1),
      modified: new Date(2023, (i % 12), (i % 28) + 1),
      tags: Array.from({ length: (i % 5) + 1 }, (_, j) => `tag-${i}-${j}`),
      stats: {
        views: Math.floor(Math.random() * 1000),
        likes: Math.floor(Math.random() * 100),
        shares: Math.floor(Math.random() * 50),
      },
    },
    relations: {
      parent: i > 0 ? i - 1 : null,
      children: i < 999 ? [i + 1, i + 2].filter(x => x < 1000) : [],
    },
  })),
  supperLarge: Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    value: `item-${i}`,
    description: `This is item number ${i} with some additional text to make it longer`,
    metadata: {
      created: new Date(2023, 0, (i % 365) + 1),
      modified: new Date(2023, (i % 12), (i % 28) + 1),
      tags: Array.from({ length: (i % 5) + 1 }, (_, j) => `tag-${i}-${j}`),
      stats: {
        views: Math.floor(Math.random() * 1000),
        likes: Math.floor(Math.random() * 100),
        shares: Math.floor(Math.random() * 50),
      },
    },
    relations: {
      parent: i > 0 ? i - 1 : null,
      children: i < 999 ? [i + 1, i + 2].filter(x => x < 1000) : [],
    },
  })),
  suppersupperLarge: Array.from({ length: 100000 }, (_, i) => ({
    id: i,
    value: `item-${i}`,
    description: `This is item number ${i} with some additional text to make it longer`,
    metadata: {
      created: new Date(2023, 0, (i % 365) + 1),
      modified: new Date(2023, (i % 12), (i % 28) + 1),
      tags: Array.from({ length: (i % 5) + 1 }, (_, j) => `tag-${i}-${j}`),
      stats: {
        views: Math.floor(Math.random() * 1000),
        likes: Math.floor(Math.random() * 100),
        shares: Math.floor(Math.random() * 50),
      },
    },
    relations: {
      parent: i > 0 ? i - 1 : null,
      children: i < 999 ? [i + 1, i + 2].filter(x => x < 1000) : [],
    },
  })),
  massive: Array.from({ length: 400000 }, (_, i) => ({
    id: i,
    col1: `val-${i}-1`,
    col2: i * 2,
    col3: i % 2 === 0,
    col4: new Date(),
    col5: null,
    col6: undefined,
    col7: [i, i + 1],
    col8: { nested: i },
    col9: `text-${i}`,
    col10: i / 10,
    col11: i * 10,
    col12: `status-${i % 5}`,
    col13: i > 200000,
    col14: [1, 2, 3],
    col15: { a: 1, b: 2 },
    col16: `tag-${i}`,
    col17: i + 100,
    col18: i - 100,
    col19: `code-${i.toString(16)}`,
    col20: 'end'
  })),
};
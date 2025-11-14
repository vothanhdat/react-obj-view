# Testing Guide for react-obj-view

This document provides comprehensive information about the testing infrastructure and practices for the react-obj-view library.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Testing Framework](#testing-framework)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Test Coverage](#test-coverage)
- [Writing Tests](#writing-tests)
- [CI/CD Integration](#cicd-integration)

## Overview

The react-obj-view library uses a comprehensive test suite with 230+ tests covering:
- Utility functions
- Core engine (CircularChecking, StateFactory, walkingToIndexFactory)
- Resolver functions (Map, Set, Promise, Iterator)
- React components
- Integration scenarios
- Edge cases

## Prerequisites

### System Requirements

- **Node.js**: 22.x or 24.x
- **Yarn**: 4.x (recommended package manager)

### Setup

1. **Install Node.js**: Use nvm (Node Version Manager) for easy version switching
   ```bash
   # Install nvm (if not already installed)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   
   # Use the version specified in .nvmrc
   nvm use
   # or
   nvm install 22
   nvm use 22
   ```

2. **Enable Corepack** (for Yarn 4 support)
   ```bash
   corepack enable
   ```

3. **Install dependencies**
   ```bash
   yarn install
   ```

## Testing Framework

We use **Vitest** as our testing framework because:
- Native ESM support
- Fast execution with smart caching
- Compatible with Vite build system
- Great developer experience with watch mode
- Built-in coverage reporting

### Dependencies

- `vitest` - Test runner and framework
- `@vitest/ui` - Web-based UI for test results
- `@testing-library/react` - React component testing utilities
- `@testing-library/jest-dom` - Custom matchers for DOM assertions
- `happy-dom` - Lightweight DOM implementation for tests

## Running Tests

### Basic Commands

```bash
# Run all tests once
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with UI dashboard
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

### Vitest Configuration

The test configuration is located in `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/test/**',
        'src/dev.tsx',
        'src/Test.tsx',
        'src/V5/test.ts',
        'src/V5/test2.ts',
        'src/V5/benkmark.ts',
        'src/exampleData/**',
      ],
    },
  },
})
```

## Test Structure

### Directory Layout

```
src/
├── utils/
│   ├── joinClasses.ts
│   └── joinClasses.test.ts           # 6 tests
├── V5/
│   ├── index.tsx
│   ├── index.test.tsx                # 26 tests (component)
│   ├── integration.test.tsx          # 22 tests (integration)
│   ├── useFlattenObjectView.tsx
│   ├── test.ts / test2.ts / benkmark.ts
│   └── (hooks, components, themes…)
├── objectWalker/
│   ├── utils/
│   │   ├── object.ts
│   │   ├── object.test.ts            # 8 tests
│   │   ├── groupedProxy.ts
│   │   └── groupedProxy.test.ts      # 12 tests
│   ├── resolvers/
│   │   ├── collections.ts
│   │   ├── collections.test.ts       # 15 tests
│   │   ├── promise.ts
│   │   └── promise.test.ts           # 9 tests
│   ├── CircularChecking.ts
│   ├── CircularChecking.test.ts      # 27 tests
│   ├── LazyValueWrapper.ts
│   └── LazyValueWrapper.test.ts      # 16 tests
└── test/
    └── setup.ts                      # Test setup & globals

packages/tree-core/
└── src/
    ├── StateFactory.ts
    ├── StateFactory.test.ts          # 19 tests
    ├── walkingToIndexFactory.ts
    ├── walkingToIndexFactory.test.ts # 42 tests
```

### Test File Naming

- Unit tests: `*.test.ts` or `*.test.tsx`
- Co-located with source files for easy discovery
- Integration tests: Clearly named (e.g., `integration.test.tsx`)

## Test Coverage

### Current Test Statistics

- **Total Tests**: 230
- **Test Files**: 12
- **Pass Rate**: 100%

### Coverage by Category

#### 1. Utility Functions (26 tests)
- **joinClasses.test.ts** (6 tests)
  - Class name joining
  - Falsy value filtering
  - Edge cases (empty, single class)

- **object.test.ts** (8 tests, `src/objectWalker/utils`)
  - Property value retrieval
  - Getter handling
  - Error handling
  - Symbol properties

- **groupedProxy.test.ts** (12 tests, `src/objectWalker/utils`)
  - Proxy factory creation
  - Array and object grouping
  - Caching behavior
  - Equality checking

#### 2. Core Engine (116 tests)
- **CircularChecking.test.ts** (27 tests)
  - Circular reference detection
  - Enter/exit node tracking
  - LIFO stack management
  - Multiple object handling

- **StateFactory.test.ts** (19 tests)
  - State creation and caching
  - Child state management
  - State persistence
  - Read-only state access

- **getObjectUniqueId.test.ts** (30 tests)
  - Unique ID generation
  - Object type handling (arrays, maps, sets, dates, etc.)
  - ID consistency and caching
  - Memory management with WeakMap

- **walkingToIndexFactory.test.ts** (40 tests)
  - Tree walking and indexing
  - Node expansion and collapse
  - Circular reference handling
  - State caching and updates
  - Path navigation

#### 4. Resolver Functions (40 tests)
- **collections.test.ts** (15 tests)
  - Map resolver (preview & normal modes)
  - Set resolver (preview & normal modes)
  - Iterator resolver
  - CustomEntry and CustomIterator classes

- **promise.test.ts** (9 tests)
  - Promise status tracking
  - Resolved promise handling
  - Rejected promise handling
  - InternalPromise wrapper

- **LazyValueWrapper.test.ts** (16 tests)
  - Instance creation and caching
  - Property initialization
  - Getter evaluation
  - Error handling

#### 5. Component Tests (26 tests)
- **index.test.tsx** (26 tests)
  - Primitive value rendering
  - Object and array rendering
  - Special data types (Map, Set, Date, RegExp, Error)
  - Props (expandLevel, className, style, lineHeight)
  - Complex scenarios (nested structures, large arrays)

#### 6. Integration Tests (22 tests)
- **integration.test.tsx** (22 tests)
  - Circular references (simple, nested, array, mutual)
  - Complex nested structures
  - Performance scenarios (large arrays/objects)
  - Edge cases (empty, sparse arrays, typed arrays, frozen objects)
  - Data updates and highlighting

## Writing Tests

### Test Structure Example

```typescript
import { describe, it, expect } from 'vitest'
import { functionToTest } from './module'

describe('Module Name', () => {
  describe('functionToTest', () => {
    it('should handle basic case', () => {
      const result = functionToTest('input')
      expect(result).toBe('expected')
    })

    it('should handle edge case', () => {
      const result = functionToTest(null)
      expect(result).toBeUndefined()
    })
  })
})
```

### Component Test Example

```typescript
import { render } from '@testing-library/react'
import { ObjectView } from './index'

describe('ObjectView', () => {
  it('should render basic data', () => {
    const { container } = render(
      <ObjectView valueGetter={() => ({ a: 1 })} name="data" />
    )
    
    expect(container.querySelector('.big-objview-root')).toBeTruthy()
  })
})
```

### Best Practices

1. **Descriptive Test Names**: Use clear, descriptive names that explain what is being tested
2. **Arrange-Act-Assert**: Structure tests with setup, execution, and verification phases
3. **One Assertion Per Test**: Focus each test on a single behavior
4. **Test Edge Cases**: Include tests for null, undefined, empty values, errors
5. **Use Proper Matchers**: Use specific matchers (toBeNull, toBeUndefined, toBeInstanceOf)
6. **Avoid Test Interdependence**: Each test should be independent and runnable in isolation

### Mocking with Vitest

```typescript
import { vi } from 'vitest'

it('should call callback', () => {
  const callback = vi.fn()
  functionThatCallsCallback(callback)
  
  expect(callback).toHaveBeenCalled()
  expect(callback).toHaveBeenCalledWith(expectedArg)
})
```

### Async Testing

```typescript
it('should handle promises', async () => {
  const promise = Promise.resolve(42)
  const result = await promise
  
  expect(result).toBe(42)
})
```

## CI/CD Integration

### GitHub Actions Workflows

The project includes two GitHub Actions workflows:

#### 1. CI Tests (`.github/workflows/ci.yml`)

Tests the library against multiple Node.js versions to ensure compatibility:

```yaml
name: CI Tests

on:
  push:
    branches: [ master, main ]
  pull_request:
    branches: [ master, main ]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [22.x, 24.x]
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          
      - name: Enable Corepack
        run: corepack enable
        
      - name: Install dependencies
        run: yarn install --frozen-lockfile
        
      - name: Run tests
        run: yarn test
        
      - name: Build
        run: yarn build
```

This workflow:
- Runs on every push and pull request
- Tests against Node.js 22.x and 24.x
- Uses Yarn 4 (enabled via Corepack)
- Runs both tests and build to ensure everything works

#### 2. Deploy Demo (`.github/workflows/deploy-demo.yml`)

Deploys the demo site to GitHub Pages when changes are pushed to master.

### Local CI Simulation

To simulate CI locally:

```bash
# Test with Node 22
nvm use 22
yarn install
yarn test
yarn build

# Test with Node 24
nvm use 24
yarn install
yarn test
yarn build
```

## Debugging Tests

### Watch Mode
```bash
npm run test:watch
```
- Auto-reruns tests on file changes
- Press `t` to filter by test name pattern
- Press `p` to filter by file name pattern
- Press `a` to rerun all tests

### UI Mode
```bash
npm run test:ui
```
- Opens a browser-based test UI
- Visual test results
- Interactive test filtering
- Detailed error messages

### Debugging in VSCode

Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
  "args": ["run"],
  "console": "integratedTerminal"
}
```

## Coverage Reports

### Generating Coverage

```bash
npm run test:coverage
```

This generates:
- Terminal output (summary)
- HTML report in `coverage/` directory
- JSON report for CI/CD integration

### Viewing HTML Coverage

```bash
npm run test:coverage
# Open coverage/index.html in browser
```

## Common Testing Patterns

### Testing Error Conditions

```typescript
it('should handle errors gracefully', () => {
  expect(() => {
    throwingFunction()
  }).toThrow('Expected error message')
})
```

### Testing with Different Data Types

```typescript
it.each([
  [1, 'number'],
  ['text', 'string'],
  [true, 'boolean'],
  [null, 'null'],
  [undefined, 'undefined'],
])('should handle %s (%s)', (value, type) => {
  const result = processValue(value)
  expect(result).toBeDefined()
})
```

### Testing React Component Updates

```typescript
it('should update on prop change', () => {
  const { rerender } = render(<Component value={1} />)
  
  // Update props
  rerender(<Component value={2} />)
  
  // Assert on updated state
  expect(screen.getByText('2')).toBeInTheDocument()
})
```

## Troubleshooting

### Common Issues

**Tests fail with module resolution errors**
- Check import paths
- Ensure test files are co-located with source files
- Verify vitest.config.ts paths

**Tests timeout**
- Increase timeout in test: `it('test', { timeout: 10000 }, async () => {})`
- Check for unresolved promises
- Ensure async/await usage is correct

**React component tests fail**
- Ensure @testing-library/react is installed
- Check that happy-dom environment is configured
- Verify component imports are correct

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all tests pass: `npm test`
3. Check coverage: `npm run test:coverage`
4. Add tests for edge cases
5. Update this documentation if needed

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
